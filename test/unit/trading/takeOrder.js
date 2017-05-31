"use strict";

var assert = require("chai").assert;
var augur = new (require("../../../src"))();
var proxyquire = require('proxyquire');
var noop = require("../../../src/utils/noop");
var BigNumber = require("bignumber.js");
var clearCallCounts = require("../../tools").clearCallCounts;
// 12 tests total

describe("takeOrder.placeBuy", function () {
  // 4 tests total
  var callCounts = {
    executeTrade: 0,
    placeBid: 0,
    tradeCommitLockCallback: 0
  };
  afterEach(function () {
    clearCallCounts(callCounts);
  });
  var test = function (t) {
    it(t.description, function (done) {
      var placeBuy = proxyquire('../../../src/trading/take-order/place-buy', {
        './calculate-buy-trade-ids': t.calculateBuyTradeIDs,
        './execute-trade': t.executeTrade,
        '../make-order/place-bid': t.placeBid,
      });

      placeBuy({}, t.market, t.outcomeID, t.numShares, t.limitPrice, t.address, t.totalCost, t.tradingFees, t.getOrderBooks, t.doNotMakeOrders, t.tradeGroupID, t.tradeCommitmentCallback, t.tradeCommitLockCallback, t.callback);

      t.assertions(done);
    });
  };
  test({
    description: 'Should return if an error is returned from executeTrade',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} }}; },
    calculateBuyTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: function (err) {
      assert.deepEqual(err, { error: 999, message: 'Uh-Oh!' });
    },
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, 0);
      assert.equal(totalEthWithFee, '51');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      // return an error in this case
      cb({ error: 999, message: 'Uh-Oh!' }, undefined);
    },
    placeBid: function (p, market, outcomeID, sharesRemaining, limitPrice, tradeGroupID) {
      callCounts.placeBid++;
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        placeBid: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });
  test({
    description: 'Should handle a placedBuy that is filled in one trade',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} }}; },
    calculateBuyTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, 0);
      assert.equal(totalEthWithFee, '51');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { filledShares: new BigNumber('100'), remainingEth: new BigNumber('0') });
    },
    placeBid: function (p, market, outcomeID, sharesRemaining, limitPrice, tradeGroupID) {
      callCounts.placeBid++;
    },
    assertions: function(done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        placeBid: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });
  test({
    description: 'Should handle a placedBuy that is partially filled, then place a bid for the remaining shares using the remaining eth',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} }}; },
    calculateBuyTradeIDs: noop,
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, 0);
      assert.equal(totalEthWithFee, '51');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { filledShares: new BigNumber('80'), remainingEth: new BigNumber('10.1') });
    },
    placeBid: function (p, market, outcomeID, sharesRemaining, limitPrice, tradeGroupID) {
      callCounts.placeBid++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(sharesRemaining, '20');
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        placeBid: 1,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });
  test({
    description: 'Should handle a placedBuy that is partially filled, but not create a bid to fill the rest.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} }}; },
    calculateBuyTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    callback: function (err) {
      assert.isNull(err);
    },
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, 0);
      assert.equal(totalEthWithFee, '51');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { filledShares: new BigNumber('80'), remainingEth: new BigNumber('10.1') });
    },
    placeBid: function (p, market, outcomeID, sharesRemaining, limitPrice, tradeGroupID) {
      callCounts.placeBid++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(sharesRemaining, '20');
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        placeBid: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });
});

