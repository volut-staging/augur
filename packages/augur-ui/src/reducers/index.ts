import accountPositions from 'modules/positions/reducers/account-positions';
import marketTradingHistory from 'modules/markets/reducers/market-trading-history';
import marketInfos from 'modules/markets/reducers/market-infos';
import newMarket from 'modules/markets/reducers/new-market';
import pendingLiquidityOrders from 'modules/orders/reducers/liquidity-orders';
import analytics from 'modules/app/reducers/analytics';
import pendingOrders from 'modules/orders/reducers/pending-orders';
import filledOrders from 'modules/orders/reducers/filled-orders';
import pendingQueue from 'modules/pending-queue/reducers/pending-queue';
import userOpenOrders from 'modules/orders/reducers/open-orders';
import drafts from 'modules/create-market/reducers/drafts';
import marketsList from 'modules/markets-list/reducers/markets-list';
import reportingListState from 'modules/reporting/reducers/reporting-list-state';
import orderBooks from 'modules/orders/reducers/order-books'
import initialized3box from 'modules/global-chat/reducers/initialized-3box'
import {
  AccountPosition,
  MarketInfos,
  NewMarket,
  LiquidityOrders,
  PendingOrders,
  PendingQueue,
  FilledOrders,
  OpenOrders,
  Drafts,
  MarketsList,
  ReportingListState,
  Analytics,
  OrderBooks,
  Initialized3box
} from 'modules/types';
import { Getters } from '@augurproject/sdk';
import { SDKConfiguration } from '@augurproject/artifacts';

export function createReducer() {
  return {
    accountPositions,
    marketTradingHistory,
    marketInfos,
    newMarket,
    pendingLiquidityOrders,
    pendingOrders,
    pendingQueue,
    filledOrders,
    userOpenOrders,
    drafts,
    marketsList,
    reportingListState,
    analytics,
    orderBooks,
    initialized3box
  };
}

// TODO: couldn't use concreat type form `createReducer` so hardcoding structure here
// keeping with reducers for easier maintenance.
export interface AppStateInterface {
  accountPositions: AccountPosition;
  config: SDKConfiguration;
  marketTradingHistory: Getters.Trading.MarketTradingHistory;
  marketInfos: MarketInfos;
  newMarket: NewMarket;
  pendingLiquidityOrders: LiquidityOrders;
  pendingOrders: PendingOrders;
  pendingQueue: PendingQueue;
  filledOrders: FilledOrders;
  userOpenOrders: OpenOrders;
  drafts: Drafts;
  marketsList: MarketsList;
  reportingListState: ReportingListState;
  analytics: Analytics;
  orderBooks: OrderBooks;
  initialized3box: Initialized3box;
}
