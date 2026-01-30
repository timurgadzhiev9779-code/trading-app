export class PositionMonitor {
    constructor(onClose) {
      this.onClose = onClose
      this.priceStreams = new Map()
    }
  
    watchPosition(position) {
      const symbol = position.pair.replace('/USDT', '').toLowerCase()
      
      if (this.priceStreams.has(position.pair)) return
  
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}usdt@ticker`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const currentPrice = parseFloat(data.c)
  
        // Проверка TP
        if (currentPrice >= position.tp) {
          const profit = ((currentPrice - position.entry) / position.entry) * position.amount
          this.onClose(position.pair, profit, 'TP HIT')
          this.stopWatching(position.pair)
        }
        
        // Проверка SL
        if (currentPrice <= position.sl) {
          const loss = ((currentPrice - position.entry) / position.entry) * position.amount
          this.onClose(position.pair, loss, 'SL HIT')
          this.stopWatching(position.pair)
        }
      }
  
      this.priceStreams.set(position.pair, ws)
    }
  
    stopWatching(pair) {
      const ws = this.priceStreams.get(pair)
      if (ws) {
        ws.close()
        this.priceStreams.delete(pair)
      }
    }
  
    stopAll() {
      this.priceStreams.forEach(ws => ws.close())
      this.priceStreams.clear()
    }
  }