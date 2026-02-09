import { RSI, MACD, EMA, BollingerBands, ATR, ADX } from 'technicalindicators'

export class FeatureEngineering {
  
  extractFeatures(candles) {
    if (candles.length < 100) return null

    const closes = candles.map(c => c.close)
    const highs = candles.map(c => c.high)
    const lows = candles.map(c => c.low)
    const volumes = candles.map(c => c.volume)

    // PRICE FEATURES (20)
    const priceFeatures = this.extractPriceFeatures(closes, highs, lows)
    
    // TECHNICAL INDICATORS (30)
    const technicalFeatures = this.extractTechnicalFeatures(closes, highs, lows, volumes)
    
    // MOMENTUM (15)
    const momentumFeatures = this.extractMomentumFeatures(closes)
    
    // VOLATILITY (10)
    const volatilityFeatures = this.extractVolatilityFeatures(highs, lows, closes)
    
    // VOLUME (10)
    const volumeFeatures = this.extractVolumeFeatures(volumes, closes)
    
    // TIME FEATURES (5)
    const timeFeatures = this.extractTimeFeatures(candles)
    
    // MARKET STRUCTURE (15)
    const structureFeatures = this.extractMarketStructure(highs, lows, closes)
    
    // AGGREGATED FEATURES (10)
    const aggregatedFeatures = this.extractAggregatedFeatures(closes)

    return {
      ...priceFeatures,
      ...technicalFeatures,
      ...momentumFeatures,
      ...volatilityFeatures,
      ...volumeFeatures,
      ...timeFeatures,
      ...structureFeatures,
      ...aggregatedFeatures
    }
  }

  extractPriceFeatures(closes, highs, lows) {
    const current = closes[closes.length - 1]
    
    return {
      // Returns
      return_1h: (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2],
      return_4h: (closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5],
      return_1d: (closes[closes.length - 1] - closes[closes.length - 24]) / closes[closes.length - 24],
      return_7d: (closes[closes.length - 1] - closes[closes.length - 168]) / closes[closes.length - 168],
      
      // High/Low ratios
      hl_ratio: (highs[highs.length - 1] - lows[lows.length - 1]) / closes[closes.length - 1],
      high_distance: (highs[highs.length - 1] - current) / current,
      low_distance: (current - lows[lows.length - 1]) / current,
      
      // Moving average distances
      sma_20: closes.slice(-20).reduce((a,b) => a+b) / 20,
      sma_50: closes.slice(-50).reduce((a,b) => a+b) / 50,
      distance_sma20: (current - closes.slice(-20).reduce((a,b) => a+b) / 20) / current,
      distance_sma50: (current - closes.slice(-50).reduce((a,b) => a+b) / 50) / current
    }
  }

