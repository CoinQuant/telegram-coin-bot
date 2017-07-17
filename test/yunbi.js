'use strict';

const assert = require('chai').assert;
const moment = require('moment');

describe('node-yunbi', () => {
  describe('#signature', () => {
    it('should return the right signature', done => {
      const Yunbi = require('../index')('xxx', 'yyy');
      const signature = Yunbi.signature('get', '/api/v2/markets', {
        foo: 'bar',
        tonce: 123456789
      });
      assert(
        signature ===
          'd93436fd9bf00afb778e52dc16d7b393960ba5711397b4dfcb7f66000e046c76'
      );
      done();
    });
    it('should throw error if method is unknown', done => {
      const Yunbi = require('../index')('xxx', 'yyy');
      try {
        Yunbi.signature('get1', '/api/v2/markets', {
          foo: 'bar',
          tonce: 123456789
        });
      } catch (err) {
        assert.equal(err.message, 'Invalid http method');
      }
      done();
    });
  });
  describe('#getMarkets', () => {
    it('should get markets list', done => {
      const Yunbi = require('../index')();
      Yunbi.getMarkets().then(res => {
        assert.isArray(res);
        assert.isAtLeast(res.length, 1);
        assert.isString(res[0].id);
        assert.isString(res[0].name);
        done();
      });
    });
  });
  describe('#getTicker', () => {
    it('should get ticker data', done => {
      const Yunbi = require('../index')();
      Yunbi.getTicker('anscny').then(res => {
        assert.isNumber(res.at);
        assert.isNumber(+res.ticker.buy);
        assert.isNumber(+res.ticker.sell);
        assert.isNumber(+res.ticker.low);
        assert.isNumber(+res.ticker.high);
        assert.isNumber(+res.ticker.last);
        assert.isNumber(+res.ticker.vol);
        done();
      });
    });
    it('should be an error if market is not provided', done => {
      const Yunbi = require('../index')();
      Yunbi.getTicker().catch(err => {
        assert.equal(err, 'market is required');
        done();
      });
    });
    it('should be an internal server error if market is unknown', done => {
      const Yunbi = require('../index')();
      Yunbi.getTicker('abc').catch(err => {
        assert.equal(err, 'Internal Server Error');
        done();
      });
    });
  });
  describe('#getOrderBook', () => {
    it('should get orderbook data', done => {
      const Yunbi = require('../index')();
      Yunbi.getOrderbook('anscny').then(res => {
        assert.isArray(res.asks);
        assert.equal(res.asks.length, 20);
        assert.isNumber(res.asks[0].id);
        assert.equal(res.asks[0].side, 'sell');
        assert.isString(res.asks[0].ord_type);
        assert.isNumber(+res.asks[0].price);
        assert.isNumber(+res.asks[0].avg_price);
        assert.isString(res.asks[0].state);
        assert.equal(res.asks[0].market, 'anscny');
        assert.isAbove(moment().unix(), moment(res.asks[0].created_at).unix());
        assert.isNumber(+res.asks[0].avg_price);
        assert.isNumber(+res.asks[0].volume);
        assert.isNumber(+res.asks[0].remaining_volume);
        assert.isNumber(+res.asks[0].executed_volume);
        assert.isNumber(res.asks[0].trades_count);
        assert.isArray(res.bids);
        assert.equal(res.bids.length, 20);
        assert.isNumber(res.bids[0].id);
        assert.equal(res.bids[0].side, 'buy');
        assert.isString(res.bids[0].ord_type);
        assert.isNumber(+res.bids[0].price);
        assert.isNumber(+res.bids[0].avg_price);
        assert.isString(res.bids[0].state);
        assert.equal(res.bids[0].market, 'anscny');
        assert.isAbove(moment().unix(), moment(res.bids[0].created_at).unix());
        assert.isNumber(+res.bids[0].avg_price);
        assert.isNumber(+res.bids[0].volume);
        assert.isNumber(+res.bids[0].remaining_volume);
        assert.isNumber(+res.bids[0].executed_volume);
        assert.isNumber(res.bids[0].trades_count);
        done();
      });
    });
    it('should work with parameter option.asks_limit', done => {
      const Yunbi = require('../index')();
      Yunbi.getOrderbook('anscny', {
        bids_limit: 2,
        asks_limit: 1
      }).then(res => {
        assert.equal(res.asks.length, 1);
        done();
      });
    });
    it('should work with parameter option.bids_limit', done => {
      const Yunbi = require('../index')();
      Yunbi.getOrderbook('anscny', {
        bids_limit: 1,
        asks_limit: 2
      }).then(res => {
        assert.equal(res.bids.length, 1);
        done();
      });
    });
    it('should be an error if market is not provided', done => {
      const Yunbi = require('../index')();
      Yunbi.getOrderbook().catch(err => {
        assert.equal(err, 'market is required');
        done();
      });
    });
  });
});