describe("takeOrder.placeSell", function () {
  // 8 tests total
  var getParticipantSharesPurchased = augur.api.Markets.getParticipantSharesPurchased;
  var callCounts = {
    executeTrade: 0,
    getParticipantSharesPurchased: 0,
    placeAsk: 0,
    placeShortAsk: 0,
    placeAskAndShortAsk: 0,
    calculateSellTradeIDs: 0,
    placeShortSell: 0,
    tradeCommitLockCallback: 0
  };
  afterEach(function () {
    clearCallCounts(callCounts);
    augur.api.Markets.getParticipantSharesPurchased = getParticipantSharesPurchased;
  });
  var test = function (t) {
    it(t.description, function (done) {
      var placeSell = proxyquire('../../../src/trading/take-order/place-sell', {
        './execute-trade': t.executeTrade,
        '../make-order/place-ask': t.placeAsk,
        '../make-order/place-short-ask': t.placeShortAsk,
        './place-short-sell': t.placeShortSell,
        '../make-order/place-ask-and-short-ask': t.placeAskAndShortAsk,
        './calculate-sell-trade-ids': t.calculateSellTradeIDs,
      });
      augur.api.Markets.getParticipantSharesPurchased = t.getParticipantSharesPurchased;

      placeSell({}, t.market, t.outcomeID, t.numShares, t.limitPrice, t.address, t.totalCost, t.tradingFees, t.getOrderBooks, t.doNotMakeOrders, t.tradeGroupID, t.tradeCommitmentCallback, t.tradeCommitLockCallback, t.callback);

      t.assertions(done);
    });
  };
  test({
    description: 'Should handle an error from executeTrade.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    callback: function (err) {
      assert.deepEqual(err, { error: 999, message: 'Uh-Oh!' });
    },
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      // return an error in this case
      cb({ error: 999, message: 'Uh-Oh!' }, undefined);
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID) {
      callCounts.placeAsk++;
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID) {
      callCounts.placeShortAsk++;
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, tradeGroupID, tradeCommitmentCallback) {
      callCounts.placeShortSell++;
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 0,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell order where the order is completely filled by the executeTrade call',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('0') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, tradeGroupID, tradeCommitmentCallback, callback) {
      callCounts.placeShortSell++;
      callback(null);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 0,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell order where the order is only partially filled by the sell and we still have a position. place Ask and a Short Ask.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('10');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(askShares, new BigNumber('10'));
      assert.equal(shortAskShares, new BigNumber('30'));
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, tradeGroupID, tradeCommitmentCallback, callback) {
      callCounts.placeShortSell++;
      callback(null);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 1,
        calculateSellTradeIDs: 0,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell order where the order is only partially filled by the sell and we still have a position. place Ask.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('50');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(askShares.toString(), new BigNumber('40').toString());
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, tradeGroupID, tradeCommitmentCallback, callback) {
      callCounts.placeShortSell++;
      callback(null);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 1,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 0,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell order where the order is only partially filled by the sell and we still have a position. Dont place any asks',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: function (err) {
      assert.isNull(err);
    },
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('10');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, tradeGroupID, tradeCommitmentCallback, callback) {
      callCounts.placeShortSell++;
      callback(null);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell where not all shares are sold, we have no position, and there are potential buyers that match in the orderBook so place a short sell.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () {
      return {
        '0xa1': {
          buy: { '0xb1': { amount: '40', price: '0.5' } },
          sell: {}
        }
      };
    },
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), {
        '0xa1': {
          buy: { '0xb1': { amount: '40', price: '0.5' } },
          sell: {}
        }
      });
      assert.isFunction(getTradeIDs);
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('0');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(limitPrice, '0.5');
      assert.deepEqual(orderBook, {
        '0xa1': {
          buy: { '0xb1': { amount: '40', price: '0.5' } },
          sell: {}
        }
      });
      assert.equal(address, '0x1');
      return ['0xb1'];
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, getOrderBooks, doNotMakeOrders, tradeGroupID, tradeCommitmentCallback) {
      callCounts.placeShortSell++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(remainingShares, '40');
      assert.equal(limitPrice, '0.5');
      assert.equal(address, '0x1');
      assert.equal(totalCost, '51');
      assert.equal(tradingFees, '0.01');
      assert.deepEqual(getOrderBooks(), {
        '0xa1': {
          buy: { '0xb1': { amount: '40', price: '0.5' } },
          sell: {}
        }
      });
      assert.equal(tradeGroupID, '0x000abc123');
      assert.isFunction(tradeCommitmentCallback);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 1,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell where not all shares are sold, we have no position, and there are no potential buyers that match in the orderBook. place a shortAsk',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('0');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '1');
      assert.equal(shortAskShares, '40');
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
      assert.equal(marketID, '0xa1');
      cb({ buy: {}, sell: {} });
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(limitPrice, '0.5');
      assert.deepEqual(orderBook, { '0xa1': { buy: {}, sell: {} }});
      assert.equal(address, '0x1');
      return [];
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, orderBook, tradeGroupID, tradeCommitmentCallback) {
      callCounts.placeShortSell++;
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 0,
        placeShortAsk: 1,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });

  test({
    description: 'Should handle a sell where not all shares are sold, we have no position, and there are no potential buyers that match in the orderBook. dont place any asks.',
    market: { id: '0xa1' },
    outcomeID: '1',
    numShares: '100',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '51',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    callback: function (err) {
      assert.isNull(err);
    },
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: noop,
    executeTrade: function (p, marketID, outcomeID, numShares, totalEthWithFee, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeTrade++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(numShares, '100');
      assert.equal(totalEthWithFee, 0);
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('40') });
    },
    getParticipantSharesPurchased: function (p, cb) {
      callCounts.getParticipantSharesPurchased++;
      assert.equal(p.market, '0xa1');
      assert.equal(p.trader, '0x1');
      assert.equal(p.outcome, '1');
      cb('0');
    },
    placeAsk: function (p, market, outcomeID, askShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAsk++;
      callback(null);
    },
    placeShortAsk: function (p, market, outcomeID, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    placeAskAndShortAsk: function (p, market, outcomeID, askShares, shortAskShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeAskAndShortAsk++;
      callback(null);
    },
    getOrderBook: function (marketID, cb) {
      callCounts.getOrderBook++;
      assert.equal(marketID, '0xa1');
      cb({ buy: {}, sell: {} });
    },
    calculateSellTradeIDs: function (marketID, outcomeID, limitPrice, orderBook, address) {
      callCounts.calculateSellTradeIDs++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '1');
      assert.equal(limitPrice, '0.5');
      assert.deepEqual(orderBook, { '0xa1': { buy: {}, sell: {} }});
      assert.equal(address, '0x1');
      return [];
    },
    placeShortSell: function (p, market, outcomeID, remainingShares, limitPrice, address, totalCost, tradingFees, orderBook, tradeGroupID, tradeCommitmentCallback) {
      callCounts.placeShortSell++;
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        executeTrade: 1,
        getParticipantSharesPurchased: 1,
        placeAsk: 0,
        placeShortAsk: 0,
        placeAskAndShortAsk: 0,
        calculateSellTradeIDs: 1,
        placeShortSell: 0,
        tradeCommitLockCallback: 2
      });
      done();
    }
  });
});

