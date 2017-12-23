const Telegraf = require('telegraf');
const _ = require('lodash');
const moment = require('moment');
const logger = require('./utils/logger')('index');
const {
  EXCHANGE_FIXER_UPDATE,
  MARKET_BITFINEX_UPDATE,
  MARKET_HUOBI_UPDATE,
  MSG_NOT_AVALID_COIN_NAME
} = require('./utils/enums');

let exchange_CNY_TO_USD = 0;

logger.info('start servering...');

// =============================================
// ========== start exchange listener ==========
// =============================================
const exchangeEE = require('./datasources/exchange');
exchangeEE.startListening();
exchangeEE.on(EXCHANGE_FIXER_UPDATE, data => {
  exchange_CNY_TO_USD = data;
  logger.debug(`update exchange_CNY_TO_USD to ${exchange_CNY_TO_USD}`);
});
// // =============================================
// // =========== end exchange listener ===========
// // =============================================

// // =============================================
// // ========== start bitfinex listener ==========
// // =============================================
const bitfinexEE = require('./datasources/markets/bitfinex')();
const bitfinexStorage = new Map();
bitfinexEE.startListening();
bitfinexEE.on(MARKET_BITFINEX_UPDATE, ({ pair, price }) => {
  bitfinexStorage.set(pair, price);
  logger.debug(`lastest bitfinex data: {${pair}: ${JSON.stringify(price)}}`);
});
// // =============================================
// // =========== end bitfinex listener ===========
// // =============================================

// // =============================================
// // =========== start huobi listener ============
// // =============================================
const huobiEE = require('./datasources/markets/huobi')();
const huobiStorage = new Map();
huobiEE.startListening();
huobiEE.on(MARKET_HUOBI_UPDATE, ({ pair, price }) => {
  huobiStorage.set(pair, price);
  logger.debug(`lastest huobi data: {${pair}: ${JSON.stringify(price)}}`);
});
// // =============================================
// // ============ end huobi listener =============
// // =============================================

const token = process.env.telegram_coin_bot_token;
if (!token) throw new Error('token should be provided!');
const bot = new Telegraf(token);

const _serializeItem = (broker, tick) => {
  let result = broker + '\n';
  _.keys(tick).forEach(key => {
    if (exchange_CNY_TO_USD)
      result += `${key}: ¥${(tick[key] * exchange_CNY_TO_USD).toFixed(3)}\n`;
    else result += `${key}: $${tick[key]}\n`;
  });
  return result;
};

const _serializeResponseData = name => {
  const bitfinexTick = bitfinexStorage.get(name);
  const huobiTick = huobiStorage.get(name);
  if (_.isEmpty(bitfinexTick) && _.isEmpty(huobiTick)) {
    return '币名无效或行情数据无效，有效的币名列表请使用"/coins"命令查看';
  }
  let result = '';
  if (!_.isEmpty(bitfinexTick))
    result += _serializeItem('BITFINEX', bitfinexTick);
  if (!_.isEmpty(huobiTick)) {
    if (!_.isEmpty(result)) result += '--------------------\n';
    result += _serializeItem('HUOBI', huobiTick);
  }
  return result;
};

bot.start(ctx => {
  return ctx.reply('Welcome to use Telegram Coin Bot!');
});
bot.command('mkt', ({ from, message, reply }) => {
  const parameters = _.split(message.text, ' ');
  if (parameters && parameters.length > 1 && parameters[1])
    return reply(_serializeResponseData(_.toUpper(parameters[1])));
  else
    return reply(
      '请输入需要查询的币名称，有效的币名列表请使用"/coins"命令查看'
    );
});
bot.command('coins', ({ from, message, reply }) => {
  const bitfinexCoins = [...bitfinexStorage.keys()];
  const huobiCoins = [...huobiStorage.keys()];
  let msgPayload = 'BITFINEX:\n';
  msgPayload += _.size(bitfinexCoins) ? bitfinexCoins.join(', ') : '暂无可用';
  msgPayload += '\n';
  msgPayload += 'HUOBI:\n';
  msgPayload += _.size(huobiCoins) ? huobiCoins.join(', ') : '暂无可用';
  return reply(msgPayload);
});
bot.startPolling();
