/**
 * Бэктест система - тестирование на исторических данных
 */

import { calculateProfessionalConfidence } from '../utils/confidenceCalculator'
import { calculateSmartTargets } from '../utils/targetCalculator'

export class BacktestService {
  constructor() {
    this.binanceAPI = 'https://api.binance.com/api/v3'
  }

  /**
   * Загрузить исторические данные
   */
  async loadHistoricalData(symbol, days = 180) {
    const interval = '1d' // Дневные свечи
    const limit = days
    
    try {
      const response = await fetch(
        `${this.binanceAPI}/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
      )
      const data = await response.json()
      
      return data.map(candle => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }))
    } catch (err) {
      console.error('Ошибка загрузки данных:', err)
      return []
    }
  }

  /**
   * Рассчитать технические индикаторы для каждой свечи
   */
  calculateIndicators(candles) {
    const results = []
    
    for (let i = 50; i < candles.length; i++) {
      const slice = candles.slice(0, i + 1)
      const current = candles[i]
      
      // Рассчитываем SMA
      const sma20 = this.calculateSMA(slice.map(c => c.close), 20)
      const sma50 = this.calculateSMA(slice.map(c => c.close), 50)
      
      // Рассчитываем RSI
      const rsi = this.calculateRSI(slice.map(c => c.close), 14)
      
      // Рассчитываем объём
      const avgVolume = this.calculateSMA(slice.map(c => c.volume), 20)
      
      // Рассчитываем Fibonacci
      const high = Math.max(...slice.slice(-20).map(c => c.high))
      const low = Math.min(...slice.slice(-20).map(c => c.low))
      const fibonacci = this.calculateFibonacci(high, low)
      
      // Создаём объект анализа (упрощённый)
      const analysis = {
        current: {
          price: current.close,
          trend: {
            signal: sma20 > sma50 ? 'BULLISH' : 'BEARISH',
            strength: Math.abs(sma20 - sma50) > current.close * 0.02 ? 'STRONG' : 'WEAK'
          },
          trendStrength: {
            adx: sma20 > sma50 ? 28 : 15 // Упрощение
          },
          rsi: {
            value: rsi,
            signal: rsi < 30 ? 'OVERSOLD' : rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL'
          },
          volume: {
            current: current.volume,
            average: avgVolume,
            signal: current.volume > avgVolume * 1.2 ? 'HIGH' : 'LOW'
          },
          volatility: {
            atr: (high - low) * 0.02,
            level: 'NORMAL'
          },
          fibonacci,
          support: low,
          resistance: high,
          macd: { signal: sma20 > sma50 ? 'BULLISH' : 'BEARISH' },
          patterns: { all: [], score: 0 }
        }
      }
      
      results.push({
        candle: current,
        analysis,
        index: i
      })
    }
    
    return results
  }

  /**
   * Запустить бэктест
   */
  async runBacktest(symbol, mode = 'balanced', style = 'swing', days = 180) {
    console.log(`🔄 Запуск бэктеста: ${symbol}, режим ${mode}, стиль ${style}`)
    
    // Загружаем данные
    const candles = await this.loadHistoricalData(symbol, days)
    if (candles.length === 0) {
      return { error: 'Нет данных' }
    }
    
    // Рассчитываем индикаторы
    const dataPoints = this.calculateIndicators(candles)
    
    // Настройки режима
const thresholds = {
  conservative: 70,
  balanced: 60,
  aggressive: 50
}
const threshold = thresholds[mode] || 60

// Размер позиции (% от капитала)
const positionSizes = {
  conservative: 0.01,  // 1%
  balanced: 0.02,      // 2%
  aggressive: 0.03     // 3%
}
const positionSizePercent = positionSizes[mode] || 0.02

// Результаты
    const trades = []
    let balance = 10000 // Начальный капитал $10k
    let openTrade = null
    
    // Проходим по каждому дню
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i]
      
      // Если есть открытая сделка - проверяем TP/SL
      if (openTrade) {
        const currentPrice = point.candle.close
        
        // Проверяем стоп-лосс
if (currentPrice <= openTrade.sl) {
  const pnl = (openTrade.sl - openTrade.entry) * openTrade.size
  const closedValue = openTrade.sl * openTrade.size
  
  balance += closedValue
  
  trades.push({
    ...openTrade,
    exit: openTrade.sl,
    exitReason: 'SL',
    pnl,
    pnlPercent: ((openTrade.sl - openTrade.entry) / openTrade.entry) * 100,
    result: 'LOSS'
  })
  
  openTrade = null
  continue
}
        
        // Проверяем тейк-профиты
if (currentPrice >= openTrade.tp3) {
  const pnl = (openTrade.tp3 - openTrade.entry) * openTrade.size
  const closedValue = openTrade.tp3 * openTrade.size
  
  balance += closedValue
  
  trades.push({
    ...openTrade,
    exit: openTrade.tp3,
    exitReason: 'TP3',
    pnl,
    pnlPercent: ((openTrade.tp3 - openTrade.entry) / openTrade.entry) * 100,
    result: 'WIN'
  })
  
  openTrade = null
  continue
}
        
if (currentPrice >= openTrade.tp2) {
  const pnl = (openTrade.tp2 - openTrade.entry) * openTrade.size
  const closedValue = openTrade.tp2 * openTrade.size
  
  balance += closedValue
  
  trades.push({
    ...openTrade,
    exit: openTrade.tp2,
    exitReason: 'TP2',
    pnl,
    pnlPercent: ((openTrade.tp2 - openTrade.entry) / openTrade.entry) * 100,
    result: 'WIN'
  })
  
  openTrade = null
  continue
}
        
if (currentPrice >= openTrade.tp1) {
  const pnl = (openTrade.tp1 - openTrade.entry) * openTrade.size
  const closedValue = openTrade.tp1 * openTrade.size
  
  balance += closedValue
  
  trades.push({
    ...openTrade,
    exit: openTrade.tp1,
    exitReason: 'TP1',
    pnl,
    pnlPercent: ((openTrade.tp1 - openTrade.entry) / openTrade.entry) * 100,
    result: 'WIN'
  })
  
  openTrade = null
  continue
}
      }
      
      // Если нет открытой сделки - ищем сигнал
      if (!openTrade) {
        // Рассчитываем уверенность
        const confidenceData = calculateProfessionalConfidence(
          point.analysis,
          point.candle.close,
          mode
        )
        
        // Проверяем порог
        if (confidenceData.score >= threshold) {
          // Рассчитываем цели
          const targets = calculateSmartTargets(
            point.analysis,
            point.candle.close,
            style
          )
          
          // Рассчитываем размер позиции
const positionInUSDT = balance * positionSizePercent
const coinAmount = positionInUSDT / point.candle.close

// Проверяем хватает ли баланса
if (positionInUSDT > balance) {
  continue
}

// Открываем сделку
openTrade = {
  entry: point.candle.close,
  entryDate: new Date(point.candle.time),
  tp1: targets.tp1.price,
  tp2: targets.tp2.price,
  tp3: targets.tp3.price,
  sl: targets.sl.price,
  confidence: confidenceData.score,
  size: coinAmount,
  positionValue: positionInUSDT,
  mode,
  style
}

// Вычитаем из баланса
balance -= positionInUSDT
        }
      }
    }
    
    // Статистика
    const winTrades = trades.filter(t => t.result === 'WIN')
    const lossTrades = trades.filter(t => t.result === 'LOSS')
    
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
    const winRate = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0
    
    const maxDrawdown = this.calculateMaxDrawdown(trades)
    
    return {
      symbol,
      mode,
      style,
      days,
      startBalance: 10000,
      endBalance: balance,
      totalPnL,
      totalPnLPercent: (totalPnL / 10000) * 100,
      annualizedReturn: ((totalPnL / 10000) * (365 / days)) * 100,
      trades: trades.length,
      winTrades: winTrades.length,
      lossTrades: lossTrades.length,
      winRate: winRate.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      allTrades: trades
    }
  }

  // Вспомогательные функции
  calculateSMA(data, period) {
    if (data.length < period) return data[data.length - 1] || 0
    const slice = data.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
  }

  calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50
    
    let gains = 0
    let losses = 0
    
    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    
    const avgGain = gains / period
    const avgLoss = losses / period
    
    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  calculateFibonacci(high, low) {
    const diff = high - low
    return {
      high,
      low,
      fib236: low + diff * 0.236,
      fib382: low + diff * 0.382,
      fib500: low + diff * 0.500,
      fib618: low + diff * 0.618,
      fib786: low + diff * 0.786
    }
  }

  calculateMaxDrawdown(trades) {
    let peak = 10000
    let maxDD = 0
    let balance = 10000
    
    trades.forEach(trade => {
      balance += trade.pnl
      if (balance > peak) peak = balance
      const dd = ((peak - balance) / peak) * 100
      if (dd > maxDD) maxDD = dd
    })
    
    return maxDD
  }
}