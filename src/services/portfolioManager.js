export class PortfolioManager {
    constructor() {
      this.maxPositions = 5 // Максимум 5 позиций одновременно
      this.maxCorrelation = 0.7 // Макс корреляция между активами
      this.sectorLimits = {
        'Layer1': 0.4, // Max 40% в Layer1 (BTC, ETH, SOL)
        'DeFi': 0.3,   // Max 30% в DeFi (UNI, AAVE, LINK)
        'Meme': 0.2,   // Max 20% в Meme
        'Other': 0.3
      }
    }
  
    // Классификация монет по секторам
    getSector(symbol) {
      const sectors = {
        'Layer1': ['BTC', 'ETH', 'SOL', 'AVAX', 'DOT', 'ATOM'],
        'DeFi': ['UNI', 'AAVE', 'LINK', 'CRV', 'MKR'],
        'Meme': ['DOGE', 'SHIB', 'PEPE'],
        'Other': ['MATIC', 'OP', 'ARB']
      }
      
      for (const sector in sectors) {
        if (sectors[sector].includes(symbol)) return sector
      }
      return 'Other'
    }
  
    // Проверка лимитов по секторам
    checkSectorLimits(newSymbol, newAmount, activePositions, totalCapital) {
      const newSector = this.getSector(newSymbol.replace('/USDT', ''))
      
      // Считаем текущее распределение
      const sectorExposure = {}
      activePositions.forEach(pos => {
        const sector = this.getSector(pos.pair.replace('/USDT', ''))
        sectorExposure[sector] = (sectorExposure[sector] || 0) + pos.amount
      })
      
      // Добавляем новую позицию
      sectorExposure[newSector] = (sectorExposure[newSector] || 0) + newAmount
      
      // Проверяем лимиты
      for (const sector in sectorExposure) {
        const exposure = sectorExposure[sector] / totalCapital
        const limit = this.sectorLimits[sector] || 0.3
        
        if (exposure > limit) {
          return {
            allowed: false,
            reason: `Превышен лимит сектора ${sector}: ${(exposure * 100).toFixed(1)}% (макс ${limit * 100}%)`
          }
        }
      }
      
      return { allowed: true }
    }
  
    // Корреляционная матрица (упрощённо)
    getCorrelationMatrix() {
      return {
        'BTC': { 'ETH': 0.85, 'SOL': 0.75, 'AVAX': 0.70, 'LINK': 0.65, 'UNI': 0.60 },
        'ETH': { 'BTC': 0.85, 'SOL': 0.80, 'AVAX': 0.75, 'LINK': 0.70, 'UNI': 0.65 },
        'SOL': { 'BTC': 0.75, 'ETH': 0.80, 'AVAX': 0.70, 'LINK': 0.60, 'UNI': 0.55 },
        'AVAX': { 'BTC': 0.70, 'ETH': 0.75, 'SOL': 0.70, 'LINK': 0.55, 'UNI': 0.50 },
        'LINK': { 'BTC': 0.65, 'ETH': 0.70, 'SOL': 0.60, 'AVAX': 0.55, 'UNI': 0.60 },
        'UNI': { 'BTC': 0.60, 'ETH': 0.65, 'SOL': 0.55, 'AVAX': 0.50, 'LINK': 0.60 }
      }
    }
  
    // Проверка корреляции с активными позициями
    checkCorrelation(newSymbol, activePositions) {
      const newCoin = newSymbol.replace('/USDT', '')
      const correlations = this.getCorrelationMatrix()[newCoin] || {}
      
      for (const pos of activePositions) {
        const activeCoin = pos.pair.replace('/USDT', '')
        const correlation = correlations[activeCoin] || 0
        
        if (correlation > this.maxCorrelation) {
          return {
            allowed: false,
            reason: `Высокая корреляция с ${activeCoin}: ${(correlation * 100).toFixed(0)}%`,
            correlation
          }
        }
      }
      
      return { allowed: true }
    }
  
    // Оптимальное распределение капитала (Kelly + диверсификация)
    calculateOptimalAllocation(signals, portfolio, activePositions) {
      // Сортируем сигналы по уверенности
      const sorted = [...signals].sort((a, b) => b.confidence - a.confidence)
      
      const allocations = []
      let remainingCapital = portfolio.available
      
      for (const signal of sorted) {
        // Базовый размер от Kelly
        let baseSize = remainingCapital * 0.15 // Консервативно 15%
        
        // Корректировка по уверенности
        const confidenceMultiplier = signal.confidence / 100
        baseSize *= confidenceMultiplier
        
        // Корректировка по стратегии
        baseSize *= signal.strategy?.sizeMultiplier || 1.0
        
        // Проверка лимитов
        const sectorCheck = this.checkSectorLimits(
          signal.pair,
          baseSize,
          activePositions,
          portfolio.balance
        )
        
        if (!sectorCheck.allowed) {
          console.log(`⚠️ ${signal.pair}: ${sectorCheck.reason}`)
          continue
        }
        
        const correlationCheck = this.checkCorrelation(signal.pair, activePositions)
        if (!correlationCheck.allowed) {
          console.log(`⚠️ ${signal.pair}: ${correlationCheck.reason}`)
          continue
        }
        
        // Максимум 5 позиций
        if (activePositions.length + allocations.length >= this.maxPositions) {
          console.log(`⚠️ Достигнут лимит позиций (${this.maxPositions})`)
          break
        }
        
        allocations.push({
          pair: signal.pair,
          size: Math.min(baseSize, remainingCapital * 0.25), // Не больше 25% на одну
          confidence: signal.confidence,
          strategy: signal.strategy?.strategy
        })
        
        remainingCapital -= allocations[allocations.length - 1].size
      }
      
      return allocations
    }
  
    // Ребалансировка портфеля
    rebalancePortfolio(activePositions, portfolio) {
      const totalExposure = activePositions.reduce((sum, p) => sum + p.amount, 0)
      const exposurePercent = totalExposure / portfolio.balance
      
      console.log(`💼 Портфель: ${activePositions.length} позиций, ${(exposurePercent * 100).toFixed(1)}% в рынке`)
      
      // Если слишком много в рынке (>80%) - предупреждаем
      if (exposurePercent > 0.8) {
        return {
          action: 'REDUCE',
          message: 'Слишком много капитала в позициях. Рассмотрите частичное закрытие.'
        }
      }
      
      // Если слишком мало (<20%) - можем входить агрессивнее
      if (exposurePercent < 0.2) {
        return {
          action: 'INCREASE',
          message: 'Мало капитала используется. Можно искать больше возможностей.'
        }
      }
      
      return { action: 'HOLD', message: 'Распределение оптимально' }
    }
  
    // Profit compounding - реинвест прибыли
    calculateCompoundingSize(baseSize, profitPercent) {
      // Если прибыльны - увеличиваем размер
      if (profitPercent > 5) {
        return baseSize * 1.2 // +20%
      } else if (profitPercent > 10) {
        return baseSize * 1.4 // +40%
      }
      
      // Если в убытке - уменьшаем
      if (profitPercent < -3) {
        return baseSize * 0.8 // -20%
      }
      
      return baseSize
    }
  
    // Анализ производительности портфеля
    analyzePerformance(positions, history) {
      const totalPnL = history.reduce((sum, t) => sum + parseFloat(t.profit), 0)
      const wins = history.filter(t => t.profit > 0)
      const losses = history.filter(t => t.profit < 0)
      
      const winRate = wins.length / history.length
      const avgWin = wins.reduce((sum, t) => sum + t.profit, 0) / wins.length
      const avgLoss = losses.reduce((sum, t) => sum + Math.abs(t.profit), 0) / losses.length
      
      const profitFactor = (wins.reduce((sum, t) => sum + t.profit, 0)) / 
                           (losses.reduce((sum, t) => sum + Math.abs(t.profit), 0))
      
      // Sharpe ratio (упрощённо)
      const returns = history.map(t => t.profitPercent)
      const avgReturn = returns.reduce((a, b) => a + b) / returns.length
      const stdDev = Math.sqrt(
        returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b) / returns.length
      )
      const sharpe = avgReturn / (stdDev + 0.001)
      
      return {
        totalPnL,
        winRate: (winRate * 100).toFixed(1),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        sharpeRatio: sharpe.toFixed(2),
        grade: sharpe > 1.5 ? 'A' : sharpe > 1.0 ? 'B' : sharpe > 0.5 ? 'C' : 'D'
      }
    }
  }