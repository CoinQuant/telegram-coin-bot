'use strict';

const crypto = require('crypto');
const querystring = require('querystring');
const _ = require('lodash');
const moment = require('moment');

module.exports = (access_key, secret_key, method, uri, query) => {
  method = _.toUpper(method);
  if (!_.includes(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTION'], method))
    throw new Error('Invalid http method');

  if (_.isObject(query)) {
    query.access_key = access_key;
    if (!query.tonce) query.tonce = moment().format('x');
    query = querystring.stringify(query);
  } else {
    if (!_.includes(query, 'tonce'))
      query = `access_key=${access_key}&${query}&tonce=${moment().format('x')}`;
    else query = `access_key=${access_key}&${query}`;
  }

  const payload = `${method}|${uri}|${query}`;

  const hash = crypto
    .createHmac('sha256', secret_key)
    .update(payload)
    .digest('hex');

  return hash;
};
