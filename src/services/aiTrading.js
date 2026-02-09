import { TechnicalAnalyzer } from './technicalAnalysis'
import { AdvancedAnalyzer } from './advancedAnalysis'
import { RiskManager } from './riskManagement'
import { MarketRegimeDetector } from './marketRegime'
import { TradingStrategies } from './tradingStrategies'

export class AITrader {
  constructor(onSignal, onTrade, portfolio, tradeHistory) {
    this.onSignal = onSignal
    this.onTrade = onTrade
    this.portfolio = portfolio
    this.tradeHistory = tradeHistory
    this.riskManager = new RiskManager(portfolio, tradeHistory)
    this.monitoring = []
    this.isActive = false
    this.analyzer = new TechnicalAnalyzer()
    this.advancedAnalyzer = new AdvancedAnalyzer()
    this.recentTrades = new Map()
    this.recentSignals = new Map() // НОВОЕ - для фильтрации повторов
    this.regimeDetector = new MarketRegimeDetector()
    this.currentRegime = null
    this.cooldown = 3600000 // 1 час
    this.signalCooldown = 1800000 // 30 мин для сигналов
    this.strategies = new TradingStrategies()
  }

  updateRiskManager(portfolio, tradeHistory) {
    this.portfolio = portfolio
    this.tradeHistory = tradeHistory
    this.riskManager = new RiskManager(portfolio, tradeHistory)
  }

  getActivePositions() {
    return []
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

    // Проверка drawdown
    const drawdownCheck = this.riskManager.checkDrawdown()
    if (drawdownCheck.stop) {
      console.log(`⛔ AI остановлен: ${drawdownCheck.reason}`)
      this.isActive = false
      return
    }

    for (const pair of this.monitoring) {
      try {
        const symbol = pair.symbol.replace('/USDT', '')
        
        if (!this.currentRegime || Math.random() < 0.1) {
          this.currentRegime = await this.regimeDetector.detectRegime(symbol)
          console.log(`📊 Market Regime: ${this.currentRegime.regime}`)
        }
        
        const params = this.currentRegime.tradingParams

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
        
        // 🆕 ВЫБИРАЕМ ЛУЧШУЮ СТРАТЕГИЮ
        const strategyResult = this.strategies.selectBestStrategy(analysis)
        
        console.log(`🎯 ${pair.symbol}:`, {
          strategy: strategyResult.primary.strategy,
          confidence: strategyResult.combinedConfidence,
          signal: strategyResult.primary.signal,
          consensus: strategyResult.consensus
        })
        
        // УСЛОВИЯ С УЧЁТОМ СТРАТЕГИИ + MULTI-TF
        const highQualitySignal = 
          analysis.confidence > (pair.minConfidence || 70) &&
          advancedCheck.confidence > 60 &&
          strategyResult.primary.signal !== 'NEUTRAL' &&
          strategyResult.combinedConfidence > 70 &&
          analysis.mlPrediction.direction === 'UP' &&
          analysis.mlPrediction.confidence > (analysis.mlPrediction.multiTF ? 65 : 55) &&
          (analysis.mlPrediction.multiTF ? analysis.mlPrediction.probability.up > 0.6 : true)

        console.log(`🤖 ${pair.symbol}:`, {
          tech: analysis.confidence,
          ml: analysis.mlPrediction.confidence,
          mlType: analysis.mlPrediction.multiTF ? 'Multi-TF' : 'Single',
          mlDirection: analysis.mlPrediction.direction,
          strategy: strategyResult.primary.strategy,
          combined: strategyResult.combinedConfidence
        })
        
          if (highQualitySignal) {
            console.log(`✅ СИГНАЛ! ${pair.symbol}:`, {
              strategy: strategyResult.primary.strategy,
              confidence: strategyResult.combinedConfidence,
              consensus: strategyResult.consensus
            })
          // 🆕 Рассчитываем размер позиции с Kelly
          const avgConfidence = strategyResult.combinedConfidence
          let positionSize = this.riskManager.calculatePositionSize(avgConfidence, analysis)
          positionSize *= strategyResult.primary.sizeMultiplier
            
          // 🆕 Проверка корреляции
          const correlationCheck = this.riskManager.checkCorrelation(
            this.getActivePositions(), 
            pair.symbol
          )
          if (!correlationCheck.allowed) {
            console.log(`⚠️ ${pair.symbol}: ${correlationCheck.reason}`)
            continue
          }
            
          // 🆕 Проверка portfolio heat
          const riskAmount = (analysis.price - parseFloat(analysis.support)) * positionSize / analysis.price
          const heatCheck = this.riskManager.canOpenPosition(
            riskAmount,
            this.getActivePositions()
          )
          if (!heatCheck.allowed) {
            console.log(`⚠️ ${pair.symbol}: ${heatCheck.reason}`)
            continue
          }
            
          const entry = analysis.price
          const atr = parseFloat(analysis.volatility.atr) || entry * 0.02
          
          const signal = {
            pair: pair.symbol,
            confidence: avgConfidence,
            direction: 'LONG',
            entry: entry,
            tp: entry + atr * strategyResult.primary.tpMultiplier,
            sl: entry - atr * strategyResult.primary.slMultiplier,
            amount: positionSize,
            context: advancedCheck.context,
            analysis: advancedCheck,
            regime: this.currentRegime.regime,
            strategy: strategyResult.primary.strategy
          }
            
          this.onSignal(signal)
          this.recentSignals.set(pair.symbol, Date.now())
            
          // Торговать только при высочайшем качестве
          if (avgConfidence > 80 && strategyResult.consensus) {
            this.onTrade(signal)
            this.recentTrades.set(pair.symbol, Date.now())
          }
        } else {
          console.log(`❌ ${pair.symbol} не прошёл:`, {
            confidence: analysis.confidence,
            required: pair.minConfidence,
            passed: analysis.confidence > (pair.minConfidence || 75)
          })
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
        
        console.log(`📊 Manual ${pair.symbol} - Conf: ${analysis.confidence}, Min: ${pair.minConfidence}`)
        
        // 🔥 ИСПОЛЬЗУЕМ ПОЛЗУНОК
        const goodSignal = 
        analysis.confidence > (pair.minConfidence || 70) && // Из настроек!
        advancedCheck.confidence > 50 &&
        analysis.trend.signal === 'BULLISH' &&
        analysis.rsi.value > 35 && analysis.rsi.value < 65
        
        if (goodSignal) {
          const entry = analysis.price
          const atr = parseFloat(analysis.volatility.atr) || entry * 0.02
          
          this.onSignal({
            pair: pair.symbol,
            confidence: Math.round((analysis.confidence + advancedCheck.confidence) / 2),
            direction: analysis.trend.signal === 'BULLISH' ? 'LONG' : 'SHORT',
            entry: entry,
            tp: entry + atr * 1.5,
            sl: entry - atr,
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