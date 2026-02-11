export class WhaleDetector {
  constructor(threshold = 100000) {
    this.threshold = threshold // Минимальная сумма сделки ($100k)
    this.recentWhales = []
    this.ws = null
  }

  // Отслеживание крупных сделок в реальном времени
  trackTrades(symbol, callback) {
    const wsSymbol = symbol.replace('/', '').toLowerCase() + 'usdt'
    
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${wsSymbol}@aggTrade`
    )

    this.ws.onmessage = (event) => {
      try {
        const trade = JSON.parse(event.data)
        const price = parseFloat(trade.p)
        const quantity = parseFloat(trade.q)
        const value = price * quantity

        // Если сделка крупная (>$100k)
        if (value >= this.threshold) {
          const whale = {
            type: trade.m ? 'SELL' : 'BUY', // m = maker (продавец)
            price,
            quantity,
            value,
            time: trade.T,
            symbol
          }

          this.recentWhales.push(whale)
          
          // Храним только последние 100 сделок
          if (this.recentWhales.length > 100) {
            this.recentWhales.shift()
          }

          if (callback) callback(whale)
          
          console.log(`🐋 Whale ${whale.type}: $${(value / 1000).toFixed(1)}K`)
        }
      } catch (err) {
        console.error('Whale tracking error:', err)
      }
    }

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    this.ws.onclose = () => {
      console.log('🐋 Whale tracker closed')
    }

    return this.ws
  }

  // Получить активность китов за последние N минут
  getActivity(minutes = 5) {
    const timeframe = minutes * 60 * 1000
    const cutoff = Date.now() - timeframe
    
    const recent = this.recentWhales.filter(w => w.time > cutoff)

    if (recent.length === 0) {
      return {
        whaleCount: 0,
        buyVolume: 0,
        sellVolume: 0,
        signal: 'NEUTRAL',
        timestamp: Date.now()
      }
    }

    const buyVolume = recent
      .filter(w => w.type === 'BUY')
      .reduce((sum, w) => sum + w.value, 0)
    
    const sellVolume = recent
      .filter(w => w.type === 'SELL')
      .reduce((sum, w) => sum + w.value, 0)

    let signal = 'NEUTRAL'
    if (buyVolume > sellVolume * 1.5) signal = 'BUYING'
    else if (sellVolume > buyVolume * 1.5) signal = 'SELLING'

    return {
      whaleCount: recent.length,
      buyVolume: Math.round(buyVolume),
      sellVolume: Math.round(sellVolume),
      signal,
      timestamp: Date.now()
    }
  }

  // Получить последних N китов
  getRecentWhales(count = 10) {
    return this.recentWhales
      .slice(-count)
      .reverse()
  }

  // Остановить отслеживание
  stop() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Очистить историю
  clear() {
    this.recentWhales = []
  }
}