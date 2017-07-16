'use strict';

const EE = require('events');
const path = require('path');
const querystring = require('querystring');
const url = require('url');
const _ = require('lodash');
const { request } = require('urllib');
const winston = require('winston');
const signatureHelper = require('./signature');

const Request = Symbol('NODE-YUNBI#REQUEST');

let client;

class Yunbi extends EE {
  constructor(accessKey, secretKey) {
    super();
    if (!client) {
      client = this;
    }
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true
        })
      ]
    });
    return client;
  }

  [Request](uri, query, customOption) {
    const urlObj = {
      protocol: 'https',
      host: 'www.yunbi.com',
      pathname: path.join('/api/v2', uri),
      query: query
    };
    const endpoint = url.format(urlObj);
    // use for node api 8.x
    // new URL(path.join('/api/v2', url), 'https://www.yunbi.com');
    // urlObj.search = querystring.stringify(query);
    // const endpoint = urlObj.href;
    const defaultOption = {
      contentType: 'json',
      dataType: 'json',
      timeout: 5000,
      timing: true
    };
    let option = defaultOption;
    if (customOption) option = _.assign(defaultOption, customOption);
    return request(endpoint, option)
      .catch(err => {
        this.logger.warn(err);
      })
      .then(res => {
        this.logger.info(uri, res.res.timing);
        if (res.data && res.data.status === '500')
          return Promise.reject(res.data.error);
        return res.data;
      });
  }

  getMarkets() {
    return this[Request]('/markets.json');
  }

  getTicker(market) {
    if (!market) return Promise.reject('market is required');
    return this[Request](`/tickers/${market}.json`);
  }

  getOrderbook(market, option) {
    if (!market) return Promise.reject('market is required');
    const query = { market };
    if (
      +_.get(option, 'asks_limit') >= 1 &&
      +_.get(option, 'asks_limit') <= 200
    )
      query.asks_limit = option.asks_limit;
    if (
      +_.get(option, 'bids_limit') >= 1 &&
      +_.get(option, 'bids_limit') <= 200
    )
      query.bids_limit = option.bids_limit;
    return this[Request](`/order_book`, query);
  }
}

module.exports = (accessKey, secretKey) => {
  // if (!accessKey) throw new Error('access_key should be given!');
  // if (!secretKey) throw new Error('secrec_key should be given!');
  const client = new Yunbi(accessKey, secretKey);
  return client;
};
