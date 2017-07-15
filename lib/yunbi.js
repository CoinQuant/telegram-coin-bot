'use strict';

const EE = require('events');
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

  [Request](url, customOption) {
    const prefix = 'https://yunbi.com/api/v2';
    const endpoint = prefix + url;
    const defaultOption = {
      contentType: 'json',
      dataType: 'json',
      timeout: 5000,
      timing: true
    };
    let option = defaultOption;
    if (customOption) option = _.assign(defaultOption, customOption);
    return request(endpoint, option)
      .then(res => {
        this.logger.info(url, res.res.timing);
        return res.data;
      })
      .catch(err => {
        this.logger.warn(err);
      });
  }

  getMarkets() {
    return this[Request]('/markets.json');
  }
}

module.exports = (accessKey, secretKey) => {
  // if (!accessKey) throw new Error('access_key should be given!');
  // if (!secretKey) throw new Error('secrec_key should be given!');
  const client = new Yunbi(accessKey, secretKey);
  return client;
};
