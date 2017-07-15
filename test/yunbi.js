'use strict';

const Yunbi = require('../index')();

Yunbi.getMarkets().then(res => {
  console.log(res);
});
