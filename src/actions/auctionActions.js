import {
  FETCH_CIRCULATING_NEC_DATA,
  FETCH_BURNED_NEC,
  FETCH_DEVERSIFI_NEC_ETH_DATA,
  FETCH_NEXT_AUCTION_ETH_DATA,
  FETCH_CURRENT_AUCTION_SUMMARY,
  FETCH_AUCTION_INTERVAL_DATA,
  SELL_IN_AUCTION_START,
  FETCH_AUCTION_TRANSACTIONS,
  FETCH_ETH_PRICE,
  SELL_AND_BURN_NEC,
  FETCH_NEXT_AUCTION_DATE
} from './actionTypes';
import Web3 from 'web3';
import config from '../constants/config.json';
import eth from '../services/ethereumService';
import { formatEth, formatNumber } from '../services/utils';
import { notify, notifyError } from './notificationActions';
import { openLogin } from './accountActions';

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(config.providerUrl));

export const fetchNextAuctionDate = () => async dispatch => {
  const engineContract = eth.getEngineContract();

  const {nextStartTimeSeconds} = await engineContract.methods.getNextAuction().call();

  dispatch({ type: FETCH_NEXT_AUCTION_DATE, nextAuctionDate: nextStartTimeSeconds - Date.now() / 1000 })
}

export const fetchBurnedNec = () => async dispatch => {
  const engineContract = eth.getEngineContract();
  const blockRange = await eth.getChartBlockRange(7);
  const burnedNec = [];
  let pastEvents = await engineContract.getPastEvents('AuctionClose', blockRange);
  let burnedSum = 0;

  await Promise.all(pastEvents.map(async (event, index) => {
    const { timestamp } = await eth.getBlockByNumber(event.blockNumber);

    burnedNec.push({
      name: new Date(timestamp * 1000).toLocaleDateString(),
      pv: event.returnValues.necBurned / 1000000000000000000,
      amt: event.event,
    });
  }));

  const extratedPv = pastEvents.map(event => event.returnValues.necBurned / 1000000000000000000);
  const orderedTransactions = burnedNec.sort((a, b) => a.name - b.name);

  dispatch({
    type: FETCH_BURNED_NEC,
    burnedNecData: orderedTransactions,
    totalBurned: burnedNec.length ? extratedPv.reduce((current, next) => current + next) : 0 });
};

export async function getCirculatingNEC() {
  const tokenContract = eth.getTokenContract();
  const blockRange = await eth.getChartBlockRange();
  const blockDiff = Math.floor((blockRange.toBlock - blockRange.fromBlock) / 7);
  const circulatingNec = [];

  for(let block = blockRange.fromBlock; block <= blockRange.toBlock; block += blockDiff) {
    const supply = await tokenContract.methods.totalSupplyAt(blockRange.fromBlock).call();
    const { timestamp } = await eth.getBlockByNumber(block);

    circulatingNec.push({
      name:  new Date(timestamp * 1000).toLocaleDateString(),
      pv: Math.floor(supply/1000000000000000000)
    });
  }

  const orderedTransactions = circulatingNec.sort((a, b) => a.name - b.name);

  return orderedTransactions;
}

export async function getDeversifiNecEth() {
  const engineContract = eth.getEngineContract();
  const blockRange = await eth.getChartBlockRange();
  const deversifiNecEth = [];
  const transactions = await engineContract.getPastEvents('Burn', blockRange);

  await Promise.all(transactions.map(async (transaction) => {
    const { timestamp } = await eth.getBlockByNumber(transaction.blockNumber);

    deversifiNecEth.push({
      name: new Date(timestamp * 1000).toLocaleDateString(),
      pv: (transaction.returnValues.amount/formatEth(transaction.returnValues.price)).toFixed(3),
    });
  }));

  const orderedTransactions = deversifiNecEth.sort((a, b) =>  a.name - b.name);

  return orderedTransactions;
}

export const fetchCirculatingNec = () => async dispatch => {
  const circulatingNecData = await getCirculatingNEC();

  dispatch({ type: FETCH_CIRCULATING_NEC_DATA, circulatingNecData });
};

export const fetchDeversifiNecEth = () => async dispatch => {
  const deversifiNecEthData = await getDeversifiNecEth();
  dispatch({ type: FETCH_DEVERSIFI_NEC_ETH_DATA, deversifiNecEthData });
};

