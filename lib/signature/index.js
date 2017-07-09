'use strict';

const crypto = require('crypto');
const querystring = require('querystring');
const _ = require('lodash');
const moment = require('moment');

module.exports = (method, uri, query) => {
  method = _.toUpper(method);
  if (!_.includes(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTION'], method))
    throw new Error('Invalid http method');

  // support param query with both object and string
  if (_.isObject(query)) {
    query.tonce = moment().format('x');
    query = querystring.stringify(query);
  } else {
    query = `${query}&tonce=${moment().format('x')}`;
  }

  const payload = `${method}|${uri}|${query}`;

  const hash = crypto
    .createHmac('sha256', 'a secret')
    .update(payload)
    .digest('hex');

  return hash;
};