describe("takeOrder.placeShortSell", function () {
  // 4 tests total
  var callCounts = {
    tradeCommitLockCallback: 0,
    executeShortSell: 0,
    placeShortAsk: 0
  };
  afterEach(function () {
    clearCallCounts(callCounts);
  });
  var test = function (t) {
    it(t.description, function (done) {
      var placeShortSell = proxyquire('../../../src/trading/take-order/place-short-sell', {
        './execute-short-sell': t.executeShortSell,
        '../make-order/place-short-ask': t.placeShortAsk,
        './calculate-sell-trade-ids': t.calculateSellTradeIDs
      });

      placeShortSell({}, t.market, t.outcomeID, t.numShares, t.limitPrice, t.address, t.totalCost, t.tradingFees, t.getOrderBooks, t.doNotMakeOrders, t.tradeGroupID, t.tradeCommitmentCallback, t.tradeCommitLockCallback, t.callback);

      t.assertions(done);
    });
  };
  test({
    description: 'Should handle an error from executeShortSell',
    market: { id: '0xa1' },
    outcomeID: '2',
    numShares: '50',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '25.5',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    calculateSellTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    callback: function (err) {
      assert.deepEqual(err, { error: 999, message: 'Uh-Oh!' });
    },
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeShortSell: function (p, marketID, outcomeID, numShares, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeShortSell++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '2');
      assert.equal(numShares, '50');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      // return an error in this case
      cb({ error: 999, message: 'Uh-Oh!' }, undefined);
    },
    placeShortAsk: function (p, market, outcomeID, remainingShares, limitPrice, tradeGroupID, callback) {
      callCounts.placeShortAsk++;
      callback(null);
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        tradeCommitLockCallback: 2,
        executeShortSell: 1,
        placeShortAsk: 0
      });
      done();
    }
  });
  test({
    description: 'Should call executeShortSell and completely fill the sell order',
    market: { id: '0xa1' },
    outcomeID: '2',
    numShares: '50',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '25.5',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    calculateSellTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeShortSell: function (p, marketID, outcomeID, numShares, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeShortSell++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '2');
      assert.equal(numShares, '50');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('0') });
    },
    placeShortAsk: function (p, market, outcomeID, remainingShares, limitPrice, tradeGroupID) {
      callCounts.placeShortAsk++;
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        tradeCommitLockCallback: 2,
        executeShortSell: 1,
        placeShortAsk: 0
      });
      done();
    }
  });
  test({
    description: 'Should call executeShortSell and partially fill the sell order, then place a shortAsk for the rest of the order',
    market: { id: '0xa1' },
    outcomeID: '2',
    numShares: '50',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '25.5',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    calculateSellTradeIDs: noop,
    doNotMakeOrders: false,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    executeShortSell: function (p, marketID, outcomeID, numShares, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeShortSell++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '2');
      assert.equal(numShares, '50');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('10') });
    },
    placeShortAsk: function (p, market, outcomeID, remainingShares, limitPrice, tradeGroupID) {
      callCounts.placeShortAsk++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '2');
      assert.equal(remainingShares, '10');
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        tradeCommitLockCallback: 2,
        executeShortSell: 1,
        placeShortAsk: 1
      });
      done();
    }
  });
  test({
    description: 'Should call executeShortSell and partially fill the sell order, but dont place a shortAsk.',
    market: { id: '0xa1' },
    outcomeID: '2',
    numShares: '50',
    limitPrice: '0.5',
    address: '0x1',
    totalCost: '25.5',
    tradingFees: '0.01',
    getOrderBooks: function () { return { '0xa1': { buy: {}, sell: {} } }; },
    calculateSellTradeIDs: noop,
    doNotMakeOrders: true,
    tradeGroupID: '0x000abc123',
    tradeCommitmentCallback: noop,
    tradeCommitLockCallback: function (lock) {
      callCounts.tradeCommitLockCallback++;
      switch(callCounts.tradeCommitLockCallback) {
      case 2:
        assert.isFalse(lock);
        break;
      default:
        assert.isTrue(lock);
        break;
      }
    },
    callback: function (err) {
      assert.isNull(err);
    },
    executeShortSell: function (p, marketID, outcomeID, numShares, tradingFees, tradeGroupID, address, getOrderBooks, getTradeIDs, tradeCommitmentCallback, cb) {
      callCounts.executeShortSell++;
      assert.equal(marketID, '0xa1');
      assert.equal(outcomeID, '2');
      assert.equal(numShares, '50');
      assert.equal(tradingFees, '0.01');
      assert.equal(tradeGroupID, '0x000abc123');
      assert.equal(address, '0x1');
      assert.deepEqual(getOrderBooks(), { '0xa1': { buy: {}, sell: {} }});
      assert.isFunction(getTradeIDs);
      getTradeIDs();
      assert.isFunction(tradeCommitmentCallback);
      cb(null, { remainingShares: new BigNumber('10') });
    },
    placeShortAsk: function (p, market, outcomeID, remainingShares, limitPrice, tradeGroupID) {
      callCounts.placeShortAsk++;
      assert.deepEqual(market, { id: '0xa1' });
      assert.equal(outcomeID, '2');
      assert.equal(remainingShares, '10');
      assert.equal(limitPrice, '0.5');
      assert.equal(tradeGroupID, '0x000abc123');
    },
    assertions: function (done) {
      assert.deepEqual(callCounts, {
        tradeCommitLockCallback: 2,
        executeShortSell: 1,
        placeShortAsk: 0
      });
      done();
    }
  });
});
