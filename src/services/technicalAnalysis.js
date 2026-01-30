import { RSI, MACD, EMA, BollingerBands, ATR, ADX } from 'technicalindicators'

export class TechnicalAnalyzer {
  async analyze(symbol, interval = '1h') {
    // Получаем свечи с Binance
    const candles = await this.getCandles(symbol, interval)
    
    const closes = candles.map(c => parseFloat(c[4]))
    const highs = candles.map(c => parseFloat(c[2]))
    const lows = candles.map(c => parseFloat(c[3]))
    const volumes = candles.map(c => parseFloat(c[5]))
    const avgVolume = volumes.reduce((a,b) => a+b) / volumes.length
    const currentVolume = volumes[volumes.length - 1]
    
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

    // ATR (волатильность)
    const atr = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14
    })
    const currentATR = atr[atr.length - 1]

    // ADX (сила тренда)
    const adx = ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14
    })
    const currentADX = adx[adx.length - 1]
    
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
      confidence: this.calculateConfidence(
        currentRSI, 
        currentMACD, 
        ema20, 
        ema50, 
        currentPrice,
        currentADX,
        currentATR,
        currentVolume,
        avgVolume
      ),
      volatility: {
        atr: currentATR.toFixed(2),
        level: currentATR > 100 ? 'HIGH' : currentATR > 50 ? 'MODERATE' : 'LOW'
      },
      trendStrength: {
        adx: currentADX.adx.toFixed(2),
        signal: currentADX.adx > 25 ? 'STRONG' : currentADX.adx > 20 ? 'MODERATE' : 'WEAK'
      },
      volume: {
        current: (currentVolume / 1000000).toFixed(2) + 'M',
        signal: currentVolume > avgVolume * 1.5 ? 'HIGH' : currentVolume > avgVolume ? 'ABOVE AVG' : 'LOW'
      }
    }
  }
  
  async getCandles(symbol, interval = '1h') {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=100`
    const res = await fetch(url)
    return await res.json()
  }
  
  async analyzeMultiTimeframe(symbol) {
    const [h1, h4, d1] = await Promise.all([
      this.analyze(symbol, '1h'),
      this.analyze(symbol, '4h'),
      this.analyze(symbol, '1d')
    ])
    
    return {
      current: h1,
      h4: { trend: h4.trend.signal, rsi: h4.rsi.value },
      d1: { trend: d1.trend.signal, rsi: d1.rsi.value },
      alignment: this.checkAlignment(h1, h4, d1)
    }
  }

  checkAlignment(h1, h4, d1) {
    const bullish = [h1, h4, d1].filter(t => t.trend.signal === 'BULLISH').length
    return bullish >= 2 ? 'ALIGNED' : 'MIXED'
  }
  
  getTrendStrength(closes) {
    const recent = closes.slice(-20)
    const avg = recent.reduce((a, b) => a + b) / recent.length
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / recent.length
    return variance > 1000000 ? 'STRONG' : variance > 100000 ? 'MODERATE' : 'WEAK'
  }
  
  calculateConfidence(rsi, macd, ema20, ema50, price, adx, atr, volume, avgVolume) {
    let score = 40
    
    // RSI (max 15)
    if (rsi > 30 && rsi < 70) score += 10
    if (rsi > 40 && rsi < 60) score += 5
    
    // MACD (max 20)
    if (macd.MACD > macd.signal) score += 15
    if (macd.histogram > 0) score += 5
    
    // Trend (max 15)
    if (ema20[ema20.length - 1] > ema50[ema50.length - 1]) score += 15
    
    // ADX (max 15)
    if (adx.adx > 25) score += 15
    else if (adx.adx > 20) score += 10
    else if (adx.adx > 15) score += 5
    
    // Volume (max 10)
    if (volume > avgVolume * 1.5) score += 10
    else if (volume > avgVolume) score += 5
    
    // Volatility (max 5)
    if (atr > 50 && atr < 200) score += 5
    
    return Math.min(95, Math.max(50, Math.round(score)))
  }
}