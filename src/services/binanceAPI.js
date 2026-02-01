import axios from 'axios'

const BINANCE_URL = 'https://api.binance.com/api/v3'

// Твой список монет
export const ALLOWED_COINS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX', 'ADA', 'LINK', 'XLM', 'SUI',
  'AVAX', 'LTC', 'HBAR', 'DOT', 'TAO', 'AAVE', 'KAS', 'ONDO', 'WLD', 'ARB',
  'TIA', 'ATOM', 'FTM', 'ZRO', 'NEAR', 'DOGE', 'PEPE', 'OP', 'BONK', 'FET', 'APT'
]

// Полные названия монет
const COIN_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB Chain',
  SOL: 'Solana',
  XRP: 'Ripple',
  TRX: 'Tron',
  ADA: 'Cardano',
  LINK: 'Chainlink',
  XLM: 'Stellar',
  SUI: 'Sui',
  AVAX: 'Avalanche',
  LTC: 'Litecoin',
  HBAR: 'Hedera',
  DOT: 'Polkadot',
  TAO: 'Bittensor',
  AAVE: 'Aave',
  KAS: 'Kaspa',
  ONDO: 'Ondo',
  WLD: 'Worldcoin',
  ARB: 'Arbitrum',
  TIA: 'Celestia',
  ATOM: 'Cosmos',
  FTM: 'Fantom',
  ZRO: 'LayerZero',
  NEAR: 'Near Protocol',
  DOGE: 'Dogecoin',
  PEPE: 'Pepe',
  OP: 'Optimism',
  BONK: 'Bonk',
  FET: 'Fetch.ai',
  APT: 'Aptos'
}

export const getPrice = async (symbol) => {
  const res = await axios.get(`${BINANCE_URL}/ticker/price?symbol=${symbol}USDT`)
  return parseFloat(res.data.price)
}

export const get24hChange = async (symbol) => {
  try {
    const res = await axios.get(`${BINANCE_URL}/ticker/24hr?symbol=${symbol}USDT`)
    return {
      price: parseFloat(res.data.lastPrice),
      change: parseFloat(res.data.priceChangePercent),
      volume: res.data.volume
    }
  } catch (err) {
    return null
  }
}

// Получить все монеты с сортировкой по объёму
export const getAllPrices = async () => {
  const promises = ALLOWED_COINS.map(async (symbol) => {
    try {
      const res = await axios.get(`${BINANCE_URL}/ticker/24hr?symbol=${symbol}USDT`)
      return {
        symbol: symbol,
        name: COIN_NAMES[symbol] || symbol,
        price: parseFloat(res.data.lastPrice),
        change: parseFloat(res.data.priceChangePercent),
        volume: parseFloat(res.data.quoteVolume)
      }
    } catch {
      return null
    }
  })
  
  const results = await Promise.all(promises)
  return results
    .filter(r => r !== null)
    .sort((a, b) => b.volume - a.volume)
}