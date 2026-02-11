// Режимы работы AI трейдера
export const AI_MODES = {
    CONSERVATIVE: {
      id: 'conservative',
      name: 'Консервативный',
      emoji: '🛡️',
      description: 'Минимальный риск, только надёжные сигналы',
      color: '#10B981', // green
      
      settings: {
        minConfidence: 80,           // Минимум 80% уверенности
        positionSize: 0.01,          // 1% от капитала
        maxPositions: 2,             // Максимум 2 позиции одновременно
        riskPerTrade: 0.5,           // 0.5% риска на сделку
        
        // Обязательные условия
        requiredSignals: {
          trend: true,               // Обязательно подтверждение тренда
          ml: 75,                    // ML минимум 75%
          patterns: 2,               // Минимум 2 бычьих паттерна
          orderBook: 65,             // Покупатели >65%
          whales: 'BUYING'           // Киты покупают
        },
        
        // Разрешённые стратегии
        strategies: ['TREND_FOLLOWING'],
        
        // Разрешённые режимы рынка
        regimes: ['BULL_MARKET'],
        
        // Stop Loss / Take Profit
        stopLoss: 1.5,               // SL 1.5x от ATR
        takeProfit: 3.0,             // TP 3x от ATR
        trailingStop: true,
        
        // Частичное закрытие (% от позиции)
        partialTP: [0.5, 0.3, 0.2]   // 50% на TP1, 30% на TP2, 20% на TP3
      },
      
      expectedReturns: {
        monthly: '5-10%',
        winRate: '75-80%',
        maxDrawdown: '3-5%'
      }
    },
  
    BALANCED: {
      id: 'balanced',
      name: 'Сбалансированный',
      emoji: '⚖️',
      description: 'Оптимальное соотношение риска и прибыли',
      color: '#3B82F6', // blue
      
      settings: {
        minConfidence: 70,
        positionSize: 0.02,          // 2% от капитала
        maxPositions: 3,
        riskPerTrade: 1.0,           // 1% риска
        
        requiredSignals: {
          trend: true,
          ml: 65,
          patterns: 1,
          orderBook: 55,
          whales: null                // Не обязательно
        },
        
        strategies: [
          'TREND_FOLLOWING',
          'MOMENTUM'                  // + Импульсная стратегия
        ],
        
        regimes: [
          'BULL_MARKET',
          'ACCUMULATION',
          'BREAKOUT'
        ],
        
        stopLoss: 2.0,
        takeProfit: 4.0,
        trailingStop: true,
        partialTP: [0.4, 0.3, 0.3]
      },
      
      expectedReturns: {
        monthly: '12-18%',
        winRate: '65-75%',
        maxDrawdown: '5-8%'
      }
    },
  
    AGGRESSIVE: {
      id: 'aggressive',
      name: 'Агрессивный',
      emoji: '🚀',
      description: 'Максимальная прибыль, повышенный риск',
      color: '#EF4444', // red
      
      settings: {
        minConfidence: 60,
        positionSize: 0.03,          // 3% от капитала
        maxPositions: 5,
        riskPerTrade: 2.0,           // 2% риска
        
        requiredSignals: {
          trend: false,              // Не обязательно
          ml: 55,
          patterns: 0,
          orderBook: 50,
          whales: null
        },
        
        strategies: [
          'TREND_FOLLOWING',
          'MOMENTUM',
          'MEAN_REVERSION',           // + Реверсная стратегия
          'BREAKOUT'
        ],
        
        regimes: [
          'BULL_MARKET',
          'ACCUMULATION',
          'BREAKOUT',
          'HIGH_VOLATILITY',          // + Высокая волатильность
          'RANGING'                   // + Боковик
        ],
        
        stopLoss: 2.5,
        takeProfit: 5.0,
        trailingStop: true,
        partialTP: [0.3, 0.3, 0.4]    // Держим дольше
      },
      
      expectedReturns: {
        monthly: '20-30%',
        winRate: '55-65%',
        maxDrawdown: '10-15%'
      }
    }
  }
  
  // Получить режим по ID
  export function getMode(modeId) {
    return AI_MODES[modeId.toUpperCase()] || AI_MODES.BALANCED
  }
  
  // Получить список всех режимов
  export function getAllModes() {
    return Object.values(AI_MODES)
  }
  
  // Проверить сигнал на соответствие режиму
  export function validateSignal(signal, mode) {
    const settings = mode.settings
    
    // Проверяем уверенность
    if (signal.confidence < settings.minConfidence) {
      return { valid: false, reason: `Уверенность ${signal.confidence}% < ${settings.minConfidence}%` }
    }
    
    // Проверяем режим рынка
    if (!settings.regimes.includes(signal.regime)) {
      return { valid: false, reason: `Режим рынка ${signal.regime} не разрешён` }
    }
    
    // Проверяем обязательные сигналы
    const required = settings.requiredSignals
    
    if (required.trend && !signal.trendConfirmed) {
      return { valid: false, reason: 'Тренд не подтверждён' }
    }
    
    if (required.ml && signal.mlConfidence < required.ml) {
      return { valid: false, reason: `ML ${signal.mlConfidence}% < ${required.ml}%` }
    }
    
    if (required.patterns && signal.patternsCount < required.patterns) {
      return { valid: false, reason: `Паттернов ${signal.patternsCount} < ${required.patterns}` }
    }
    
    if (required.orderBook && signal.buyPressure < required.orderBook) {
      return { valid: false, reason: `Order Book ${signal.buyPressure}% < ${required.orderBook}%` }
    }
    
    if (required.whales && signal.whaleActivity !== required.whales) {
      return { valid: false, reason: `Киты: ${signal.whaleActivity} != ${required.whales}` }
    }
    
    return { valid: true, reason: 'Все условия выполнены' }
  }
  
  // Выбрать стратегию на основе анализа и режима
  export function selectStrategy(analysis, mode) {
    const regime = analysis.regime
    const volatility = analysis.volatility
    const settings = mode.settings
    
    // СИЛЬНЫЙ ТРЕНД → Импульсная стратегия
    if (regime === 'BULL_MARKET' && analysis.trendStrength > 25) {
      if (settings.strategies.includes('MOMENTUM')) {
        return {
          strategy: 'MOMENTUM',
          entry: 'Пробой уровня + объём',
          tpMultiplier: 4.0,
          slMultiplier: 2.0,
          confidenceBonus: 10
        }
      }
    }
    
    // БОКОВИК → Реверсная стратегия
    if (regime === 'RANGING' && volatility === 'LOW') {
      if (settings.strategies.includes('MEAN_REVERSION')) {
        return {
          strategy: 'MEAN_REVERSION',
          entry: 'RSI экстремум + Bollinger',
          tpMultiplier: 2.0,
          slMultiplier: 1.0,
          confidenceBonus: -5
        }
      }
    }
    
    // НАКОПЛЕНИЕ → Раннее открытие
    if (regime === 'ACCUMULATION') {
      return {
        strategy: 'EARLY_ENTRY',
        entry: 'Киты накапливают',
        tpMultiplier: 5.0,
        slMultiplier: 2.0,
        confidenceBonus: 5
      }
    }
    
    // ВЫСОКАЯ ВОЛАТИЛЬНОСТЬ
    if (regime === 'HIGH_VOLATILITY') {
      if (mode.id === 'aggressive' && settings.strategies.includes('BREAKOUT')) {
        return {
          strategy: 'VOLATILITY_BREAKOUT',
          entry: 'Пробой с объёмом',
          tpMultiplier: 6.0,
          slMultiplier: 3.0,
          confidenceBonus: -10
        }
      } else {
        return {
          strategy: 'SKIP',
          reason: 'Слишком рискованно для текущего режима'
        }
      }
    }
    
    // ПО УМОЛЧАНИЮ → Трендовая
    return {
      strategy: 'TREND_FOLLOWING',
      entry: 'Подтверждение тренда',
      tpMultiplier: settings.takeProfit / settings.stopLoss,
      slMultiplier: 1.0,
      confidenceBonus: 0
    }
  }
  
  // Адаптивный размер позиции
  export function calculatePositionSize(portfolio, analysis, mode, recentPerformance) {
    let baseSize = portfolio.available * mode.settings.positionSize
    let multiplier = 1.0
    
    // 1. По уверенности
    if (analysis.confidence > 85) multiplier *= 1.3
    else if (analysis.confidence < 65) multiplier *= 0.7
    
    // 2. По винрейту (последние 10 сделок)
    if (recentPerformance.winRate > 0.8) multiplier *= 1.4
    else if (recentPerformance.winRate < 0.5) multiplier *= 0.5
    
    // 3. По просадке
    if (recentPerformance.drawdown > 5) multiplier *= 0.5
    else if (recentPerformance.drawdown < 2) multiplier *= 1.2
    
    // 4. По режиму рынка
    if (analysis.regime === 'HIGH_VOLATILITY') multiplier *= 0.6
    else if (analysis.regime === 'BULL_MARKET') multiplier *= 1.3
    
    // 5. По корреляции с BTC (для альткоинов)
    if (analysis.btcCorrelation > 0.9 && analysis.btcTrend === 'BULLISH') {
      multiplier *= 1.2
    }
    
    const finalSize = baseSize * multiplier
    
    // Лимиты: минимум $10, максимум 25% портфеля
    return Math.max(10, Math.min(finalSize, portfolio.available * 0.25))
  }