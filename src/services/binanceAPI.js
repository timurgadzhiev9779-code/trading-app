import axios from 'axios'

const BASE_URL = 'https://api.binance.com/api/v3'

export const getPrice = async (symbol) => {
  const res = await axios.get(`${BASE_URL}/ticker/price?symbol=${symbol}USDT`)
  return parseFloat(res.data.price)
}

export const get24hChange = async (symbol) => {
  const res = await axios.get(`${BASE_URL}/ticker/24hr?symbol=${symbol}USDT`)
  return {
    price: parseFloat(res.data.lastPrice),
    change: parseFloat(res.data.priceChangePercent),
    volume: res.data.volume
  }
}

export const getAllPrices = async () => {
  const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK']
  const promises = symbols.map(s => get24hChange(s))
  return await Promise.all(promises)
}