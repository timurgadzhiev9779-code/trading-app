import { BinanceAPI } from './binanceAPI'

export async function detectRegime(symbol, timeframe = '1h') {
  try {
    const binance = new BinanceAPI()
    
    // Получаем свечи
    const candles = await binance.getCandles(symbol, timeframe, 100)
    
    if (!candles || candles.length < 50) {
      return {
        regime: 'UNKNOWN',
        confidence: 0,
        description: 'Недостаточно данных'
      }
    }

    // Вычисляем индикаторы для определения режима
    const closes = candles.map(c => c.close)
    const highs = candles.map(c => c.high)
    const lows = candles.map(c => c.low)
    const volumes = candles.map(c => c.volume)

    // 1. Тренд (SMA 20 vs SMA 50)
    const sma20 = calculateSMA(closes, 20)
    const sma50 = calculateSMA(closes, 50)
    const currentPrice = closes[closes.length - 1]
    
    const trendUp = sma20 > sma50 && currentPrice > sma20
    const trendDown = sma20 < sma50 && currentPrice < sma20

    // 2. Волатильность (ATR)
    const atr = calculateATR(highs, lows, closes, 14)
    const avgPrice = closes.reduce((a, b) => a + b) / closes.length
    const volatilityPercent = (atr / avgPrice) * 100

    // 3. Объём
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b) / 5
    const volumeRatio = recentVolume / avgVolume

    // 4. Диапазон движения
    const priceRange = Math.max(...closes.slice(-20)) - Math.min(...closes.slice(-20))
    const rangePercent = (priceRange / avgPrice) * 100

    // 5. Направление (последние 20 свечей)
    const recentCloses = closes.slice(-20)
    const bullishCandles = recentCloses.filter((c, i) => i > 0 && c > recentCloses[i - 1]).length
    const bearishCandles = recentCloses.filter((c, i) => i > 0 && c < recentCloses[i - 1]).length

    // Определяем режим
    let regime = 'UNKNOWN'
    let confidence = 0
    let description = ''

    // СИЛЬНЫЙ БЫЧИЙ РЫНОК
    if (trendUp && bullishCandles > 14 && volumeRatio > 1.2) {
      regime = 'BULL_MARKET'
      confidence = 85
      description = 'Сильный восходящий тренд с высоким объёмом'
    }
    // СИЛЬНЫЙ МЕДВЕЖИЙ РЫНОК
    else if (trendDown && bearishCandles > 14 && volumeRatio > 1.2) {
      regime = 'BEAR_MARKET'
      confidence = 85
      description = 'Сильный нисходящий тренд с высоким объёмом'
    }
    // ВЫСОКАЯ ВОЛАТИЛЬНОСТЬ
    else if (volatilityPercent > 3 && volumeRatio > 1.5) {
      regime = 'HIGH_VOLATILITY'
      confidence = 80
      description = 'Высокая волатильность, резкие движения'
    }
    // БОКОВИК (RANGING)
    else if (rangePercent < 3 && Math.abs(bullishCandles - bearishCandles) < 5) {
      regime = 'RANGING'
      confidence = 75
      description = 'Боковое движение, флэт'
    }
    // НАКОПЛЕНИЕ (перед ростом)
    else if (!trendUp && !trendDown && volumeRatio < 0.8 && rangePercent < 3) {
      regime = 'ACCUMULATION'
      confidence = 70
      description = 'Фаза накопления, возможен рост'
    }
    // РАСПРЕДЕЛЕНИЕ (перед падением)
    else if (trendUp && volumeRatio < 0.7 && bearishCandles > bullishCandles) {
      regime = 'DISTRIBUTION'
      confidence = 70
      description = 'Фаза распределения, возможна коррекция'
    }
    // ПРОБОЙ
    else if (volumeRatio > 2 && rangePercent > 4) {
      regime = 'BREAKOUT'
      confidence = 75
      description = 'Пробой уровня с высоким объёмом'
    }
    // УМЕРЕННЫЙ ТРЕНД
    else if (trendUp) {
      regime = 'BULL_MARKET'
      confidence = 60
      description = 'Умеренный восходящий тренд'
    }
    else if (trendDown) {
      regime = 'BEAR_MARKET'
      confidence = 60
      description = 'Умеренный нисходящий тренд'
    }
    // НЕОПРЕДЕЛЁННОСТЬ
    else {
      regime = 'RANGING'
      confidence = 50
      description = 'Неопределённое состояние рынка'
    }

    return {
      regime,
      confidence,
      description,
      metrics: {
        volatilityPercent: volatilityPercent.toFixed(2),
        volumeRatio: volumeRatio.toFixed(2),
        rangePercent: rangePercent.toFixed(2),
        bullishCandles,
        bearishCandles,
        trendUp,
        trendDown
      },
      timestamp: Date.now()
    }
  } catch (err) {
    console.error('Regime detection error:', err)
    return {
      regime: 'UNKNOWN',
      confidence: 0,
      description: 'Ошибка анализа',
      timestamp: Date.now()
    }
  }
}

// Вспомогательные функции
function calculateSMA(data, period) {
  if (data.length < period) return 0
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b) / period
}

function calculateATR(highs, lows, closes, period) {
  const tr = []
  
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i]
    const hc = Math.abs(highs[i] - closes[i - 1])
    const lc = Math.abs(lows[i] - closes[i - 1])
    tr.push(Math.max(hl, hc, lc))
  }
  
  if (tr.length < period) return 0
  
  const slice = tr.slice(-period)
  return slice.reduce((a, b) => a + b) / period
}