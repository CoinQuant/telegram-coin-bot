const EE = require('events');
const { request } = require('urllib');
const _ = require('lodash');
const logger = require('../../logger')('datasource', 'exchange/api.fixer.io');

class ExchangeEvent extends EE {
  constructor(frequency) {
    super();
    this.exchange_CNY_TO_USD = 0;
    this._requestFrequency = frequency || 30000;
  }
  startListen() {
    setInterval(() => {
      request('http://api.fixer.io/latest?base=USD', { dataType: 'json' })
        .then(result => {
          const exchange = _.get(result, 'data.rates.CNY');
          if (_.isNumber(exchange)) {
            logger.info(`exchange_CNY_TO_USD set to ${exchange}`);
            this.exchange_CNY_TO_USD = exchange;
            this.emit('exchange_update', exchange);
          } else
            logger.warn(
              `exchange value is invalid: ${JSON.stringify(result.data)}`
            );
        })
        .catch(err => {
          logger.error(err);
        });
    }, this._requestFrequency);
  }
}

module.exports = new ExchangeEvent();
