'use strict';

const EE = require('events');
const _ = require('lodash');
const { request } = require('urllib');
const signatureHelper = require('./signature');

let client;

const Request = (url, customOption) => {
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
      return res.data;
    })
    .catch(err => {
      console.error(err);
    });
};

class Yunbi extends EE {
  constructor(accessKey, secretKey) {
    super();
    if (!client) {
      client = this;
    }
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    return client;
  }

  getMarkets() {
    return Request('/markets.json');
  }
}

module.exports = (accessKey, secretKey) => {
  // if (!accessKey) throw new Error('access_key should be given!');
  // if (!secretKey) throw new Error('secrec_key should be given!');
  const client = new Yunbi(accessKey, secretKey);
  return client;
};
