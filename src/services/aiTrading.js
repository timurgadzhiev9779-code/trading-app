import { TechnicalAnalyzer } from './technicalAnalysis'
import { ALLOWED_COINS } from './binanceAPI'

// Преобразуем список монет в формат для мониторинга
export const getMonitoringPairs = () => {
  return ALLOWED_COINS.map(symbol => ({
    symbol: `${symbol}/USDT`,
    price: 0
  }))
}

export class AITrader {
  constructor(onSignal, onTrade) {
    this.onSignal = onSignal
    this.onTrade = onTrade
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
  }

  start(pairs = null) {
    // Если пары не переданы — используем весь список
    this.monitoring = pairs || getMonitoringPairs()
    console.log('🤖 AI Started with pairs:', this.monitoring.length, 'монет')
    this.isActive = true
    this.checkSignals()
  }

  stop() {
    this.isActive = false
    console.log('🤖 AI Stopped')
  }

  async checkSignals() {
    console.log('🔍 AI checking signals...')
    if (!this.isActive) return

    for (const pair of this.monitoring) {
      try {
        const symbol = pair.symbol.replace('/USDT', '')
        const analysis = await this.analyzer.analyze(symbol)
        console.log('📊 Analysis:', symbol, 'Confidence:', analysis.confidence, 'Trend:', analysis.trend.signal)

        // Условия входа
        const shouldTrade = 
          analysis.confidence > 75 &&
          analysis.trend.signal === 'BULLISH' &&
          analysis.rsi.value > 30 && analysis.rsi.value < 70 &&
          analysis.macd.signal === 'BULLISH'
        
        if (shouldTrade) {
          const signal = {
            pair: pair.symbol,
            confidence: analysis.confidence,
            direction: 'LONG',
            entry: analysis.price,
            tp: parseFloat(analysis.resistance),
            sl: parseFloat(analysis.support)
          }
          
          console.log('✅ Signal found:', symbol)
          this.onSignal(signal)
          this.onTrade(signal)
        }
      } catch (err) {
        // Тихо пропускаем ошибки (монета может не быть на Binance)
      }
    }

    setTimeout(() => this.checkSignals(), 60000) // Каждую минуту
  }
}

export class ManualMonitor {
  constructor(onSignal) {
    this.onSignal = onSignal
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
  }

  start(pairs = null) {
    this.monitoring = pairs || getMonitoringPairs()
    console.log('📊 Manual Monitor Started with:', this.monitoring.length, 'монет')
    this.isActive = true
    this.checkSignals()
  }

  stop() {
    this.isActive = false
    console.log('📊 Manual Monitor Stopped')
  }

  async checkSignals() {
    if (!this.isActive) return

    for (const pair of this.monitoring) {
      try {
        const symbol = pair.symbol.replace('/USDT', '')
        const analysis = await this.analyzer.analyze(symbol)
        
        if (analysis.confidence > 70 && analysis.trend.signal === 'BULLISH') {
          this.onSignal({
            pair: pair.symbol,
            confidence: analysis.confidence,
            direction: 'LONG',
            entry: analysis.price,
            tp: parseFloat(analysis.resistance),
            sl: parseFloat(analysis.support),
            manual: true,
            rsi: analysis.rsi.value,
            macd: analysis.macd.signal
          })
        }
      } catch (err) {
        // Тихо пропускаем
      }
    }

    setTimeout(() => this.checkSignals(), 90000) // Каждые 1.5 мин
  }
}