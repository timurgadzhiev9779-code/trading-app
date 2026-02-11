export class OrderBookAnalyzer {
    constructor() {
      this.baseURL = 'https://api.binance.com/api/v3'
    }
  
    async analyze(symbol) {
      try {
        // Получаем стакан ордеров
        const response = await fetch(
          `${this.baseURL}/depth?symbol=${symbol.replace('/', '')}USDT&limit=100`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const book = await response.json()
        
        // Считаем объёмы
        const bidVolume = book.bids.reduce((sum, [price, qty]) => 
          sum + parseFloat(qty), 0
        )
        const askVolume = book.asks.reduce((sum, [price, qty]) => 
          sum + parseFloat(qty), 0
        )
        
        const totalVolume = bidVolume + askVolume
        const buyPressure = (bidVolume / totalVolume) * 100
        
        // Крупные ордера (стены) - ордера больше 5% от общего объёма
        const bidWalls = book.bids.filter(([p, q]) => 
          parseFloat(q) > bidVolume * 0.05
        )
        const askWalls = book.asks.filter(([p, q]) => 
          parseFloat(q) > askVolume * 0.05
        )
        
        // Определяем сигнал
        let signal = 'NEUTRAL'
        if (buyPressure > 60) signal = 'BULLISH'
        else if (buyPressure < 40) signal = 'BEARISH'
        
        return {
          buyPressure: Math.round(buyPressure),
          bidVolume: bidVolume.toFixed(2),
          askVolume: askVolume.toFixed(2),
          bidWalls: bidWalls.length,
          askWalls: askWalls.length,
          signal,
          timestamp: Date.now()
        }
      } catch (err) {
        console.error('OrderBook Analysis error:', err)
        return {
          buyPressure: 50,
          bidVolume: 0,
          askVolume: 0,
          bidWalls: 0,
          askWalls: 0,
          signal: 'NEUTRAL',
          timestamp: Date.now()
        }
      }
    }
  }