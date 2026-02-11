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


export class BinanceAPI {
  async getCandles(symbol, interval = '1h', limit = 100) {
    try {
      const res = await axios.get(`${BASE_URL}/klines`, {
        params: {
          symbol: symbol.toUpperCase() + 'USDT',
          interval,
          limit
        }
      })
      
      return res.data.map(candle => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }))
    } catch (err) {
      console.error('Error fetching candles:', err)
      return []
    }
  }

  async getOrderBook(symbol, limit = 100) {
    try {
      const res = await axios.get(`${BASE_URL}/depth`, {
        params: {
          symbol: symbol.toUpperCase() + 'USDT',
          limit
        }
      })
      return res.data
    } catch (err) {
      console.error('Error fetching order book:', err)
      return { bids: [], asks: [] }
    }
  }
}