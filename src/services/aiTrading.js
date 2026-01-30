import { TechnicalAnalyzer } from './technicalAnalysis'

export class AITrader {
constructor(onSignal, onTrade) {
this.onSignal = onSignal
this.onTrade = onTrade
this.monitoring = []
this.isActive = false
this.analyzer = new TechnicalAnalyzer()
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
  console.log('🔍 AI checking signals...')
  if (!this.isActive) return


for (const pair of this.monitoring) {
  try {
    const symbol = pair.symbol.replace('/USDT', '')
    const analysis = await this.analyzer.analyze(symbol)
    console.log('📊 Analysis:', symbol, analysis)

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
      
      this.onSignal(signal)
      this.onTrade(signal)
    }
  } catch (err) {
    console.error('AI analysis error:', err)
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

setTimeout(() => this.checkSignals(), 90000) // Каждые 1.5 мин
}
}