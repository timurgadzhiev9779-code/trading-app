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
    this.recentSignals = new Map() // НОВОЕ - для фильтрации повторов
    this.cooldown = 3600000 // 1 час
    this.signalCooldown = 1800000 // 30 мин для сигналов
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
        
        // Проверка cooldown для трейдов
        const lastTrade = this.recentTrades.get(pair.symbol)
        if (lastTrade && Date.now() - lastTrade < this.cooldown) {
          console.log(`⏳ ${pair.symbol} в cooldown`)
          continue
        }
        
        // Проверка cooldown для сигналов (чтобы не спамить)
        const lastSignal = this.recentSignals.get(pair.symbol)
        if (lastSignal && Date.now() - lastSignal < this.signalCooldown) {
          continue
        }
        
        // Технический анализ
        const mtf = await this.analyzer.analyzeMultiTimeframe(symbol)
        const analysis = mtf.current
        
        // Расширенный анализ
        const advancedCheck = await this.advancedAnalyzer.shouldEnterTrade(symbol, analysis)
        console.log(`📊 ${pair.symbol} Advanced:`, advancedCheck)
        
        // УЖЕСТОЧЁННЫЕ условия для качества
        const highQualitySignal = 
          analysis.confidence > 80 &&
          advancedCheck.confidence > 75 &&
          mtf.alignment === 'ALIGNED' &&
          analysis.trend.signal === 'BULLISH' &&
          analysis.trendStrength.signal !== 'WEAK' &&
          analysis.rsi.value > 40 && analysis.rsi.value < 60 &&
          analysis.macd.signal === 'BULLISH' &&
          analysis.macd.histogram > 0 &&
          analysis.volume.signal === 'HIGH' &&
          advancedCheck.shouldEnter
        
        if (highQualitySignal) {
          const signal = {
            pair: pair.symbol,
            confidence: Math.round((analysis.confidence + advancedCheck.confidence) / 2),
            direction: 'LONG',
            entry: analysis.price,
            tp: parseFloat(analysis.fibonacci.fib236),
            sl: parseFloat(analysis.support),
            context: advancedCheck.context,
            analysis: advancedCheck
          }
          
          this.onSignal(signal)
          this.recentSignals.set(pair.symbol, Date.now())
          
          // Только если высочайшее качество - торговать автоматически
          if (analysis.confidence > 85 && advancedCheck.confidence > 80) {
            this.onTrade(signal)
            this.recentTrades.set(pair.symbol, Date.now())
          }
        }
      } catch (err) {
        console.error('AI analysis error:', err)
      }
    }

    setTimeout(() => this.checkSignals(), 180000) // 3 минуты
  }
  
  // Очистка старых записей
  clearOldRecords() {
    const now = Date.now()
    
    for (const [symbol, timestamp] of this.recentTrades.entries()) {
      if (now - timestamp > this.cooldown) {
        this.recentTrades.delete(symbol)
      }
    }
    
    for (const [symbol, timestamp] of this.recentSignals.entries()) {
      if (now - timestamp > this.signalCooldown) {
        this.recentSignals.delete(symbol)
      }
    }
  }
}

export class ManualMonitor {
  constructor(onSignal) {
    this.onSignal = onSignal
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
    this.advancedAnalyzer = new AdvancedAnalyzer()
    this.recentSignals = new Map()
    this.signalCooldown = 1800000 // 30 мин
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
        
        // Проверка cooldown
        const lastSignal = this.recentSignals.get(pair.symbol)
        if (lastSignal && Date.now() - lastSignal < this.signalCooldown) {
          continue
        }
        
        const mtf = await this.analyzer.analyzeMultiTimeframe(symbol)
        const analysis = mtf.current
        const advancedCheck = await this.advancedAnalyzer.shouldEnterTrade(symbol, analysis)
        
        // Для ручного мониторинга - чуть мягче критерии, но всё равно качественно
        const goodSignal = 
          analysis.confidence > 75 &&
          advancedCheck.confidence > 70 &&
          analysis.trend.signal === 'BULLISH' &&
          analysis.rsi.value > 35 && analysis.rsi.value < 65 &&
          advancedCheck.shouldEnter
        
        if (goodSignal) {
          this.onSignal({
            pair: pair.symbol,
            confidence: Math.round((analysis.confidence + advancedCheck.confidence) / 2),
            direction: analysis.trend.signal === 'BULLISH' ? 'LONG' : 'SHORT',
            entry: analysis.price,
            tp: parseFloat(analysis.fibonacci.fib236),
            sl: parseFloat(analysis.support),
            manual: true,
            rsi: analysis.rsi.value,
            macd: analysis.macd.signal,
            context: advancedCheck.context,
            analysis: advancedCheck
          })
          
          this.recentSignals.set(pair.symbol, Date.now())
        }
      } catch (err) {
        console.error('Manual monitor error:', err)
      }
    }

    setTimeout(() => this.checkSignals(), 120000) // 2 минуты
  }
}