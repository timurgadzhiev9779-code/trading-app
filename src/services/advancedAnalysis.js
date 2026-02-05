import { SentimentAnalyzer } from './sentimentAnalysis'

export class AdvancedAnalyzer {
  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer()
  }
  
  // Fear & Greed Index
  async getFearGreedIndex() {
    try {
      const res = await fetch('https://api.alternative.me/fng/')
      const data = await res.json()
      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification
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

  // Проверка ликвидности
  async checkLiquidity(symbol) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=20`)
      const data = await res.json()
      
      const bidVolume = data.bids.reduce((sum, [price, qty]) => sum + parseFloat(qty) * parseFloat(price), 0)
      const askVolume = data.asks.reduce((sum, [price, qty]) => sum + parseFloat(qty) * parseFloat(price), 0)
      const spread = ((parseFloat(data.asks[0][0]) - parseFloat(data.bids[0][0])) / parseFloat(data.bids[0][0])) * 100
      
      return {
        bidVolume: bidVolume.toFixed(0),
        askVolume: askVolume.toFixed(0),
        spread: spread.toFixed(3),
        liquid: spread < 0.1 && bidVolume > 100000
      }
    } catch (err) {
      return { liquid: true, spread: 0.05 }
    }
  }

  // Проверка волатильности (важно для стопов)
  async checkVolatility(symbol) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=24`)
      const candles = await res.json()
      
      const ranges = candles.map(c => (parseFloat(c[2]) - parseFloat(c[3])) / parseFloat(c[3]) * 100)
      const avgRange = ranges.reduce((a, b) => a + b) / ranges.length
      
      return {
        avgRange: avgRange.toFixed(2),
        level: avgRange > 5 ? 'HIGH' : avgRange > 2 ? 'MODERATE' : 'LOW',
        suitable: avgRange > 1 && avgRange < 8
      }
    } catch (err) {
      return { suitable: true, level: 'MODERATE' }
    }
  }

  // Проверка времени (азиатская/европейская/американская сессия)
  checkTradingSession() {
    const hour = new Date().getUTCHours()
    
    if (hour >= 0 && hour < 8) return { session: 'ASIAN', active: 'MODERATE' }
    if (hour >= 7 && hour < 16) return { session: 'EUROPEAN', active: 'HIGH' }
    if (hour >= 13 && hour < 22) return { session: 'AMERICAN', active: 'HIGH' }
    return { session: 'OFF_HOURS', active: 'LOW' }
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

     // Расширенный анализ с НОВЫМИ факторами
  async shouldEnterTrade(symbol, technicalAnalysis) {
    const [btcTrend, btcDom, fearGreed, correlation, liquidity, volatility, sentiment] = await Promise.all([
      this.getBTCTrend(),
      this.getBTCDominance(),
      this.getFearGreedIndex(),
      this.checkBTCCorrelation(symbol),
      this.checkLiquidity(symbol),
      this.checkVolatility(symbol),
      this.sentimentAnalyzer.getComprehensiveSentiment(symbol) // 🆕
    ])
    
    const session = this.checkTradingSession()

    const checks = {
      btcTrendOK: btcTrend.trend !== 'STRONG_BEAR',
      btcDomOK: parseFloat(btcDom.btc) < 60,
      fearGreedOK: fearGreed.value > 20 && fearGreed.value < 80,
      correlationOK: correlation.strength !== 'HIGH' || btcTrend.trend.includes('BULL'),
      technicalOK: technicalAnalysis.confidence > 70,
      liquidityOK: liquidity.liquid,
      volatilityOK: volatility.suitable,
      sessionOK: session.active !== 'LOW',
      sentimentOK: sentiment.composite > 45 && sentiment.signal !== 'BEARISH' // 🆕
    }

    const score = Object.values(checks).filter(Boolean).length
    const maxScore = Object.keys(checks).length

    return {
      shouldEnter: score >= 7, // 7 из 9 (77%)
      score: score,
      maxScore: maxScore,
      confidence: Math.round((score / maxScore) * 100),
      checks: checks,
      context: {
        btcTrend,
        btcDom,
        fearGreed,
        correlation,
        liquidity,
        volatility,
        session,
        sentiment // 🆕
      }
    }
  }
}