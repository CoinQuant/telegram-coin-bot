'use strict';

const EE = require('events');

let client;

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
}

module.exports = (accessKey, secretKey) => {
  if (!accessKey) throw new Error('access_key should be given!');
  if (!secretKey) throw new Error('secrec_key should be given!');
  const client = new Yunbi(accessKey, secretKey);
  return client;
};
