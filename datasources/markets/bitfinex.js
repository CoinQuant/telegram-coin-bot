const EE = require('events');
const BFX = require('bitfinex-api-node');
const _ = require('lodash');
const logger = require('../../utils/logger')('datasource', 'bitfinex');
const { MARKET_BITFINEX_UPDATE } = require('../../utils/enums');

const _dataParser = (rawPair, rawData) => {
  if (!rawPair || !rawData) {
    throw Error('empty pair name or data');
  } else {
    const pair = _.slice(rawPair, 1, rawPair.length - 3).join('');
    const data = _.omit(rawData, 'MTS');
    return { [pair]: data };
  }
};
class BitfinexEvent extends EE {
  constructor(apiKey, apiSecret) {
    super();
    this.API_KEY = apiKey;
    this.API_SECRET = apiSecret;
  }
  startListening() {
    const opts = {
      version: 2,
      transform: true
    };
    const bws = new BFX(this.API_KEY, this.API_SECRET, opts).ws;
    bws.on('open', () => {
      bws.subscribeCandles('tBTCUSD', '1m');
      bws.subscribeCandles('tLTCUSD', '1m');
      bws.subscribeCandles('tETHUSD', '1m');
      bws.subscribeCandles('tXRPUSD', '1m');
    });
    bws.on('subscribed', data => {
      logger.info('Subscription established', data);
    });
    bws.on('candles', (rawPair, rawData) => {
      logger.debug(`market data [${rawPair}] received`);
      logger.debug(`market data [${rawPair}]: ${JSON.stringify(rawData)}`);
      if (!_.isArray(rawData)) {
        try {
          this.emit(MARKET_BITFINEX_UPDATE, _dataParser(rawPair, rawData));
        } catch (err) {
          logger.error(err);
        }
      } else {
        logger.debug('skip initial data series');
        logger.silly(`initial data series: ${JSON.stringify(rawData)}`);
      }
    });
  }
}

module.exports = (apiKey, apiSecret) => {
  logger.info(
    `BitfinexEvent initialized with apiKey: ${apiKey} and apiSecret: ${apiSecret}`
  );
  return new BitfinexEvent(apiKey, apiSecret);
};
