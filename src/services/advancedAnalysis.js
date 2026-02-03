export class AdvancedAnalyzer {
  
    // Fear & Greed Index
    async getFearGreedIndex() {
      try {
        const res = await fetch('https://api.alternative.me/fng/')
        const data = await res.json()
        return {
          value: parseInt(data.data[0].value),
          classification: data.data[0].value_classification // Fear/Greed/Extreme Fear etc
        }
      } catch (err) {
        return { value: 50, classification: 'Neutral' }
      }
    }
  
    // BTC Dominance (важно!)
    async getBTCDominance() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/global')
        const data = await res.json()
        return {
          btc: data.data.market_cap_percentage.btc.toFixed(2),
          eth: data.data.market_cap_percentage.eth.toFixed(2)
        }
      } catch (err) {
        return { btc: 50, eth: 18 }
      }
    }
  
    // Проверка тренда BTC (критично для альтов!)
    async getBTCTrend() {
      try {
        const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=7')
        const candles = await res.json()
        const closes = candles.map(c => parseFloat(c[4]))
        
        const current = closes[closes.length - 1]
        const weekAgo = closes[0]
        const change = ((current - weekAgo) / weekAgo) * 100
        
        return {
          price: current,
          change7d: change.toFixed(2),
          trend: change > 5 ? 'STRONG_BULL' : change > 0 ? 'BULL' : change > -5 ? 'BEAR' : 'STRONG_BEAR'
        }
      } catch (err) {
        return { trend: 'NEUTRAL', change7d: 0 }
      }
    }
  
    // Проверка корреляции с BTC
    async checkBTCCorrelation(symbol) {
      try {
        // Получаем данные по обоим активам
        const [btcCandles, altCandles] = await Promise.all([
          fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24').then(r => r.json()),
          fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=24`).then(r => r.json())
        ])
        
        const btcChanges = this.calculateChanges(btcCandles)
        const altChanges = this.calculateChanges(altCandles)
        
        const correlation = this.calculateCorrelation(btcChanges, altChanges)
        
        return {
          correlation: correlation.toFixed(2),
          strength: Math.abs(correlation) > 0.7 ? 'HIGH' : Math.abs(correlation) > 0.4 ? 'MODERATE' : 'LOW'
        }
      } catch (err) {
        return { correlation: 0.5, strength: 'MODERATE' }
      }
    }
  
    calculateChanges(candles) {
      const changes = []
      for (let i = 1; i < candles.length; i++) {
        const prev = parseFloat(candles[i-1][4])
        const curr = parseFloat(candles[i][4])
        changes.push((curr - prev) / prev)
      }
      return changes
    }
  
    calculateCorrelation(x, y) {
      const n = Math.min(x.length, y.length)
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
      
      return denominator === 0 ? 0 : numerator / denominator
    }
  
    // Комплексный анализ перед входом
    async shouldEnterTrade(symbol, technicalAnalysis) {
      const [btcTrend, btcDom, fearGreed, correlation] = await Promise.all([
        this.getBTCTrend(),
        this.getBTCDominance(),
        this.getFearGreedIndex(),
        this.checkBTCCorrelation(symbol)
      ])
  
      // Правила безопасности
      const checks = {
        btcTrendOK: btcTrend.trend !== 'STRONG_BEAR', // BTC не в сильном падении
        btcDomOK: parseFloat(btcDom.btc) < 60, // BTC доминация не слишком высока (альт-сезон)
        fearGreedOK: fearGreed.value > 20 && fearGreed.value < 80, // Не экстремальные значения
        correlationOK: correlation.strength !== 'HIGH' || btcTrend.trend.includes('BULL'), // Если высокая корреляция, то BTC должен расти
        technicalOK: technicalAnalysis.confidence > 70
      }
  
      const score = Object.values(checks).filter(Boolean).length
      const maxScore = Object.keys(checks).length
  
      return {
        shouldEnter: score >= 4, // Минимум 4 из 5 проверок
        score: score,
        maxScore: maxScore,
        confidence: Math.round((score / maxScore) * 100),
        checks: checks,
        context: {
          btcTrend,
          btcDom,
          fearGreed,
          correlation
        }
      }
    }
  }