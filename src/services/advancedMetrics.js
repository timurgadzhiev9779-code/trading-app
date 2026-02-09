export class AdvancedMetrics {
  
    // 1. ORDER FLOW - крупные ордера и китовые стены
    async analyzeOrderFlow(symbol) {
      try {
        // Получаем order book (глубину рынка)
        const res = await fetch(
          `https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=100`
        )
        const orderBook = await res.json()
        
        // Анализируем стены
        const bidWalls = this.findWalls(orderBook.bids, 'bid')
        const askWalls = this.findWalls(orderBook.asks, 'ask')
        
        // Имбаланс bid/ask
        const totalBids = orderBook.bids.reduce((sum, [price, qty]) => sum + parseFloat(price) * parseFloat(qty), 0)
        const totalAsks = orderBook.asks.reduce((sum, [price, qty]) => sum + parseFloat(price) * parseFloat(qty), 0)
        const imbalance = (totalBids - totalAsks) / (totalBids + totalAsks)
        
        return {
          bidWalls,
          askWalls,
          imbalance: imbalance.toFixed(3),
          signal: imbalance > 0.2 ? 'BULLISH' : imbalance < -0.2 ? 'BEARISH' : 'NEUTRAL',
          strength: Math.abs(imbalance) > 0.3 ? 'STRONG' : Math.abs(imbalance) > 0.15 ? 'MODERATE' : 'WEAK'
        }
      } catch (err) {
        return { signal: 'NEUTRAL', strength: 'UNKNOWN' }
      }
    }
  
    findWalls(orders, side) {
      const walls = []
      const avgSize = orders.reduce((sum, [p, q]) => sum + parseFloat(q), 0) / orders.length
      
      orders.forEach(([price, qty]) => {
        const size = parseFloat(qty)
        if (size > avgSize * 5) { // 5x больше среднего = стена
          walls.push({
            price: parseFloat(price),
            size: size,
            type: side,
            strength: size / avgSize
          })
        }
      })
      
      return walls.slice(0, 3) // Топ-3 стены
    }
  
    // 2. FUNDING RATE - лонг/шорт дисбаланс на фьючерсах
    async getFundingRate(symbol) {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=1`
        )
        const data = await res.json()
        
        if (!data[0]) return { rate: 0, signal: 'NEUTRAL' }
        
        const rate = parseFloat(data[0].fundingRate) * 100
        
        return {
          rate: rate.toFixed(4),
          signal: rate > 0.05 ? 'OVERCROWDED_LONG' : rate < -0.05 ? 'OVERCROWDED_SHORT' : 'BALANCED',
          // Отрицательный funding = много шортов = потенциально бычий
          tradingSignal: rate < -0.03 ? 'BULLISH' : rate > 0.03 ? 'BEARISH' : 'NEUTRAL'
        }
      } catch (err) {
        return { rate: 0, signal: 'NEUTRAL', tradingSignal: 'NEUTRAL' }
      }
    }
  
    // 3. OPEN INTEREST - рост позиций = волатильность впереди
    async getOpenInterest(symbol) {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`
        )
        const data = await res.json()
        
        const currentOI = parseFloat(data.openInterest)
        
        // Сравниваем с историей (простая версия)
        const cachedOI = parseFloat(localStorage.getItem(`oi_${symbol}`)) || currentOI
        localStorage.setItem(`oi_${symbol}`, currentOI)
        
        const change = ((currentOI - cachedOI) / cachedOI) * 100
        
        return {
          current: currentOI.toFixed(0),
          change: change.toFixed(2),
          signal: change > 10 ? 'RISING_FAST' : change > 5 ? 'RISING' : change < -10 ? 'FALLING_FAST' : 'STABLE',
          // Растущий OI + растущая цена = здоровый тренд
          // Растущий OI + падающая цена = медвежий тренд
        }
      } catch (err) {
        return { signal: 'UNKNOWN' }
      }
    }
  
    // 4. LIQUIDATION LEVELS - где стопы толпы
    async getLiquidationHeatmap(symbol) {
      try {
        // Упрощённый подход: используем ATR для оценки
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=24`
        )
        const candles = await res.json()
        
        const currentPrice = parseFloat(candles[candles.length - 1][4])
        const atr = this.calculateATR(candles)
        
        // Типичные уровни ликвидаций (leverage × ATR)
        const levels = {
          liquidation10x: currentPrice - atr * 0.9, // 10x leverage
          liquidation20x: currentPrice - atr * 0.45, // 20x leverage
          liquidation50x: currentPrice - atr * 0.18, // 50x leverage
          liquidation100x: currentPrice - atr * 0.09  // 100x leverage
        }
        
        return {
          levels,
          nearest: levels.liquidation10x,
          risk: currentPrice - levels.liquidation10x < atr * 0.5 ? 'HIGH' : 'LOW'
        }
      } catch (err) {
        return { risk: 'UNKNOWN' }
      }
    }
  
    calculateATR(candles) {
      let atr = 0
      for (let i = 1; i < candles.length; i++) {
        const high = parseFloat(candles[i][2])
        const low = parseFloat(candles[i][3])
        const prevClose = parseFloat(candles[i - 1][4])
        
        const tr = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose)
        )
        atr += tr
      }
      return atr / (candles.length - 1)
    }
  
    // 5. EXCHANGE FLOWS - входы/выходы с бирж
    async getExchangeFlows(symbol) {
      // Для этого нужны специальные API (Glassnode/CryptoQuant)
      // Упрощённая версия: анализируем объём
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`
        )
        const data = await res.json()
        
        const volume = parseFloat(data.volume)
        const priceChange = parseFloat(data.priceChangePercent)
        
        // Эвристика: большой объём + падение = возможно вывод
        let signal = 'NEUTRAL'
        if (volume > 1000000 && priceChange < -5) signal = 'OUTFLOW' // Потенциально бычий
        if (volume > 1000000 && priceChange > 5) signal = 'INFLOW' // Потенциально медвежий
        
        return {
          volume: volume.toFixed(0),
          signal,
          interpretation: signal === 'OUTFLOW' ? 'BULLISH' : signal === 'INFLOW' ? 'BEARISH' : 'NEUTRAL'
        }
      } catch (err) {
        return { signal: 'NEUTRAL' }
      }
    }
  
    // Комплексный анализ всех метрик
    async comprehensiveAnalysis(symbol) {
      console.log(`🔬 Advanced metrics для ${symbol}...`)
      
      const [orderFlow, funding, openInterest, liquidations, flows] = await Promise.all([
        this.analyzeOrderFlow(symbol),
        this.getFundingRate(symbol),
        this.getOpenInterest(symbol),
        this.getLiquidationHeatmap(symbol),
        this.getExchangeFlows(symbol)
      ])
      
      // Scoring system
      let bullishScore = 0
      
      if (orderFlow.signal === 'BULLISH') bullishScore += orderFlow.strength === 'STRONG' ? 2 : 1
      if (funding.tradingSignal === 'BULLISH') bullishScore += 2
      if (openInterest.signal === 'RISING') bullishScore += 1
      if (flows.interpretation === 'BULLISH') bullishScore += 1
      
      return {
        orderFlow,
        funding,
        openInterest,
        liquidations,
        flows,
        bullishScore,
        maxScore: 7,
        signal: bullishScore >= 5 ? 'STRONG_BUY' : bullishScore >= 4 ? 'BUY' : bullishScore <= 2 ? 'SELL' : 'NEUTRAL'
      }
    }
  }