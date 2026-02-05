export class MarketRegimeDetector {
  
    // Определение режима рынка
    async detectRegime(symbol) {
      try {
        // Получаем данные за последние 50 свечей
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=50`
        )
        const candles = await res.json()
        
        const closes = candles.map(c => parseFloat(c[4]))
        const highs = candles.map(c => parseFloat(c[2]))
        const lows = candles.map(c => parseFloat(c[3]))
        
        // 1. Тренд или флэт?
        const trendScore = this.detectTrend(closes)
        
        // 2. Волатильность
        const volatility = this.measureVolatility(highs, lows, closes)
        
        // 3. Momentum
        const momentum = this.measureMomentum(closes)
        
        return {
          regime: this.classifyRegime(trendScore, volatility, momentum),
          details: {
            trend: trendScore,
            volatility: volatility,
            momentum: momentum
          },
          tradingParams: this.getOptimalParams(trendScore, volatility, momentum)
        }
      } catch (err) {
        console.error('Regime detection error:', err)
        return {
          regime: 'NORMAL',
          details: {},
          tradingParams: this.getDefaultParams()
        }
      }
    }
  
    // Определение тренда (ADX-like)
    detectTrend(closes) {
      const ema20 = this.calculateEMA(closes, 20)
      const ema50 = this.calculateEMA(closes, 50)
      
      const last20 = ema20[ema20.length - 1]
      const last50 = ema50[ema50.length - 1]
      
      // Угол наклона EMA20
      const slope = (ema20[ema20.length - 1] - ema20[ema20.length - 5]) / ema20[ema20.length - 5]
      
      // EMA spread
      const spread = Math.abs((last20 - last50) / last50)
      
      let score = 0
      
      // Сильный тренд
      if (spread > 0.02 && Math.abs(slope) > 0.01) score = 10
      // Средний тренд
      else if (spread > 0.01 && Math.abs(slope) > 0.005) score = 7
      // Слабый тренд
      else if (spread > 0.005) score = 4
      // Флэт
      else score = 0
      
      return {
        score,
        direction: last20 > last50 ? 'UP' : 'DOWN',
        strength: score >= 7 ? 'STRONG' : score >= 4 ? 'MODERATE' : 'WEAK'
      }
    }
  
    // Измерение волатильности
    measureVolatility(highs, lows, closes) {
      const ranges = []
      for (let i = 0; i < closes.length; i++) {
        const range = (highs[i] - lows[i]) / closes[i]
        ranges.push(range)
      }
      
      const avgRange = ranges.reduce((a, b) => a + b) / ranges.length
      const recentRange = ranges.slice(-10).reduce((a, b) => a + b) / 10
      
      // Нормализованная волатильность
      const normalized = recentRange / avgRange
      
      let level = 'NORMAL'
      if (normalized > 1.5) level = 'HIGH'
      else if (normalized > 1.2) level = 'ELEVATED'
      else if (normalized < 0.8) level = 'LOW'
      
      return {
        current: (recentRange * 100).toFixed(2),
        average: (avgRange * 100).toFixed(2),
        ratio: normalized.toFixed(2),
        level
      }
    }
  
    // Измерение momentum
    measureMomentum(closes) {
      const roc10 = ((closes[closes.length - 1] - closes[closes.length - 10]) / closes[closes.length - 10]) * 100
      const roc20 = ((closes[closes.length - 1] - closes[closes.length - 20]) / closes[closes.length - 20]) * 100
      
      let strength = 'WEAK'
      if (Math.abs(roc10) > 5 && Math.abs(roc20) > 10) strength = 'STRONG'
      else if (Math.abs(roc10) > 3 || Math.abs(roc20) > 5) strength = 'MODERATE'
      
      return {
        roc10: roc10.toFixed(2),
        roc20: roc20.toFixed(2),
        direction: roc10 > 0 ? 'BULLISH' : 'BEARISH',
        strength
      }
    }
  
    // Классификация режима
    classifyRegime(trend, volatility, momentum) {
      // TRENDING HIGH VOL (самый прибыльный, но рискованный)
      if (trend.score >= 7 && volatility.level === 'HIGH') {
        return 'TRENDING_HIGH_VOL'
      }
      
      // TRENDING (хорошо для торговли)
      if (trend.score >= 7 && volatility.level !== 'HIGH') {
        return 'TRENDING'
      }
      
      // CHOPPY (флэт с высокой волатильностью - опасно)
      if (trend.score <= 3 && volatility.level === 'HIGH') {
        return 'CHOPPY'
      }
      
      // RANGING (флэт - торговля от уровней)
      if (trend.score <= 3 && volatility.level === 'LOW') {
        return 'RANGING'
      }
      
      // BREAKOUT POTENTIAL (низкая волатильность перед движением)
      if (volatility.level === 'LOW' && momentum.strength === 'STRONG') {
        return 'BREAKOUT_POTENTIAL'
      }
      
      return 'NORMAL'
    }
  
    // Оптимальные параметры для каждого режима
    getOptimalParams(trend, volatility, momentum) {
      const regime = this.classifyRegime(trend, volatility, momentum)
      
      const params = {
        'TRENDING': {
          minConfidence: 75,
          positionSizeMultiplier: 1.0,
          stopLossMultiplier: 1.2, // Широкие стопы
          takeProfitMultiplier: 1.5, // Большие цели
          maxPositions: 5,
          description: 'Агрессивная торговля по тренду'
        },
        'TRENDING_HIGH_VOL': {
          minConfidence: 80,
          positionSizeMultiplier: 0.7, // Меньше размер из-за риска
          stopLossMultiplier: 1.5, // Очень широкие стопы
          takeProfitMultiplier: 2.0, // Большие цели
          maxPositions: 3,
          description: 'Осторожная торговля волатильного тренда'
        },
        'RANGING': {
          minConfidence: 80,
          positionSizeMultiplier: 0.8,
          stopLossMultiplier: 0.8, // Узкие стопы
          takeProfitMultiplier: 0.8, // Быстрый выход
          maxPositions: 4,
          description: 'Скальпинг во флэте'
        },
        'CHOPPY': {
          minConfidence: 90, // Очень высокий порог
          positionSizeMultiplier: 0.3, // Минимальный риск
          stopLossMultiplier: 0.7,
          takeProfitMultiplier: 0.5,
          maxPositions: 2,
          description: 'Минимальная активность'
        },
        'BREAKOUT_POTENTIAL': {
          minConfidence: 85,
          positionSizeMultiplier: 1.2, // Можно больше
          stopLossMultiplier: 1.0,
          takeProfitMultiplier: 2.0, // Большие цели
          maxPositions: 4,
          description: 'Ожидание пробоя'
        },
        'NORMAL': this.getDefaultParams()
      }
      
      return params[regime] || this.getDefaultParams()
    }
  
    getDefaultParams() {
      return {
        minConfidence: 80,
        positionSizeMultiplier: 1.0,
        stopLossMultiplier: 1.0,
        takeProfitMultiplier: 1.0,
        maxPositions: 4,
        description: 'Стандартная торговля'
      }
    }
  
    calculateEMA(data, period) {
      const k = 2 / (period + 1)
      const ema = [data[0]]
      
      for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k))
      }
      
      return ema
    }
  }