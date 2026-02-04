export class PatternRecognizer {
  
    // Свечные паттерны
    recognizeCandlePatterns(candles) {
      const patterns = []
      const recent = candles.slice(-10)
      
      for (let i = 2; i < recent.length; i++) {
        const c0 = this.parseCandle(recent[i]) // current
        const c1 = this.parseCandle(recent[i - 1]) // previous
        const c2 = this.parseCandle(recent[i - 2]) // 2 bars ago
        
        // Hammer (Молот)
        if (this.isHammer(c0)) {
          patterns.push({
            name: 'Hammer',
            type: 'BULLISH_REVERSAL',
            strength: 7,
            description: 'Бычий разворотный паттерн'
          })
        }
        
        // Hanging Man (Повешенный)
        if (this.isHangingMan(c0, c1)) {
          patterns.push({
            name: 'Hanging Man',
            type: 'BEARISH_REVERSAL',
            strength: 6,
            description: 'Медвежий разворотный паттерн'
          })
        }
        
        // Bullish Engulfing (Бычье поглощение)
        if (this.isBullishEngulfing(c0, c1)) {
          patterns.push({
            name: 'Bullish Engulfing',
            type: 'BULLISH_REVERSAL',
            strength: 8,
            description: 'Сильный бычий разворот'
          })
        }
        
        // Bearish Engulfing (Медвежье поглощение)
        if (this.isBearishEngulfing(c0, c1)) {
          patterns.push({
            name: 'Bearish Engulfing',
            type: 'BEARISH_REVERSAL',
            strength: 8,
            description: 'Сильный медвежий разворот'
          })
        }
        
        // Morning Star (Утренняя звезда)
        if (this.isMorningStar(c0, c1, c2)) {
          patterns.push({
            name: 'Morning Star',
            type: 'BULLISH_REVERSAL',
            strength: 9,
            description: 'Очень сильный бычий разворот'
          })
        }
        
        // Evening Star (Вечерняя звезда)
        if (this.isEveningStar(c0, c1, c2)) {
          patterns.push({
            name: 'Evening Star',
            type: 'BEARISH_REVERSAL',
            strength: 9,
            description: 'Очень сильный медвежий разворот'
          })
        }
        
        // Doji
        if (this.isDoji(c0)) {
          patterns.push({
            name: 'Doji',
            type: 'INDECISION',
            strength: 5,
            description: 'Неопределённость рынка'
          })
        }
      }
      
      return patterns
    }
  
    parseCandle(candle) {
      return {
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }
    }
  
    // Hammer: маленькое тело, длинная нижняя тень
    isHammer(c) {
      const body = Math.abs(c.close - c.open)
      const lowerShadow = Math.min(c.open, c.close) - c.low
      const upperShadow = c.high - Math.max(c.open, c.close)
      const range = c.high - c.low
      
      return (
        lowerShadow > body * 2 &&
        upperShadow < body * 0.3 &&
        body < range * 0.3
      )
    }
  
    // Hanging Man: то же что Hammer, но на вершине тренда
    isHangingMan(c, prev) {
      return this.isHammer(c) && prev.close > prev.open
    }
  
    // Bullish Engulfing: текущая свеча поглощает предыдущую
    isBullishEngulfing(c, prev) {
      return (
        prev.close < prev.open && // prev bearish
        c.close > c.open && // current bullish
        c.open < prev.close &&
        c.close > prev.open
      )
    }
  
    // Bearish Engulfing
    isBearishEngulfing(c, prev) {
      return (
        prev.close > prev.open && // prev bullish
        c.close < c.open && // current bearish
        c.open > prev.close &&
        c.close < prev.open
      )
    }
  
    // Morning Star: 3 свечи (медвежья → маленькая → бычья)
    isMorningStar(c0, c1, c2) {
      const body0 = Math.abs(c0.close - c0.open)
      const body1 = Math.abs(c1.close - c1.open)
      const body2 = Math.abs(c2.close - c2.open)
      
      return (
        c2.close < c2.open && // bearish
        body1 < body2 * 0.3 && // small
        c0.close > c0.open && // bullish
        c0.close > (c2.open + c2.close) / 2
      )
    }
  
    // Evening Star
    isEveningStar(c0, c1, c2) {
      const body0 = Math.abs(c0.close - c0.open)
      const body1 = Math.abs(c1.close - c1.open)
      const body2 = Math.abs(c2.close - c2.open)
      
      return (
        c2.close > c2.open && // bullish
        body1 < body2 * 0.3 && // small
        c0.close < c0.open && // bearish
        c0.close < (c2.open + c2.close) / 2
      )
    }
  
    // Doji: open ≈ close
    isDoji(c) {
      const body = Math.abs(c.close - c.open)
      const range = c.high - c.low
      return body < range * 0.1
    }
  
    // Графические паттерны (упрощённо)
    recognizeChartPatterns(candles) {
      const patterns = []
      const closes = candles.slice(-50).map(c => parseFloat(c[4]))
      
      // Double Bottom (Двойное дно)
      if (this.isDoubleBottom(closes)) {
        patterns.push({
          name: 'Double Bottom',
          type: 'BULLISH_REVERSAL',
          strength: 8,
          description: 'Разворот вверх'
        })
      }
      
      // Double Top (Двойная вершина)
      if (this.isDoubleTop(closes)) {
        patterns.push({
          name: 'Double Top',
          type: 'BEARISH_REVERSAL',
          strength: 8,
          description: 'Разворот вниз'
        })
      }
      
      return patterns
    }
  
    isDoubleBottom(prices) {
      // Упрощённая логика: два минимума на примерно одном уровне
      const lows = []
      for (let i = 1; i < prices.length - 1; i++) {
        if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
          lows.push({ index: i, price: prices[i] })
        }
      }
      
      if (lows.length >= 2) {
        const diff = Math.abs(lows[0].price - lows[1].price) / lows[0].price
        return diff < 0.02 // 2% разница
      }
      return false
    }
  
    isDoubleTop(prices) {
      const highs = []
      for (let i = 1; i < prices.length - 1; i++) {
        if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
          highs.push({ index: i, price: prices[i] })
        }
      }
      
      if (highs.length >= 2) {
        const diff = Math.abs(highs[0].price - highs[1].price) / highs[0].price
        return diff < 0.02
      }
      return false
    }
  }