  extractTechnicalFeatures(closes, highs, lows, volumes) {
    const rsi = RSI.calculate({ values: closes, period: 14 })
    const macd = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    })
    const bb = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 })
    const atr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 })
    const adx = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 })

    // Проверка на пустые данные
    if (!rsi.length || !macd.length || !bb.length || !atr.length || !adx.length) {
      return null
    }

    const currentRSI = rsi[rsi.length - 1]
    const currentMACD = macd[macd.length - 1]
    const currentBB = bb[bb.length - 1]
    const currentATR = atr[atr.length - 1]
    const currentADX = adx[adx.length - 1]

    // Проверка на undefined
    if (!currentBB || !currentMACD || !currentADX) {
      return null
    }

    return {
      rsi: currentRSI,
      rsi_normalized: currentRSI / 100,
      rsi_overbought: currentRSI > 70 ? 1 : 0,
      rsi_oversold: currentRSI < 30 ? 1 : 0,
      
      macd: currentMACD.MACD,
      macd_signal: currentMACD.signal,
      macd_histogram: currentMACD.histogram,
      macd_bullish: currentMACD.MACD > currentMACD.signal ? 1 : 0,
      
      bb_position: (closes[closes.length - 1] - currentBB.lower) / (currentBB.upper - currentBB.lower),
      bb_width: (currentBB.upper - currentBB.lower) / currentBB.middle,
      
      atr: currentATR,
      atr_normalized: currentATR / closes[closes.length - 1],
      
      adx: currentADX.adx,
      adx_strong: currentADX.adx > 25 ? 1 : 0
    }
  }

  extractMomentumFeatures(closes) {
    const roc_periods = [5, 10, 20, 50]
    const momentum = {}
    
    roc_periods.forEach(period => {
      if (closes.length > period) {
        momentum[`roc_${period}`] = (closes[closes.length - 1] - closes[closes.length - period]) / closes[closes.length - period]
      }
    })

    return momentum
  }

  extractVolatilityFeatures(highs, lows, closes) {
    const returns = []
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1])
    }

    const volatility_10 = this.calculateStdDev(returns.slice(-10))
    const volatility_20 = this.calculateStdDev(returns.slice(-20))
    const volatility_50 = this.calculateStdDev(returns.slice(-50))

    return {
      volatility_10h: volatility_10,
      volatility_20h: volatility_20,
      volatility_50h: volatility_50,
      volatility_ratio: volatility_10 / volatility_50
    }
  }

  extractVolumeFeatures(volumes, closes) {
    const avgVolume = volumes.slice(-20).reduce((a,b) => a+b) / 20
    const currentVolume = volumes[volumes.length - 1]
    
    // Volume-Price correlation
    const volumeChanges = []
    const priceChanges = []
    for (let i = 1; i < Math.min(20, volumes.length); i++) {
      volumeChanges.push((volumes[volumes.length - i] - volumes[volumes.length - i - 1]) / volumes[volumes.length - i - 1])
      priceChanges.push((closes[closes.length - i] - closes[closes.length - i - 1]) / closes[closes.length - i - 1])
    }

    return {
      volume_ratio: currentVolume / avgVolume,
      volume_spike: currentVolume > avgVolume * 2 ? 1 : 0,
      volume_trend: volumes.slice(-5).reduce((a,b) => a+b) / volumes.slice(-10, -5).reduce((a,b) => a+b)
    }
  }

  extractTimeFeatures(candles) {
    const lastCandle = candles[candles.length - 1]
    const date = new Date(lastCandle.timestamp)
    
    return {
      hour: date.getUTCHours() / 24, // Normalized
      day_of_week: date.getUTCDay() / 7,
      is_weekend: (date.getUTCDay() === 0 || date.getUTCDay() === 6) ? 1 : 0
    }
  }

  extractMarketStructure(highs, lows, closes) {
    // Higher highs, higher lows
    const recentHighs = highs.slice(-10)
    const recentLows = lows.slice(-10)
    
    const higherHighs = recentHighs[recentHighs.length - 1] > Math.max(...recentHighs.slice(0, -1)) ? 1 : 0
    const higherLows = recentLows[recentLows.length - 1] > Math.min(...recentLows.slice(0, -1)) ? 1 : 0
    
    // Support/Resistance proximity
    const support = Math.min(...lows.slice(-50))
    const resistance = Math.max(...highs.slice(-50))
    const current = closes[closes.length - 1]
    
    return {
      higher_highs: higherHighs,
      higher_lows: higherLows,
      uptrend: higherHighs && higherLows ? 1 : 0,
      distance_to_support: (current - support) / current,
      distance_to_resistance: (resistance - current) / current
    }
  }

  extractAggregatedFeatures(closes) {
    // Patterns
    const last3 = closes.slice(-3)
    const increasing = last3[0] < last3[1] && last3[1] < last3[2] ? 1 : 0
    const decreasing = last3[0] > last3[1] && last3[1] > last3[2] ? 1 : 0
    
    return {
      pattern_increasing: increasing,
      pattern_decreasing: decreasing
    }
  }

  calculateStdDev(values) {
    const avg = values.reduce((a,b) => a+b) / values.length
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    return Math.sqrt(squareDiffs.reduce((a,b) => a+b) / values.length)
  }

  // Создать лейблы для обучения (что произошло через N часов)
  createLabels(candles, lookahead = 4) {
    const labels = []
    
    for (let i = 0; i < candles.length - lookahead; i++) {
      const current = candles[i].close
      const future = candles[i + lookahead].close
      const change = (future - current) / current
      
      // 3 класса: UP (>1%), DOWN (<-1%), FLAT
      if (change > 0.01) labels.push(2) // UP
      else if (change < -0.01) labels.push(0) // DOWN
      else labels.push(1) // FLAT
    }
    
    return labels
  }
}