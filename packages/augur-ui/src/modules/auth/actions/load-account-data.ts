import { loadAccountDataFromLocalStorage } from 'modules/auth/actions/load-account-data-from-local-storage';
import { updateLoginAccount } from 'modules/account/actions/login-account';
import { checkAccountAllowance } from 'modules/auth/actions/approve-account';
import { loadAccountHistory } from 'modules/auth/actions/load-account-history';
import { loadUniverseDetails } from 'modules/universe/actions/load-universe-details';
import { updateAssets } from 'modules/auth/actions/update-assets';
import { windowRef } from 'utils/window-ref';
import getValue from 'utils/get-value';
import logError from 'utils/log-error';
import { loadGasPriceInfo } from 'modules/app/actions/load-gas-price-info';
import { ACCOUNT_TYPES } from 'modules/common/constants';
import { LoginAccount, NodeStyleCallback, WindowApp } from 'modules/types';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { AppState } from 'store/';

export const loadAccountData = (
  callback: NodeStyleCallback = logError
) => async (dispatch: ThunkDispatch<void, any, Action>,
  getState: () => AppState) => {
  const { loginAccount, universe } = getState();
  const { address } = loginAccount;
  if (!address) return callback('account address required');
  const windowApp = windowRef as WindowApp;
  if (
    windowApp &&
    windowApp.localStorage.setItem &&
    loginAccount &&
    loginAccount.meta
  ) {
    windowApp.localStorage.setItem('loggedInAccountType', loginAccount.meta.accountType);
    windowApp.localStorage.setItem('loggedInAccount', address);
  }
  dispatch(loadAccountDataFromLocalStorage(address));
  dispatch(loadAccountHistory());
  dispatch(checkAccountAllowance());
  dispatch(updateAssets());
  dispatch(loadUniverseDetails(universe.id, address));
//  dispatch(loadReportingWindowBounds());
//  dispatch(loadDesignatedReporterMarkets());
//  dispatch(loadDisputing());
  dispatch(loadGasPriceInfo());
//  dispatch(getReportingFees());
};
