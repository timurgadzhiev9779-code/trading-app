import { TechnicalAnalyzer } from './technicalAnalysis'
import { AdvancedAnalyzer } from './advancedAnalysis'

export class Backtester {
  constructor() {
    this.technicalAnalyzer = new TechnicalAnalyzer()
    this.advancedAnalyzer = new AdvancedAnalyzer()
  }

  async runBacktest(symbol, days = 30) {
    console.log(`🔄 Backtesting ${symbol} за ${days} дней...`)
    
    try {
      // Получаем исторические данные
      const interval = '1h'
      const limit = days * 24
      const candles = await this.getHistoricalCandles(symbol, interval, limit)
      
      const trades = []
      let balance = 10000
      let position = null
      
      // Симулируем торговлю
      for (let i = 100; i < candles.length; i++) {
        const currentCandle = candles[i]
        const price = parseFloat(currentCandle[4]) // Close price
        
        // Если есть позиция - проверяем TP/SL
        if (position) {
          if (price >= position.tp) {
            // Take Profit
            const profit = ((price - position.entry) / position.entry) * position.amount
            balance += position.amount + profit
            trades.push({ ...position, exit: price, profit, result: 'WIN', exitTime: currentCandle[0] })
            position = null
            continue
          }
          
          if (price <= position.sl) {
            // Stop Loss
            const loss = ((price - position.entry) / position.entry) * position.amount
            balance += position.amount + loss
            trades.push({ ...position, exit: price, profit: loss, result: 'LOSS', exitTime: currentCandle[0] })
            position = null
            continue
          }
        }
        
        // Если нет позиции - ищем сигнал
        if (!position && balance > 100) {
          const analysis = await this.analyzePoint(candles.slice(0, i + 1), symbol)
          
          if (analysis && analysis.shouldEnter) {
            const amount = balance * 0.02 // 2% от баланса
            position = {
              pair: `${symbol}/USDT`,
              entry: price,
              tp: price * 1.03,
              sl: price * 0.98,
              amount: amount,
              entryTime: currentCandle[0],
              confidence: analysis.confidence
            }
          }
        }
      }
      
      // Закрываем открытую позицию по последней цене
      if (position) {
        const lastPrice = parseFloat(candles[candles.length - 1][4])
        const profit = ((lastPrice - position.entry) / position.entry) * position.amount
        balance += position.amount + profit
        trades.push({ 
          ...position, 
          exit: lastPrice, 
          profit, 
          result: profit > 0 ? 'WIN' : 'LOSS',
          exitTime: candles[candles.length - 1][0]
        })
      }
      
      // Статистика
      const wins = trades.filter(t => t.result === 'WIN').length
      const losses = trades.filter(t => t.result === 'LOSS').length
      const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0)
      
      return {
        symbol,
        days,
        initialBalance: 10000,
        finalBalance: balance,
        profit: totalProfit,
        profitPercent: ((balance - 10000) / 10000) * 100,
        trades: trades.length,
        wins,
        losses,
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        tradeList: trades
      }
    } catch (err) {
      console.error('Backtest error:', err)
      return null
    }
  }

  async getHistoricalCandles(symbol, interval, limit) {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
    )
    return await res.json()
  }

  async analyzePoint(candles, symbol) {
    // Упрощённый анализ (используем только технические)
    try {
      const closes = candles.map(c => parseFloat(c[4]))
      const highs = candles.map(c => parseFloat(c[2]))
      const lows = candles.map(c => parseFloat(c[3]))
      
      if (closes.length < 50) return null
      
      // Базовая проверка тренда
      const ema20 = closes.slice(-20).reduce((a, b) => a + b) / 20
      const ema50 = closes.slice(-50).reduce((a, b) => a + b) / 50
      const trend = ema20 > ema50
      
      // Простая волатильность
      const recentVolatility = closes.slice(-10).reduce((sum, c, i, arr) => {
        if (i === 0) return sum
        return sum + Math.abs((c - arr[i-1]) / arr[i-1])
      }, 0) / 10
      
      const shouldEnter = trend && recentVolatility > 0.005 && recentVolatility < 0.05
      
      return {
        shouldEnter,
        confidence: shouldEnter ? 75 : 50
      }
    } catch (err) {
      return null
    }
  }
}