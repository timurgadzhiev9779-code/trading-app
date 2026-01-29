export class AITrader {
    constructor(onSignal, onTrade) {
      this.onSignal = onSignal
      this.onTrade = onTrade
      this.monitoring = []
      this.isActive = false
    }
  
    start(pairs) {
      this.isActive = true
      this.monitoring = pairs
      this.checkSignals()
    }
  
    stop() {
      this.isActive = false
    }
  
    checkSignals() {
      if (!this.isActive) return
  
      this.monitoring.forEach(pair => {
        // Mock AI анализ (потом заменим на реальный)
        const confidence = Math.floor(Math.random() * 30) + 70 // 70-100%
        
        if (confidence > 75) {
          this.onSignal({
            pair: pair.symbol,
            confidence,
            direction: 'LONG',
            entry: pair.price,
            tp: pair.price * 1.03,
            sl: pair.price * 0.98
          })
        }
      })
  
      setTimeout(() => this.checkSignals(), 30000) // Проверка каждые 30 сек
    }
  
    executeTrade(signal) {
      if (!this.isActive) return
      this.onTrade(signal)
    }
  }