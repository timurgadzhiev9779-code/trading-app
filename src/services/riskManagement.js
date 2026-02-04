export class RiskManager {
    constructor(portfolio, tradeHistory) {
      this.portfolio = portfolio
      this.history = tradeHistory
      this.maxPortfolioHeat = 0.10 // 10% максимум в риске
      this.maxDrawdown = 0.08 // 8% макс просадка
    }
  
    // Kelly Criterion для размера позиции
    calculateKellyCriterion() {
      if (this.history.length < 20) {
        return 0.02 // Если мало истории, консервативно 2%
      }
  
      const wins = this.history.filter(t => t.profit > 0)
      const losses = this.history.filter(t => t.profit < 0)
      
      if (wins.length === 0 || losses.length === 0) return 0.02
  
      const winRate = wins.length / this.history.length
      const avgWin = wins.reduce((sum, t) => sum + Math.abs(t.profit), 0) / wins.length
      const avgLoss = losses.reduce((sum, t) => sum + Math.abs(t.profit), 0) / losses.length
      
      // Kelly% = (WinRate * AvgWin - LossRate * AvgLoss) / AvgWin
      const kellyPercent = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin
      
      // Half-Kelly для безопасности
      const safeKelly = Math.max(0.01, Math.min(0.05, kellyPercent / 2))
      
      return safeKelly
    }
  
    // Динамический размер позиции
    calculatePositionSize(confidence, signal) {
      const kelly = this.calculateKellyCriterion()
      
      // Базовый размер от Kelly
      let positionSize = this.portfolio.available * kelly
      
      // Увеличиваем на высокой уверенности
      const confidenceMultiplier = confidence / 100
      positionSize *= (0.5 + confidenceMultiplier * 0.5) // 0.5x - 1.0x
      
      // Корректировка по волатильности
      if (signal.volatility && signal.volatility.level === 'HIGH') {
        positionSize *= 0.7 // Уменьшаем на высокой волатильности
      }
      
      // Корректировка по тренду
      if (signal.trend && signal.trend.strength === 'WEAK') {
        positionSize *= 0.8
      }
      
      // Минимум $10, максимум 5% от баланса
      positionSize = Math.max(10, Math.min(this.portfolio.available * 0.05, positionSize))
      
      return parseFloat(positionSize.toFixed(2))
    }
  
    // Проверка Portfolio Heat
    canOpenPosition(newPositionRisk, activePositions) {
      // Текущий риск = сумма всех (entry - SL) * amount
      const currentRisk = activePositions.reduce((sum, pos) => {
        const riskPerUnit = (pos.entry - pos.sl) / pos.entry
        return sum + (pos.amount * riskPerUnit)
      }, 0)
      
      const totalRisk = (currentRisk + newPositionRisk) / this.portfolio.balance
      
      if (totalRisk > this.maxPortfolioHeat) {
        return {
          allowed: false,
          reason: `Portfolio heat слишком высокий: ${(totalRisk * 100).toFixed(1)}% (макс ${this.maxPortfolioHeat * 100}%)`
        }
      }
      
      return { allowed: true }
    }
  
    // Проверка Drawdown
    checkDrawdown() {
      const peakBalance = Math.max(...this.history.map(t => t.balanceAfter || this.portfolio.balance))
      const currentDrawdown = (peakBalance - this.portfolio.balance) / peakBalance
      
      if (currentDrawdown > this.maxDrawdown) {
        return {
          stop: true,
          reason: `Достигнута максимальная просадка: ${(currentDrawdown * 100).toFixed(1)}%`,
          drawdown: currentDrawdown
        }
      }
      
      return { stop: false, drawdown: currentDrawdown }
    }
  
    // Корреляция между активными позициями
    checkCorrelation(activePositions, newPair) {
      // Упрощённая проверка: не открывать коррелированные пары
      const correlated = {
        'BTC/USDT': ['ETH/USDT'],
        'ETH/USDT': ['BTC/USDT'],
        'SOL/USDT': ['AVAX/USDT'],
        'AVAX/USDT': ['SOL/USDT']
      }
      
      const activePairs = activePositions.map(p => p.pair)
      const correlatedPairs = correlated[newPair] || []
      
      for (const pair of activePairs) {
        if (correlatedPairs.includes(pair)) {
          return {
            allowed: false,
            reason: `${newPair} коррелирует с открытой позицией ${pair}`
          }
        }
      }
      
      return { allowed: true }
    }
  
    // Profit taking strategy
    calculatePartialTakeProfitLevels(entry, tp) {
      return [
        { level: entry * 1.01, percentage: 25, label: '+1% (25%)' },
        { level: entry * 1.015, percentage: 25, label: '+1.5% (25%)' },
        { level: entry * 1.02, percentage: 30, label: '+2% (30%)' },
        { level: tp, percentage: 20, label: 'TP (20%)' }
      ]
    }
  
    // Trailing stop calculation
    calculateTrailingStop(entry, currentPrice, currentSL) {
      const profitPercent = ((currentPrice - entry) / entry) * 100
      
      if (profitPercent > 5) {
        // При +5% - SL на +2%
        return entry * 1.02
      } else if (profitPercent > 3) {
        // При +3% - SL на +1%
        return entry * 1.01
      } else if (profitPercent > 2) {
        // При +2% - SL на безубыток
        return entry * 1.005
      }
      
      return currentSL // Не двигаем
    }
  }