const fetchedCurrentActionSummary = data => async dispatch => {
  const engineContract = eth.getEngineContract();

  try {
    const current = await engineContract.methods.getCurrentAuction().call();
    const blockRange = await eth.getChartBlockRange();
    const transactions = await engineContract.getPastEvents('Burn', blockRange);

    let purchasedNec = 0
    let sumEth = 0
    let necAveragePrice = 'N/A'
    console.log(transactions.length)
    if(transactions.length) {
      transactions.forEach(transaction => {
        purchasedNec = purchasedNec + +transaction.returnValues.amount
        sumEth = sumEth + +transaction.returnValues.amount / +transaction.returnValues.price
      })
      purchasedNec = purchasedNec / 1000000000000000000
      necAveragePrice = (sumEth / purchasedNec).toFixed(5)
    }
    const currentNecPrice = (1000000000000000000/current.currentPrice).toFixed(5)


    dispatch({
      type: FETCH_CURRENT_AUCTION_SUMMARY,
      nextPriceChange: current.nextPriceChangeSeconds - Date.now() / 1000,
      startTimeSeconds: Number(current.startTimeSeconds),
      currentAuctionSummary: {
        currentNecPrice: currentNecPrice,
        nextNecPrice: (1000000000000000000/current.nextPrice).toFixed(5),
        remainingEth: current.remainingEthAvailable,
        initialEth: current.initialEthAvailable,
        necAveragePrice: necAveragePrice,
        purchasedNec: purchasedNec
      }
    });
  } catch(e) {
    console.log(e)
    dispatch({
      type: FETCH_CURRENT_AUCTION_SUMMARY,
      currentAuctionSummary: null
    });
  }
};

export const fetchCurrentActionSummary = data => async dispatch => {
  dispatch(fetchedCurrentActionSummary());
};

export const fetchAuctionIntervalData = () => async dispatch => {
  const engineContract = await eth.getEngineContract();
  const necPrice = await eth.getNecPrice();
  const blockRange = await eth.getChartBlockRange();
  const transactions = await engineContract.getPastEvents('Burn', blockRange);

  const data = transactions.map(transaction => ({
    nec: transaction.returnValues.amount,
    eth: formatEth(transaction.returnValues.price)
  }));

  dispatch({ type: FETCH_AUCTION_INTERVAL_DATA, auctionIntervalData: data });
};

const sellInAuctionEnd = data => ({
  type: SELL_IN_AUCTION_START,
  sellInAuctionData: [],
});

export const sellInAuctionStart = data => async dispatch => {
  dispatch(sellInAuctionEnd());
};


export const fetchAuctionTransactions = data => async dispatch => {
  const engineContract = await eth.getEngineContract();
  const necPrice = await eth.getNecPrice();
  const blockRange = await eth.getChartBlockRange();
  const transactions = await engineContract.getPastEvents('Burn', blockRange);

  const transactionsList = transactions.map(transaction => ({
    blockNumber: transaction.blockNumber,
    wallet_address: transaction.returnValues.burner,
    nec: formatEth(transaction.returnValues.amount),
    eth: (formatEth(transaction.returnValues.amount) / transaction.returnValues.price).toFixed(5),
    price_nec_eth: ( 1 / transaction.returnValues.price).toFixed(5),
    price_nec_usd: necPrice,
    usd: (formatEth(transaction.returnValues.amount) * necPrice).toFixed(2),
  }));

  dispatch({ type: FETCH_AUCTION_TRANSACTIONS, auctionTransactions: transactionsList });
};

export const fetchEthPrice = () => async dispatch => {
  const necPrice = await eth.getNecPrice();

  dispatch({ type: FETCH_ETH_PRICE, necPrice })
}

export const sellAndBurn = (necAmount) => async (dispatch, getState) => {
  if (!getState().account.accountType) return dispatch(openLogin())

  const userTokenBalance = getState().account.tokenBalance

  if (necAmount < 1) {
    return notifyError('This is below the minimum you can sell')(dispatch)
  }

  if (!userTokenBalance || userTokenBalance < 0.1) {
    return notifyError('You first need nectar tokens in your wallet')(dispatch)
  }

  if (userTokenBalance < necAmount) {
    return notifyError(`You only have: ${userTokenBalance} NEC in your wallet`)(dispatch)
  }

  try {
    await eth.sellAndBurn(necAmount, getState().account.accountType)
    notify('You have sold NEC!', 'success')(dispatch)
    dispatch({ type: SELL_AND_BURN_NEC })
  } catch(err) {
    notifyError(err)(dispatch)
  }
}
