const BFX = require('bitfinex-api-node');
const Telegraf = require('telegraf');
const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');
const { request } = require('urllib');

const API_KEY = null;
const API_SECRET = null;
const opts = {
  version: 2,
  transform: true
};
const bws = new BFX(API_KEY, API_SECRET, opts).ws;

const token = process.env.token;
if (!token) throw new Error('token should be provided!');
const app = new Telegraf(token);

const logger = new winston.Logger({
  transports: [new winston.transports.Console()]
});

const candlesStore = new Map();
let exchange_CNY_TO_USD = 0;

setInterval(() => {
  request('http://api.fixer.io/latest?base=USD', { dataType: 'json' })
    .then(result => {
      const exchange = _.get(result, 'data.rates.CNY');
      if (_.isNumber(exchange)) exchange_CNY_TO_USD = exchange;
      else
        logger.warn(
          `exchange value is invalid: ${JSON.stringify(result.data)}`
        );
    })
    .catch(err => {
      logger.error(err);
    });
}, 10000);

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

const _processCandleItems = data => {
  let result = '';
  _.keys(data).forEach(key => {
    if (exchange_CNY_TO_USD)
      result += `${key}: ¥${(data[key] * exchange_CNY_TO_USD).toFixed(3)}\n`;
    else result += `${key}: $${data[key]}\n`;
  });
  return result;
};

const _processCandles = coinName => {
  let result = '';
  if (coinName) {
    const item = candlesStore.get(coinName);
    if (item) {
      result = _processCandleItems(item);
    } else result = '暂无行情';
  } else {
    if (candlesStore.size != 0) {
      candlesStore.forEach((value, key) => {
        const name = _.slice(key, 1, key.length).join('');
        const data = _.omit(value, 'MTS');
        result += `${name}:\n${_processCandleItems(data)}\n`;
      });
    } else result = '暂无行情';
  }
  return result;
};

app.command('start', ({ from, reply }) => {
  return reply('Welcome!');
});
app.command('mkt', ({ from, message, reply }) => {
  const parameters = _.split(message.text, ' ');
  if (parameters && parameters.length > 1 && parameters[1]) {
    const coinName = `t${_.upperCase(parameters[1])}USD`;
    if (!_.includes(['tBTCUSD', 'tLTCUSD', 'tETHUSD', 'tXRPUSD'], coinName))
      return reply('并没有这个币, 要不 ICO 来一波？');
    else return reply(_processCandles(coinName));
  } else return reply(_processCandles());
});
app.startPolling();
