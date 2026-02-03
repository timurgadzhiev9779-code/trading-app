export const EXCHANGES = {
    BINANCE: 'binance',
    BYBIT: 'bybit',
    GATEIO: 'gateio'
  }
  
  export class ExchangeManager {
    constructor() {
      this.activeExchange = EXCHANGES.BINANCE // По умолчанию
    }
  
    setExchange(exchange) {
      this.activeExchange = exchange
    }
  
    getExchange() {
      return this.activeExchange
    }
  
    // Получить цену с разных бирж
    async getPrice(symbol, exchange = this.activeExchange) {
      switch (exchange) {
        case EXCHANGES.BINANCE:
          return this.getBinancePrice(symbol)
        case EXCHANGES.BYBIT:
          return this.getBybitPrice(symbol)
        case EXCHANGES.GATEIO:
          return this.getGatePrice(symbol)
        default:
          return this.getBinancePrice(symbol)
      }
    }
  
    async getBinancePrice(symbol) {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`)
      const data = await res.json()
      return {
        exchange: 'Binance',
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume)
      }
    }
  
    async getBybitPrice(symbol) {
      const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}USDT`)
      const data = await res.json()
      const ticker = data.result.list[0]
      return {
        exchange: 'Bybit',
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.price24hPcnt) * 100,
        volume: parseFloat(ticker.volume24h)
      }
    }
  
    async getGatePrice(symbol) {
      const res = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${symbol}_USDT`)
      const data = await res.json()
      return {
        exchange: 'Gate.io',
        price: parseFloat(data[0].last),
        change24h: parseFloat(data[0].change_percentage),
        volume: parseFloat(data[0].base_volume)
      }
    }
  
    // Сравнить цены на всех биржах
    async comparePrices(symbol) {
      const [binance, bybit, gate] = await Promise.all([
        this.getBinancePrice(symbol).catch(() => null),
        this.getBybitPrice(symbol).catch(() => null),
        this.getGatePrice(symbol).catch(() => null)
      ])
  
      return [binance, bybit, gate].filter(Boolean)
    }
  }