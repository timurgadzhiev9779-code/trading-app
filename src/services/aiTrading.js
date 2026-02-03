import { TechnicalAnalyzer } from './technicalAnalysis'
import { AdvancedAnalyzer } from './advancedAnalysis'

export class AITrader {
  constructor(onSignal, onTrade) {
    this.onSignal = onSignal
    this.onTrade = onTrade
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
    this.advancedAnalyzer = new AdvancedAnalyzer()
    this.recentTrades = new Map()
    this.cooldown = 3600000 // 1 час
  }

  start(pairs) {
    console.log('🤖 AI Started with pairs:', pairs)
    this.isActive = true
    this.monitoring = pairs
    this.checkSignals()
  }

  stop() {
    this.isActive = false
  }

  async checkSignals() {
    if (!this.isActive) return

    for (const pair of this.monitoring) {
      try {
        const symbol = pair.symbol.replace('/USDT', '')
        
        // Проверка cooldown
        const lastTrade = this.recentTrades.get(pair.symbol)
        if (lastTrade && Date.now() - lastTrade < this.cooldown) {
          console.log(`⏳ ${pair.symbol} в cooldown`)
          continue
        }
        
        // Технический анализ
        const mtf = await this.analyzer.analyzeMultiTimeframe(symbol)
        const analysis = mtf.current
        
        // Расширенный анализ
        const advancedCheck = await this.advancedAnalyzer.shouldEnterTrade(symbol, analysis)
        console.log(`📊 ${pair.symbol} Advanced:`, advancedCheck)
        
        // Комбинированные условия
        const shouldTrade = 
          analysis.confidence > 75 &&
          mtf.alignment === 'ALIGNED' &&
          analysis.trend.signal === 'BULLISH' &&
          analysis.trendStrength.signal !== 'WEAK' &&
          analysis.rsi.value > 35 && analysis.rsi.value < 65 &&
          analysis.macd.signal === 'BULLISH' &&
          analysis.volume.signal !== 'LOW' &&
          advancedCheck.shouldEnter
        
        if (shouldTrade) {
          const signal = {
            pair: pair.symbol,
            confidence: Math.round((analysis.confidence + advancedCheck.confidence) / 2),
            direction: 'LONG',
            entry: analysis.price,
            tp: parseFloat(analysis.fibonacci.fib236),
            sl: parseFloat(analysis.support),
            context: advancedCheck.context
          }
          
          this.onSignal(signal)
          this.onTrade(signal)
          this.recentTrades.set(pair.symbol, Date.now())
        }
      } catch (err) {
        console.error('AI analysis error:', err)
      }
    }

    setTimeout(() => this.checkSignals(), 180000) // 3 минуты
  }
}

export class ManualMonitor {
  constructor(onSignal) {
    this.onSignal = onSignal
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
  }

  start(pairs) {
    this.isActive = true
    this.monitoring = pairs
    this.checkSignals()
  }

  stop() {
    this.isActive = false
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
        console.error('Manual monitor error:', err)
      }
    }

    setTimeout(() => this.checkSignals(), 90000)
  }
}