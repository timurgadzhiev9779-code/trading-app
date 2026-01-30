import { RSI, MACD, EMA, BollingerBands } from 'technicalindicators'

export class TechnicalAnalyzer {
  async analyze(symbol) {
    // Получаем свечи с Binance
    const candles = await this.getCandles(symbol)
    
    const closes = candles.map(c => parseFloat(c[4]))
    const highs = candles.map(c => parseFloat(c[2]))
    const lows = candles.map(c => parseFloat(c[3]))
    
    // RSI
    const rsi = RSI.calculate({ values: closes, period: 14 })
    const currentRSI = rsi[rsi.length - 1]
    
    // MACD
    const macd = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    })
    const currentMACD = macd[macd.length - 1]
    
    // EMA 20/50
    const ema20 = EMA.calculate({ values: closes, period: 20 })
    const ema50 = EMA.calculate({ values: closes, period: 50 })
    
    // Bollinger Bands
    const bb = BollingerBands.calculate({
      values: closes,
      period: 20,
      stdDev: 2
    })
    const currentBB = bb[bb.length - 1]
    
    const currentPrice = closes[closes.length - 1]
    
    // Анализ
    return {
      price: currentPrice,
      rsi: {
        value: currentRSI.toFixed(2),
        signal: currentRSI < 30 ? 'OVERSOLD' : currentRSI > 70 ? 'OVERBOUGHT' : 'NEUTRAL'
      },
      macd: {
        value: currentMACD.MACD.toFixed(2),
        signal: currentMACD.MACD > currentMACD.signal ? 'BULLISH' : 'BEARISH',
        histogram: currentMACD.histogram.toFixed(2)
      },
      trend: {
        signal: ema20[ema20.length - 1] > ema50[ema50.length - 1] ? 'BULLISH' : 'BEARISH',
        strength: this.getTrendStrength(closes)
      },
      support: currentBB.lower.toFixed(2),
      resistance: currentBB.upper.toFixed(2),
      confidence: this.calculateConfidence(currentRSI, currentMACD, ema20, ema50, currentPrice)
    }
  }
  
  async getCandles(symbol) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=100`
    const res = await fetch(url)
    return await res.json()
  }
  
  getTrendStrength(closes) {
    const recent = closes.slice(-20)
    const avg = recent.reduce((a, b) => a + b) / recent.length
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length
    return variance > 1000000 ? 'STRONG' : variance > 100000 ? 'MODERATE' : 'WEAK'
  }
  
  calculateConfidence(rsi, macd, ema20, ema50, price) {
    let score = 50
    
    // RSI
    if (rsi > 30 && rsi < 70) score += 10
    if (rsi > 40 && rsi < 60) score += 5
    
    // MACD
    if (macd.MACD > macd.signal) score += 15
    if (macd.histogram > 0) score += 5
    
    // Trend
    if (ema20[ema20.length - 1] > ema50[ema50.length - 1]) score += 15
    
    return Math.min(95, Math.max(50, score))
  }
}