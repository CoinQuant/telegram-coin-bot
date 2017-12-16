const BFX = require('bitfinex-api-node');
const logger = require('./logger').getLogger('datasource', 'bitfinex');

const API_KEY = null;
const API_SECRET = null;
const opts = {
  version: 2,
  transform: true
};
const bws = new BFX(API_KEY, API_SECRET, opts).ws;

bws.on('open', () => {
  bws.subscribeCandles('tBTCUSD', '1m');
  bws.subscribeCandles('tLTCUSD', '1m');
  bws.subscribeCandles('tETHUSD', '1m');
  bws.subscribeCandles('tXRPUSD', '1m');
});

bws.on('subscribed', data => {
  logger.info('New subscription', data);
});

bws.on('candles', (pair, data) => {
  if (!_.isArray(data)) candlesStore.set(pair, data);
  else logger.debug('skip initial data series');
});
