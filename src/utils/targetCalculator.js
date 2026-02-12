/**
 * Умный расчёт целей для разных стилей торговли
 * Комбинирует Fibonacci + Support/Resistance + ATR
 */

export function calculateSmartTargets(analysis, currentPrice, style = 'swing') {
    const {
      volatility,
      fibonacci,
      support,
      resistance
    } = analysis.current
  
    const atr = volatility?.atr || (currentPrice * 0.02) // 2% как fallback
  
    // Определяем диапазоны для каждого стиля
    const ranges = getStyleRanges(style)
  
    // Собираем все потенциальные уровни
    const potentialTargets = []
    const potentialStops = []
  
    // ============================================
    // 1. ATR-BASED TARGETS (базовые)
    // ============================================
    
    potentialTargets.push({
      price: currentPrice + (atr * ranges.atrMultipliers.tp1),
      source: `ATR ${ranges.atrMultipliers.tp1}x`,
      strength: 5
    })
    potentialTargets.push({
      price: currentPrice + (atr * ranges.atrMultipliers.tp2),
      source: `ATR ${ranges.atrMultipliers.tp2}x`,
      strength: 7
    })
    potentialTargets.push({
      price: currentPrice + (atr * ranges.atrMultipliers.tp3),
      source: `ATR ${ranges.atrMultipliers.tp3}x`,
      strength: 6
    })
  
    // ============================================
    // 2. FIBONACCI TARGETS
    // ============================================
    
    if (fibonacci) {
      const fibLevels = [
        { value: fibonacci.fib236, name: 'Fibonacci 23.6%', strength: 6 },
        { value: fibonacci.fib382, name: 'Fibonacci 38.2%', strength: 7 },
        { value: fibonacci.fib500, name: 'Fibonacci 50%', strength: 8 },
        { value: fibonacci.fib618, name: 'Fibonacci 61.8% (Золотое)', strength: 10 },
        { value: fibonacci.fib786, name: 'Fibonacci 78.6%', strength: 8 },
        { value: fibonacci.high, name: 'Fibonacci High', strength: 9 }
      ]
  
      fibLevels.forEach(fib => {
        if (fib.value > currentPrice) {
          potentialTargets.push({
            price: fib.value,
            source: fib.name,
            strength: fib.strength
          })
        } else if (fib.value < currentPrice) {
          potentialStops.push({
            price: fib.value,
            source: fib.name,
            strength: fib.strength
          })
        }
      })
    }
  
    // ============================================
    // 3. RESISTANCE LEVELS (цели)
    // ============================================
    
    if (resistance && resistance > currentPrice) {
      if (Array.isArray(resistance)) {
        resistance.forEach((r, i) => {
          if (r > currentPrice) {
            potentialTargets.push({
              price: r,
              source: `Сопротивление ${i + 1}`,
              strength: 9 - i
            })
          }
        })
      } else {
        potentialTargets.push({
          price: resistance,
          source: 'Сопротивление',
          strength: 9
        })
      }
    }
  
    // ============================================
    // 4. SUPPORT LEVELS (стопы)
    // ============================================
    
    if (support && support < currentPrice) {
      if (Array.isArray(support)) {
        support.forEach((s, i) => {
          if (s < currentPrice) {
            potentialStops.push({
              price: s,
              source: `Поддержка ${i + 1}`,
              strength: 9 - i
            })
          }
        })
      } else {
        potentialStops.push({
          price: support,
          source: 'Поддержка',
          strength: 9
        })
      }
    }
  
    // ============================================
    // 5. ATR-BASED STOP
    // ============================================
    
    potentialStops.push({
      price: currentPrice - (atr * ranges.atrMultipliers.sl),
      source: `ATR ${ranges.atrMultipliers.sl}x`,
      strength: 7
    })
  
    // ============================================
    // СОРТИРОВКА И ВЫБОР
    // ============================================
  
    potentialTargets.sort((a, b) => a.price - b.price)
    potentialStops.sort((a, b) => b.price - a.price)
  
    const tp1 = selectBestTarget(potentialTargets, currentPrice, ranges.tp1Min, ranges.tp1Max)
    const tp2 = selectBestTarget(potentialTargets, currentPrice, ranges.tp2Min, ranges.tp2Max)
    const tp3 = selectBestTarget(potentialTargets, currentPrice, ranges.tp3Min, ranges.tp3Max)
    const sl = selectBestStop(potentialStops, currentPrice, ranges.slMin, ranges.slMax)
  
    // Risk/Reward
    const risk = currentPrice - sl.price
    const reward = tp2.price - currentPrice
    const riskReward = risk > 0 ? (reward / risk) : 0
  
    return {
      entry: currentPrice,
      tp1,
      tp2,
      tp3,
      sl,
      riskReward: riskReward.toFixed(1),
      style
    }
  }
  
  // ============================================
  // ДИАПАЗОНЫ ДЛЯ КАЖДОГО СТИЛЯ
  // ============================================
  
  function getStyleRanges(style) {
    const ranges = {
      scalping: {
        tp1Min: 0.1,
        tp1Max: 0.3,
        tp2Min: 0.3,
        tp2Max: 0.5,
        tp3Min: 0.5,
        tp3Max: 0.8,
        slMin: 0.1,
        slMax: 0.2,
        atrMultipliers: {
          tp1: 0.3,
          tp2: 0.5,
          tp3: 0.8,
          sl: 0.2
        }
      },
      daytrading: {
        tp1Min: 0.5,
        tp1Max: 1.5,
        tp2Min: 1.5,
        tp2Max: 3,
        tp3Min: 3,
        tp3Max: 5,
        slMin: 0.5,
        slMax: 1.5,
        atrMultipliers: {
          tp1: 1.0,
          tp2: 2.0,
          tp3: 3.5,
          sl: 1.0
        }
      },
      swing: {
        tp1Min: 1,
        tp1Max: 2.5,
        tp2Min: 2.5,
        tp2Max: 6,
        tp3Min: 6,
        tp3Max: 10,
        slMin: 1,
        slMax: 3,
        atrMultipliers: {
          tp1: 1.5,
          tp2: 3.0,
          tp3: 4.5,
          sl: 2.0
        }
      }
    }
  
    return ranges[style] || ranges.swing
  }
  
  // ============================================
  // ВЫБОР ЛУЧШЕЙ ЦЕЛИ
  // ============================================
  
  function selectBestTarget(targets, currentPrice, minPercent, maxPercent) {
    if (targets.length === 0) {
      // Fallback
      const avgPercent = (minPercent + maxPercent) / 2
      return {
        price: currentPrice * (1 + avgPercent / 100),
        source: 'Расчётная',
        strength: 5
      }
    }
  
    // Фильтруем по диапазону
    const filtered = targets.filter(t => {
      const change = ((t.price - currentPrice) / currentPrice) * 100
      return change >= minPercent && change <= maxPercent
    })
  
    if (filtered.length === 0) {
      // Берём ближайшую к диапазону
      const targetPercent = (minPercent + maxPercent) / 2
      const targetPrice = currentPrice * (1 + targetPercent / 100)
      
      let closest = targets[0]
      let minDiff = Math.abs(closest.price - targetPrice)
      
      targets.forEach(t => {
        const diff = Math.abs(t.price - targetPrice)
        if (diff < minDiff) {
          minDiff = diff
          closest = t
        }
      })
      
      return closest
    }
  
    // Выбираем с наибольшей силой
    filtered.sort((a, b) => b.strength - a.strength)
    return filtered[0]
  }
  
  // ============================================
  // ВЫБОР ЛУЧШЕГО СТОПА
  // ============================================
  
  function selectBestStop(stops, currentPrice, minPercent, maxPercent) {
    if (stops.length === 0) {
      // Fallback
      const avgPercent = (minPercent + maxPercent) / 2
      return {
        price: currentPrice * (1 - avgPercent / 100),
        source: 'Расчётный',
        strength: 7
      }
    }
  
    // Фильтруем по диапазону
    const filtered = stops.filter(s => {
      const change = Math.abs(((s.price - currentPrice) / currentPrice) * 100)
      return change >= minPercent && change <= maxPercent
    })
  
    if (filtered.length === 0) {
      // Берём ближайший
      stops.sort((a, b) => Math.abs(b.price - currentPrice) - Math.abs(a.price - currentPrice))
      return stops[0]
    }
  
    // Выбираем с наибольшей силой
    filtered.sort((a, b) => b.strength - a.strength)
    return filtered[0]
  }
  
  // ============================================
  // ФОРМАТИРОВАНИЕ
  // ============================================
  
  export function formatTarget(target, currentPrice) {
    const change = ((target.price - currentPrice) / currentPrice) * 100
    return {
      price: target.price.toFixed(2),
      change: change.toFixed(2),
      source: target.source,
      strength: target.strength,
      display: `$${target.price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(1)}%)`
    }
  }
  
  export function formatStop(stop, currentPrice) {
    const change = ((stop.price - currentPrice) / currentPrice) * 100
    return {
      price: stop.price.toFixed(2),
      change: change.toFixed(2),
      source: stop.source,
      strength: stop.strength,
      display: `$${stop.price.toFixed(2)} (${change.toFixed(1)}%)`
    }
  }