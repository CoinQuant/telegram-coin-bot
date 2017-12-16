const EE = require('events');
const WebSocket = require('ws');
const pako = require('pako');
const _ = require('lodash');
const logger = require('../../utils/logger')('datasource', 'huobi');
const { MARKET_HUOBI_UPDATE } = require('../../utils/enums');

const _decompressionMsg = rawMsg => {
  const inflatedJsonString = pako.inflate(new Uint8Array(rawMsg), {
    to: 'string'
  });
  return JSON.parse(inflatedJsonString);
};

const _compressionMsg = rawData => {
  let data = rawData;
  if (!_.isString(data)) data = JSON.stringify(rawData);
  return data;
};

const _genMktSubscribeReq = symbol => {
  symbol = _.toLower(symbol);
  const subField = `market.${symbol}.kline.1min`;
  const idField = `substribe.${symbol}`;
  return {
    sub: subField,
    id: idField
  };
};

const _filterTick = tick => {
  return _.pick(tick, ['open', 'close', 'low', 'high']);
};

const _dataParser = (rawPair, data) => {
  if (!rawPair || !data) {
    throw Error('empty pair name or data');
  } else {
    let pair = _.endsWith(rawPair, 'btc')
      ? _.replace(rawPair, 'btc', '')
      : rawPair;
    pair = _.endsWith(pair, 'usdt') ? _.replace(pair, 'usdt', '') : pair;
    pair = _.toUpper(pair);
    return { [pair]: data };
  }
};

class HuobiEvent extends EE {
  constructor() {
    super();
    this.usdtTransList = [
      'BTCUSDT',
      'ETHUSDT',
      'LTCUSDT',
      'ETCUSDT',
      'BCCUSDT'
    ];
    this.btcTransList = ['KNCBTC', 'ZRXBTC', 'ASTBTC', 'RCNBTC'];
    this.wholeList = _.concat(this.usdtTransList, this.btcTransList);
    this.exchangeBtcToUsdt = 0;
  }
  startListening() {
    const ws = new WebSocket('wss://api.huobi.pro/ws');
    ws.binaryType = 'arraybuffer';
    ws.on('open', event => {
      _.forEach(this.wholeList, el =>
        ws.send(_compressionMsg(_genMktSubscribeReq(el)))
      );
      ws.on('message', msg => {
        const data = _decompressionMsg(msg);

        // --------------------------
        // deal with server heartbeat
        // { "ping": 1513431384980 }
        // --------------------------
        if (_.get(data, 'ping')) {
          logger.debug(
            'received ping from server and will respond pong for it'
          );
          ws.send(_compressionMsg({ pong: data.ping }));
        }
        // --------------------------

        // --------------------------
        // deal with subscrition message
        // --------------------------
        if (_.get(data, 'id') && _.get(data, 'status')) {
          const status = _.get(data, 'status');
          // clear
          // {
          //   "id": "id1",
          //   "status": "ok",
          //   "subbed": "market.btcusdt.kline.1min",
          //   "ts": 1489474081631
          //   "data": [tick1, tick2...]
          // }
          if (status === 'ok') {
            const [market, symbol, kline, freq] = _.split(
              _.get(data, 'subbed'),
              '.'
            );
            const lastestTick = _.last(_.get(data, 'data'));
            // set exchange for BTCUSDT for the first time
            if (symbol === 'btcusdt') {
              this.exchangeBtcToUsdt = _.get(lastestTick, 'close');
            }
            let price = _filterTick(lastestTick);
            // transfer from xxxbtc to xxxusdt
            // when symbol in list and btcusdt exchange updated
            if (
              _.includes(this.btcTransList, _.toUpper(symbol)) &&
              this.exchangeBtcToUsdt
            ) {
              price = _.reduce(
                _.keys(price),
                (result, idx) => {
                  result[idx] = price[idx] * this.exchangeBtcToUsdt;
                  return result;
                },
                {}
              );
            }
            this.emit(MARKET_HUOBI_UPDATE, _dataParser(symbol, price));
            logger.info(`${symbol}_${freq} subscription established`);
          } else {
            logger.debug(data);
            let errorMsg = "couldn't get subscription";
            // apparent error
            // {
            //   "id": "id2",
            //   "status": "error",
            //   "err-code": "bad-request",
            //   "err-msg": "invalid topic market.invalidsymbol.kline.1min",
            //   "ts": 1494301904959
            // }
            if (status === 'error' && _.get(data, 'err-msg')) {
              errorMsg = _.get(data, 'err-msg');
            }
            logger.warn(errorMsg);
          }
        }
        // --------------------------

        // --------------------------
        // deal with kline update
        // {
        //   "ch": "market.btcusdt.kline.1min",
        //   "ts": 1489474082831,
        //   "tick":
        //     {
        //        "id": 1489464480,
        //        "amount": 0.0,
        //        "count": 0,
        //        "open": 7962.62,
        //        "close": 7962.62,
        //        "low": 7962.62,
        //        "high": 7962.62,
        //        "vol": 0.0
        //     }
        // }
        // --------------------------
        if (_.get(data, 'ch') && _.get(data, 'tick')) {
          const [market, symbol, kline, freq] = _.split(_.get(data, 'ch'), '.');
          logger.info(`market data [${symbol}_${freq}] received`);
          let price = _filterTick(_.get(data, 'tick'));
          // update exchange for BTCUSDT
          if (symbol === 'btcusdt')
            this.exchangeBtcToUsdt = _.get(price, 'close');
          // transfer from xxxbtc to xxxusdt
          // when symbol in list and btcusdt exchange updated
          if (
            _.includes(this.btcTransList, _.toUpper(symbol)) &&
            this.exchangeBtcToUsdt
          ) {
            price = _.reduce(
              _.keys(price),
              (result, idx) => {
                result[idx] = price[idx] * this.exchangeBtcToUsdt;
                return result;
              },
              {}
            );
          }
          this.emit(MARKET_HUOBI_UPDATE, _dataParser(symbol, price));
        }
        // --------------------------
      });
    });
  }
}

module.exports = () => new HuobiEvent();
