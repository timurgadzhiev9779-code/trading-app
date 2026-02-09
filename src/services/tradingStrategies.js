export class TradingStrategies {
  
  // 1. TREND FOLLOWING - ловим тренды
  trendFollowing(analysis) {
    const adxValue = parseFloat(analysis.trendStrength?.adx) || 0
    const rsiValue = parseFloat(analysis.rsi?.value) || 50
    const macdHistogram = parseFloat(analysis.macd?.histogram) || 0
    
    const checks = {
      strongTrend: adxValue > 25,
      uptrend: analysis.trend?.signal === 'BULLISH',
      momentum: macdHistogram > 0,
      notOverbought: rsiValue < 70,
      volumeConfirm: analysis.volume?.signal !== 'LOW',
      mlConfirm: analysis.mlPrediction?.direction === 'UP'
    }
    
    const score = Object.values(checks).filter(Boolean).length
    const confidence = (score / 6) * 100
    
    return {
      strategy: 'TREND_FOLLOWING',
      signal: score >= 5 ? 'STRONG_BUY' : score >= 4 ? 'BUY' : 'NEUTRAL',
      confidence: Math.round(confidence),
      checks,
      tpMultiplier: 2.0,
      slMultiplier: 1.2,
      sizeMultiplier: 1.0
    }
  }

  // 2. MEAN REVERSION - отскоки от уровней
  meanReversion(analysis) {
    const rsiValue = parseFloat(analysis.rsi?.value) || 50
    const support = parseFloat(analysis.support) || 0
    const resistance = parseFloat(analysis.resistance) || 0
    const bbWidth = resistance - support
    const bbPosition = bbWidth > 0 ? (analysis.price - support) / bbWidth : 0.5
    
    const checks = {
      oversold: rsiValue < 35,
      nearSupport: bbPosition < 0.2,
      divergence: analysis.trend?.signal === 'BEARISH' && rsiValue < 40,
      volumeSpike: analysis.volume?.signal === 'HIGH',
      notDowntrend: analysis.trendStrength?.signal !== 'STRONG' || analysis.trend?.signal !== 'BEARISH',
      mlAgree: analysis.mlPrediction?.direction !== 'DOWN'
    }
    
    const score = Object.values(checks).filter(Boolean).length
    const confidence = (score / 6) * 100
    
    return {
      strategy: 'MEAN_REVERSION',
      signal: score >= 5 ? 'STRONG_BUY' : score >= 4 ? 'BUY' : 'NEUTRAL',
      confidence: Math.round(confidence),
      checks,
      tpMultiplier: 1.2,
      slMultiplier: 0.8,
      sizeMultiplier: 0.8
    }
  }

  // 3. BREAKOUT - пробои консолидаций
  breakout(analysis) {
    const adxValue = parseFloat(analysis.trendStrength?.adx) || 0
    const rsiValue = parseFloat(analysis.rsi?.value) || 50
    const volatilityLevel = analysis.volatility?.level || 'MODERATE'
    
    const checks = {
      tightRange: volatilityLevel === 'LOW',
      volumeExpansion: analysis.volume?.signal === 'HIGH',
      priceAboveMid: analysis.trend?.signal === 'BULLISH',
      rsiNeutral: rsiValue > 45 && rsiValue < 65,
      adxRising: adxValue > 20,
      mlBullish: analysis.mlPrediction?.confidence > 60 && analysis.mlPrediction?.direction === 'UP'
    }
    
    const score = Object.values(checks).filter(Boolean).length
    const confidence = (score / 6) * 100
    
    return {
      strategy: 'BREAKOUT',
      signal: score >= 5 ? 'STRONG_BUY' : score >= 4 ? 'BUY' : 'NEUTRAL',
      confidence: Math.round(confidence),
      checks,
      tpMultiplier: 2.5,
      slMultiplier: 1.0,
      sizeMultiplier: 1.2
    }
  }

  // 4. MOMENTUM - сильные движения
  momentum(analysis) {
    const rsiValue = parseFloat(analysis.rsi?.value) || 50
    const macdHistogram = parseFloat(analysis.macd?.histogram) || 0
    
    const checks = {
      strongMomentum: macdHistogram > 0 && analysis.macd?.signal === 'BULLISH',
      risingTrend: analysis.trend?.signal === 'BULLISH',
      volumeHigh: analysis.volume?.signal === 'HIGH',
      notOverbought: rsiValue < 75,
      volatilityGood: analysis.volatility?.level === 'MODERATE' || analysis.volatility?.level === 'HIGH',
      mlStrong: analysis.mlPrediction?.confidence > 65
    }
    
    const score = Object.values(checks).filter(Boolean).length
    const confidence = (score / 6) * 100
    
    return {
      strategy: 'MOMENTUM',
      signal: score >= 5 ? 'STRONG_BUY' : score >= 4 ? 'BUY' : 'NEUTRAL',
      confidence: Math.round(confidence),
      checks,
      tpMultiplier: 1.8,
      slMultiplier: 1.5,
      sizeMultiplier: 1.1
    }
  }

  // 5. VOLUME PROFILE - следуем за умными деньгами
  volumeProfile(analysis) {
    const rsiValue = parseFloat(analysis.rsi?.value) || 50
    
    const checks = {
      accumulation: analysis.volume?.signal === 'HIGH' && analysis.trend?.signal === 'BULLISH',
      notOverbought: rsiValue < 70,
      trendConfirm: analysis.trend?.signal === 'BULLISH',
      macdBullish: analysis.macd?.signal === 'BULLISH',
      mlAgree: analysis.mlPrediction?.direction === 'UP',
      goodVolatility: analysis.volatility?.level !== 'HIGH'
    }
    
    const score = Object.values(checks).filter(Boolean).length
    const confidence = (score / 6) * 100
    
    return {
      strategy: 'VOLUME_PROFILE',
      signal: score >= 5 ? 'STRONG_BUY' : score >= 4 ? 'BUY' : 'NEUTRAL',
      confidence: Math.round(confidence),
      checks,
      tpMultiplier: 1.5,
      slMultiplier: 1.0,
      sizeMultiplier: 1.0
    }
  }

  // Главный метод - выбирает лучшую стратегию
  selectBestStrategy(analysis) {
    const strategies = [
      this.trendFollowing(analysis),
      this.meanReversion(analysis),
      this.breakout(analysis),
      this.momentum(analysis),
      this.volumeProfile(analysis)
    ]
    
    strategies.sort((a, b) => b.confidence - a.confidence)
    
    const best = strategies[0]
    const second = strategies[1]
    
    console.log(`📈 Лучшая стратегия: ${best.strategy} (${best.confidence}%)`)
    console.log(`📊 Вторая: ${second.strategy} (${second.confidence}%)`)
    
    const consensus = best.signal !== 'NEUTRAL' && second.signal !== 'NEUTRAL'
    
    return {
      primary: best,
      secondary: second,
      consensus,
      combinedConfidence: consensus 
        ? Math.round((best.confidence + second.confidence) / 2)
        : best.confidence
    }
  }
}