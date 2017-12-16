const Telegraf = require('telegraf');
const _ = require('lodash');
const moment = require('moment');
const logger = require('./utils/logger')('index');
const {
  EXCHANGE_FIXER_UPDATE,
  MARKET_BITFINEX_UPDATE,
  MARKET_HUOBI_UPDATE
} = require('./utils/enums');

let exchange_CNY_TO_USD = 0;

logger.info('start servering...');

// =============================================
// ========== start exchange listener ==========
// =============================================
// const exchangeEE = require('./datasources/exchange');
// exchangeEE.startListening();
// exchangeEE.on('exchange_update', data => {
//   exchange_CNY_TO_USD = data;
//   logger.debug(`update exchange_CNY_TO_USD to ${exchange_CNY_TO_USD}`);
// });
// =============================================
// =========== end exchange listener ===========
// =============================================

// =============================================
// ========== start bitfinex listener ==========
// =============================================
// const bitfinexEE = require('./datasources/markets/bitfinex')();
// bitfinexEE.startListening();
// bitfinexEE.on(MARKET_BITFINEX_UPDATE, data => {
//   logger.debug(`lastest bitfinex data: ${JSON.stringify(data)}`);
// });
// =============================================
// =========== end bitfinex listener ===========
// =============================================

// =============================================
// =========== start huobi listener ============
// =============================================
const huobiEE = require('./datasources/markets/huobi')();
const huobiStorage = new Map();
huobiEE.startListening();
huobiEE.on(MARKET_HUOBI_UPDATE, ({ pair, price }) => {
  huobiStorage.set(pair, price);
  logger.debug(`lastest huobi data: {${pair}: ${JSON.stringify(price)}}`);
});
// =============================================
// ============ end huobi listener =============
// =============================================

// const token = process.env.token;
// if (!token) throw new Error('token should be provided!');
// const app = new Telegraf(token);

// const candlesStore = new Map();

// const _processCandleItems = data => {
//   let result = '';
//   _.keys(data).forEach(key => {
//     if (exchange_CNY_TO_USD)
//       result += `${key}: ¥${(data[key] * exchange_CNY_TO_USD).toFixed(3)}\n`;
//     else result += `${key}: $${data[key]}\n`;
//   });
//   return result;
// };

// const _processCandles = coinName => {
//   let result = '';
//   if (coinName) {
//     const item = candlesStore.get(coinName);
//     if (item) {
//       result = _processCandleItems(item);
//     } else result = '暂无行情';
//   } else {
//     if (candlesStore.size != 0) {
//       candlesStore.forEach((value, key) => {
//         const name = _.slice(key, 1, key.length).join('');
//         const data = _.omit(value, 'MTS');
//         result += `${name}:\n${_processCandleItems(data)}\n`;
//       });
//     } else result = '暂无行情';
//   }
//   return result;
// };

// app.command('start', ({ from, reply }) => {
//   return reply('Welcome!');
// });
// app.command('mkt', ({ from, message, reply }) => {
//   const parameters = _.split(message.text, ' ');
//   if (parameters && parameters.length > 1 && parameters[1]) {
//     const coinName = `t${_.upperCase(parameters[1])}USD`;
//     if (!_.includes(['tBTCUSD', 'tLTCUSD', 'tETHUSD', 'tXRPUSD'], coinName))
//       return reply('并没有这个币, 要不 ICO 来一波？');
//     else return reply(_processCandles(coinName));
//   } else return reply(_processCandles());
// });
// app.startPolling();
