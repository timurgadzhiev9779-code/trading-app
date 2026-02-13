/**
 * Профессиональный расчёт уверенности
 * 30% Контекст + 50% Подтверждение + 20% Фильтры
 */

export function calculateProfessionalConfidence(analysis, currentPrice, mode = 'balanced') {
  let score = 0

  // Настройки для разных режимов
const modeSettings = {
  conservative: {
    baseLine: 0
  },
  balanced: {
    baseLine: 10
  },
  aggressive: {
    baseLine: 20
  }
}

const settings = modeSettings[mode] || modeSettings.balanced
score += settings.baseLine
  
  const breakdown = {
      context: 0,
      confirmation: 0,
      filters: 0,
      details: {}
    }
  
    // ============================================
    // УРОВЕНЬ 1: КОНТЕКСТ (30 баллов)
    // ============================================
  
    // 1.1 Структура рынка (15 баллов)
    const marketStructure = analyzeMarketStructure(analysis)
    breakdown.context += marketStructure.score
    breakdown.details.structure = marketStructure
  
    // 1.2 Multi-Timeframe Alignment (15 баллов)
    const multiTF = analyzeMultiTimeframe(analysis)
    breakdown.context += multiTF.score
    breakdown.details.multiTF = multiTF
  
    // ============================================
    // УРОВЕНЬ 2: ПОДТВЕРЖДЕНИЕ (50 баллов)
    // ============================================
  
    // 2.1 Отбой от уровня (25 баллов)
    const priceAction = analyzePriceAction(analysis, currentPrice)
    breakdown.confirmation += priceAction.score
    breakdown.details.priceAction = priceAction
  
    // 2.2 Объём (20 баллов)
    const volume = analyzeVolume(analysis)
    breakdown.confirmation += volume.score
    breakdown.details.volume = volume
  
    // 2.3 Свечной паттерн (5 баллов)
    const candle = analyzeCandlePattern(analysis)
    breakdown.confirmation += candle.score
    breakdown.details.candle = candle
  
    // ============================================
    // УРОВЕНЬ 3: ФИЛЬТРЫ (20 баллов)
    // ============================================
  
    // 3.1 RSI и дивергенции (10 баллов)
    const rsi = analyzeRSI(analysis)
    breakdown.filters += rsi.score
    breakdown.details.rsi = rsi
  
    // 3.2 Ликвидность зоны (10 баллов)
    const liquidity = analyzeLiquidity(analysis, currentPrice)
    breakdown.filters += liquidity.score
    breakdown.details.liquidity = liquidity
  
    // ============================================
    // ИТОГОВЫЙ СЧЁТ
    // ============================================
  
    score += breakdown.context + breakdown.confirmation + breakdown.filters
  
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      breakdown,
      recommendation: getRecommendation(score),
      confidence: Math.round(score) // Для обратной совместимости
    }
  }
  
  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ АНАЛИЗА
  // ============================================
  
  function analyzeMarketStructure(analysis) {
    // Анализируем Higher Highs / Higher Lows (бычья структура)
    // или Lower Highs / Lower Lows (медвежья структура)
    
    const trend = analysis.current.trend
    const trendStrength = analysis.current.trendStrength?.adx || 0
    
    let score = 0
    let status = 'NEUTRAL'
    
    if (trend.signal === 'BULLISH' && trendStrength > 25) {
      score = 15
      status = 'BULLISH_HH_HL'
    } else if (trend.signal === 'BEARISH' && trendStrength > 25) {
      score = -15
      status = 'BEARISH_LH_LL'
    } else if (trend.signal === 'BULLISH') {
      score = 8
      status = 'WEAK_BULLISH'
    } else if (trend.signal === 'BEARISH') {
      score = -8
      status = 'WEAK_BEARISH'
    }
    
    return {
      score,
      status,
      strength: trend.strength,
      adx: trendStrength
    }
  }
  
  function analyzeMultiTimeframe(analysis) {
    // Проверяем совпадают ли тренды на разных таймфреймах
    
    if (!analysis['1h'] || !analysis['4h'] || !analysis.current) {
      return { score: 0, status: 'NO_DATA', aligned: false }
    }
    
    const tf1h = analysis['1h'].trend.signal
    const tf4h = analysis['4h'].trend.signal
    const tfDaily = analysis.current.trend.signal
    
    // Все 3 таймфрейма совпадают
    if (tf1h === tf4h && tf4h === tfDaily) {
      return {
        score: 15,
        status: 'FULLY_ALIGNED',
        aligned: true,
        direction: tfDaily
      }
    }
    
    // 2 из 3 совпадают
    if (tf1h === tfDaily || tf4h === tfDaily) {
      return {
        score: 7,
        status: 'PARTIALLY_ALIGNED',
        aligned: false,
        direction: tfDaily
      }
    }
    
    // Против тренда (1H против Daily)
    if (tf1h !== tfDaily) {
      return {
        score: -15,
        status: 'COUNTER_TREND',
        aligned: false,
        direction: tfDaily
      }
    }
    
    return { score: 0, status: 'MIXED', aligned: false }
  }
  
  function analyzePriceAction(analysis, currentPrice) {
    // Анализируем силу отбоя от уровня
    
    let support = analysis.current.support || 0
    let resistance = analysis.current.resistance || 0
    const fibonacci = analysis.current.fibonacci
    
    // Убедимся что это числа
    if (typeof support === 'object') support = support.price || 0
    if (typeof resistance === 'object') resistance = resistance.price || 0
    
    let score = 0
    let status = 'NO_BOUNCE'
    let level = null
    
    // Проверяем отбой от поддержки (для лонга)
    if (typeof support === 'number' && support > 0) {
      const distanceFromSupport = ((currentPrice - support) / support) * 100
      
      if (distanceFromSupport >= 0 && distanceFromSupport <= 2) {
        score = 25
        status = 'STRONG_BOUNCE'
        level = `Support $${support.toFixed(2)}`
      } else if (distanceFromSupport > 2 && distanceFromSupport <= 5) {
        score = 15
        status = 'MEDIUM_BOUNCE'
        level = `Support $${support.toFixed(2)}`
      } else if (distanceFromSupport > 5 && distanceFromSupport <= 10) {
        score = 5
        status = 'WEAK_BOUNCE'
        level = `Support $${support.toFixed(2)}`
      }
    }
    
    // Проверяем Fibonacci уровни
    if (fibonacci && score < 15) {
      const fibLevels = [
        { value: fibonacci.fib236, name: 'Fib 23.6%', strength: 6 },
        { value: fibonacci.fib382, name: 'Fib 38.2%', strength: 7 },
        { value: fibonacci.fib500, name: 'Fib 50%', strength: 8 },
        { value: fibonacci.fib618, name: 'Fib 61.8%', strength: 10 }
      ]
      
      for (const fib of fibLevels) {
        if (fib.value > 0) {
          const distance = Math.abs(((currentPrice - fib.value) / fib.value) * 100)
          if (distance <= 1) {
            score = Math.max(score, fib.strength * 2.5)
            status = 'FIBONACCI_BOUNCE'
            level = fib.name
            break
          }
        }
      }
    }
    
    return { score, status, level }
  }
  
  function analyzeVolume(analysis) {
    const volumeData = analysis.current.volume
    
    if (!volumeData) {
      return { score: 0, status: 'NO_DATA' }
    }
    
    const signal = volumeData.signal
    const avgVolume = volumeData.average || 1
    const currentVolume = volumeData.current || 0
    const ratio = currentVolume / avgVolume
    
    let score = 0
    let status = 'LOW'
    
    if (ratio > 1.5) {
      score = 20
      status = 'VERY_HIGH'
    } else if (ratio > 1.2) {
      score = 15
      status = 'HIGH'
    } else if (ratio >= 1.0) {
      score = 10
      status = 'NORMAL'
    } else if (ratio < 0.7) {
      score = -15
      status = 'VERY_LOW'
    }
    
    return {
      score,
      status,
      ratio: ratio.toFixed(2),
      signal
    }
  }
  
  function analyzeCandlePattern(analysis) {
    const patterns = analysis.current.patterns
    
    if (!patterns || !patterns.all || patterns.all.length === 0) {
      return { score: 0, status: 'NO_PATTERN' }
    }
    
    // Считаем бычьие и медвежьи паттерны
    const bullish = patterns.all.filter(p => 
      p.type.includes('BULLISH')
    )
    const bearish = patterns.all.filter(p => 
      p.type.includes('BEARISH')
    )
    
    let score = 0
    let status = 'NEUTRAL'
    
    if (bullish.length > bearish.length) {
      score = Math.min(5, bullish.length * 2)
      status = 'BULLISH_PATTERN'
    } else if (bearish.length > bullish.length) {
      score = Math.max(-5, -bearish.length * 2)
      status = 'BEARISH_PATTERN'
    }
    
    return {
      score,
      status,
      bullish: bullish.length,
      bearish: bearish.length,
      totalScore: patterns.score
    }
  }
  
  function analyzeRSI(analysis) {
    const rsi = analysis.current.rsi
    
    if (!rsi || rsi.value === undefined || rsi.value === null) {
      return { score: 0, status: 'NO_DATA', value: '0' }
    }
    
    const value = typeof rsi.value === 'number' ? rsi.value : parseFloat(rsi.value) || 0
    let score = 0
    let status = 'NEUTRAL'
    
    // RSI в перепроданности
    if (value < 30) {
      score = 5
      status = 'OVERSOLD'
    }
    // RSI вышел из перепроданности (30-40)
    else if (value >= 30 && value <= 40) {
      score = 10
      status = 'EXITING_OVERSOLD'
    }
    // RSI в нормальной зоне (40-70)
    else if (value > 40 && value < 70) {
      score = 5
      status = 'NORMAL'
    }
    // RSI в перекупленности
    else if (value >= 80) {
      score = -10
      status = 'OVERBOUGHT'
    }
    
    // TODO: Добавить проверку дивергенций когда будет доступна
    
    return {
      score,
      status,
      value: value.toFixed(2)
    }
  }
  
  function analyzeLiquidity(analysis, currentPrice) {
    // Анализируем есть ли рядом зоны ликвидности (стопы других трейдеров)
    
    const support = analysis.current.support || 0
    const resistance = analysis.current.resistance || 0
    
    let score = 0
    let status = 'NO_LIQUIDITY'
    let zones = []
    
    // Поддержка ниже = зона стопов шортистов
    if (support > 0) {
      const distance = ((currentPrice - support) / currentPrice) * 100
      if (distance > 0 && distance < 5) {
        score += 5
        zones.push(`Support at ${distance.toFixed(1)}% below`)
      }
    }
    
    // Сопротивление выше = зона стопов лонгистов
    if (resistance > 0) {
      const distance = ((resistance - currentPrice) / currentPrice) * 100
      if (distance > 0 && distance < 5) {
        score += 5
        zones.push(`Resistance at ${distance.toFixed(1)}% above`)
      }
    }
    
    if (zones.length > 0) {
      status = 'LIQUIDITY_ZONES_NEARBY'
    }
    
    return {
      score,
      status,
      zones
    }
  }
  
  function getRecommendation(score) {
    if (score >= 70) {
      return { text: 'ПОКУПКА', color: 'text-green-500', emoji: '🟢' }
    }
    if (score >= 60) {
      return { text: 'ОСТОРОЖНАЯ ПОКУПКА', color: 'text-yellow-500', emoji: '🟡' }
    }
    if (score >= 40) {
      return { text: 'ЖДАТЬ', color: 'text-gray-400', emoji: '⚪' }
    }
    if (score >= 25) {
      return { text: 'ОСТОРОЖНАЯ ПРОДАЖА', color: 'text-orange-500', emoji: '🟠' }
    }
    return { text: 'ПРОДАЖА', color: 'text-red-500', emoji: '🔴' }
  }
  
  // Получить результат для конкретного стиля торговли
  export function getStyleResult(confidence, style) {
    const thresholds = {
      scalping: 50,
      daytrading: 60,
      swing: 70
    }
    
    const threshold = thresholds[style] || 70
    const suitable = confidence >= threshold
    
    let positionSize = '0%'
    if (confidence >= threshold + 8) {
      positionSize = '100%'
    } else if (confidence >= threshold) {
      positionSize = '70%'
    } else if (confidence >= threshold - 10) {
      positionSize = '50%'
    }
    
    return {
      threshold,
      suitable,
      positionSize,
      status: suitable ? 'ПОДХОДИТ' : 'НЕ ПОДХОДИТ',
      recommendation: suitable ? 
        { text: 'ПОКУПКА', color: 'text-green-500', emoji: '🟢' } :
        { text: 'ЖДАТЬ', color: 'text-gray-400', emoji: '⚪' }
    }
  }