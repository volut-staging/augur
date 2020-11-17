import React, { useState } from 'react'
import styled from 'styled-components'
import { ApolloProvider } from 'react-apollo'
import { client } from './apollo/client'
import { Route, Switch, Redirect } from 'react-router-dom'
import GlobalPage from './pages/GlobalPage'
import TokenPage from './pages/TokenPage'
import { isAddress } from './utils'
import LocalLoader from './components/LocalLoader'
import { useLatestBlock } from './contexts/Application'
import RemoveLiquidity from './pages/RemoveLiquidity'
import Swap from './pages/Swap'
import AddLiquidity from './pages/AddLiquidity'
import URLWarning from './components/Header/URLWarning'
import Header from './components/Header'
import Web3ReactManager from './components/Web3ReactManager'
import Popups from './components/Popups'
import UserPools from './pages/UserPools'
import UserPositions from './pages/UserPositions'

const AppWrapper = styled.div`
  width: 100%;
`
const ContentWrapper = styled.div`
  display: flex;
  padding: 1rem;
  height: 100vh;
  width: 100vw;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
`

/**
 * Wrap the component with the header and sidebar pinned tab
 */
const LayoutWrapper = ({ children, savedOpen, setSavedOpen }) => {
  return (
    <ContentWrapper>
      {children}
    </ContentWrapper>
  )
}

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 2rem;
  `};

  z-index: 1;
`

function App() {
  const [savedOpen, setSavedOpen] = useState(false)
  const latestBlock = useLatestBlock()

  return (
    <ApolloProvider client={client}>
      <AppWrapper>
        <URLWarning />
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
        <BodyWrapper>
          <Popups />
          <Web3ReactManager>
            {latestBlock ? (
              <Switch>
                <Route
                  exacts
                  strict
                  path="/token/:marketId"
                  render={({ match }) => {
                    const { marketId } = match.params
                    if (marketId && isAddress(marketId.toLowerCase())) {
                      return (
                        <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                          <TokenPage marketId={marketId} />
                        </LayoutWrapper>
                      )
                    } else {
                      return <Redirect to="/home" />
                    }
                  }}
                />
                <Route path="/home">
                  <GlobalPage />
                </Route>
                <Route path="/pools">
                  <UserPools />
                </Route>
                <Route path="/positions">
                  <UserPositions />
                </Route>
                <Route
                  exacts
                  strict
                  path="/add/:marketId/:cash/:amm"
                  render={({ match }) => {
                    const { marketId, amm, cash } = match.params

                    if (isAddress(marketId.toLowerCase()) && isAddress(cash.toLowerCase())) {
                      return (
                        <AddLiquidity marketId={marketId} amm={amm} cash={cash} />
                      )
                    } else {
                      return <Redirect to="/home" />
                    }
                  }}
                />
                <Route
                  exacts
                  strict
                  path="/remove/:marketId/:amm"
                  render={({ match }) => {
                    const { marketId, amm } = match.params

                    if (isAddress(marketId.toLowerCase()) && isAddress(amm.toLowerCase())) {
                      return (
                        <RemoveLiquidity marketId={marketId} ammExchangeId={amm} />
                      )
                    } else {
                      return <Redirect to="/home" />
                    }
                  }}
                />
                <Route
                  exacts
                  strict
                  path="/swap/:marketId/:cash/:amm"
                  render={({ match }) => {
                    const { marketId, cash, amm } = match.params

                    if (isAddress(marketId.toLowerCase())) {
                      return (
                        <Swap marketId={marketId} cash={cash} amm={amm} />
                      )
                    } else {
                      return <Redirect to="/home" />
                    }
                  }}
                />
                <Redirect to="/home" />
              </Switch>
            ) : (
                <LocalLoader />
              )}
          </Web3ReactManager>
        </BodyWrapper>
      </AppWrapper>
    </ApolloProvider>
  )
}

export default App
