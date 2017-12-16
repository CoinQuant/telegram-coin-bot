const Telegraf = require('telegraf');
const _ = require('lodash');
const moment = require('moment');
const logger = require('./logger')('index');

let exchange_CNY_TO_USD = 0;

logger.info('start servering...');

// =============================================
// ========== start exchange listener ==========
// =============================================
const exchangeEE = require('./datasources/exchange');
exchangeEE.startListen();
exchangeEE.on('exchange_update', data => {
  logger.debug(`update exchange_CNY_TO_USD to ${exchange_CNY_TO_USD}`);
  exchange_CNY_TO_USD = data;
});
// =============================================
// =========== end exchange listener ===========
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
