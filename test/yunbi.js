'use strict';

const Yunbi = require('../index')();

Yunbi.getMarkets()
  .then(res => {
    console.log(res);
    return Yunbi.getTicker('anscny');
  })
  .then(res => {
    console.log(res);
    return Yunbi.getOrderBook('anscny');
  })
  .then(res => {
    console.log(res);
  });
