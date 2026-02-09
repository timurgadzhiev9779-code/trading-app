export class SelfOptimizer {
    constructor() {
      this.testResults = this.loadTestResults()
      this.bestParams = this.loadBestParams()
    }
  
    loadTestResults() {
      const saved = localStorage.getItem('optimization_results')
      return saved ? JSON.parse(saved) : []
    }
  
    loadBestParams() {
      const saved = localStorage.getItem('best_params')
      return saved ? JSON.parse(saved) : this.getDefaultParams()
    }
  
    getDefaultParams() {
      return {
        minConfidence: 75,
        minAdvancedConfidence: 60,
        rsiMin: 35,
        rsiMax: 70,
        volumeThreshold: 'ABOVE_AVG',
        tpMultiplier: 1.5,
        slMultiplier: 1.0,
        cooldownHours: 1,
        maxPositions: 5,
        kellyFraction: 0.5
      }
    }
  
    // Генетический алгоритм - создание вариаций параметров
    generateVariations(baseParams, count = 10) {
      const variations = []
      
      for (let i = 0; i < count; i++) {
        const mutated = { ...baseParams }
        
        // Мутация параметров (±10%)
        mutated.minConfidence = this.mutate(baseParams.minConfidence, 70, 90, 5)
        mutated.minAdvancedConfidence = this.mutate(baseParams.minAdvancedConfidence, 55, 75, 5)
        mutated.rsiMin = this.mutate(baseParams.rsiMin, 30, 45, 5)
        mutated.rsiMax = this.mutate(baseParams.rsiMax, 60, 75, 5)
        mutated.tpMultiplier = this.mutate(baseParams.tpMultiplier, 1.2, 2.5, 0.2)
        mutated.slMultiplier = this.mutate(baseParams.slMultiplier, 0.8, 1.5, 0.1)
        mutated.cooldownHours = this.mutate(baseParams.cooldownHours, 0.5, 2, 0.25)
        mutated.kellyFraction = this.mutate(baseParams.kellyFraction, 0.3, 0.7, 0.1)
        
        variations.push({
          id: `gen_${Date.now()}_${i}`,
          params: mutated,
          fitness: null,
          tested: false
        })
      }
      
      return variations
    }
  
    mutate(value, min, max, step) {
      const change = (Math.random() - 0.5) * step * 2
      const newValue = value + change
      return Math.max(min, Math.min(max, newValue))
    }
  
    // Backtesting с конкретными параметрами
    async testParameters(params, historicalData) {
      let balance = 10000
      let wins = 0
      let losses = 0
      const trades = []
      
      for (const dataPoint of historicalData) {
        // Проверяем условия входа с этими параметрами
        if (this.shouldEnterWithParams(dataPoint, params)) {
          // Симулируем сделку
          const result = this.simulateTrade(dataPoint, params, balance)
          
          balance += result.profit
          trades.push(result)
          
          if (result.profit > 0) wins++
          else losses++
        }
      }
      
      const winRate = wins / (wins + losses)
      const profitPercent = ((balance - 10000) / 10000) * 100
      const sharpe = this.calculateSharpe(trades)
      
      // Fitness function (что оптимизируем)
      const fitness = (
        profitPercent * 0.4 +        // 40% вес на прибыль
        winRate * 100 * 0.3 +         // 30% вес на винрейт
        sharpe * 20 * 0.2 +           // 20% вес на Sharpe
        (trades.length / 10) * 0.1    // 10% вес на количество сделок
      )
      
      return {
        fitness,
        balance,
        profitPercent,
        winRate: (winRate * 100).toFixed(1),
        trades: trades.length,
        sharpe: sharpe.toFixed(2)
      }
    }
  
    shouldEnterWithParams(dataPoint, params) {
      return (
        dataPoint.confidence > params.minConfidence &&
        dataPoint.advancedConfidence > params.minAdvancedConfidence &&
        dataPoint.rsi > params.rsiMin &&
        dataPoint.rsi < params.rsiMax &&
        dataPoint.volume !== 'LOW'
      )
    }
  
    simulateTrade(entry, params, balance) {
      const entryPrice = entry.price
      const tp = entryPrice + (entry.atr * params.tpMultiplier)
      const sl = entryPrice - (entry.atr * params.slMultiplier)
      
      const positionSize = balance * 0.02 * params.kellyFraction
      
      // Упрощённо: 60% хит TP, 40% хит SL
      const hitTP = Math.random() < 0.6
      
      if (hitTP) {
        const profit = ((tp - entryPrice) / entryPrice) * positionSize
        return { profit, type: 'WIN', entryPrice, exitPrice: tp }
      } else {
        const loss = ((sl - entryPrice) / entryPrice) * positionSize
        return { profit: loss, type: 'LOSS', entryPrice, exitPrice: sl }
      }
    }
  
    calculateSharpe(trades) {
      if (trades.length === 0) return 0
      
      const returns = trades.map(t => (t.profit / 10000) * 100)
      const avgReturn = returns.reduce((a, b) => a + b) / returns.length
      const variance = returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b) / returns.length
      const stdDev = Math.sqrt(variance)
      
      return avgReturn / (stdDev + 0.001)
    }
  
    // Запуск оптимизации
    async runOptimization(historicalData) {
      console.log('🧬 Запуск генетической оптимизации...')
      
      const generations = 5
      const populationSize = 10
      
      let population = this.generateVariations(this.bestParams, populationSize)
      
      for (let gen = 0; gen < generations; gen++) {
        console.log(`📊 Поколение ${gen + 1}/${generations}`)
        
        // Тестируем каждую вариацию
        for (const variant of population) {
          const result = await this.testParameters(variant.params, historicalData)
          variant.fitness = result.fitness
          variant.result = result
          variant.tested = true
          
          console.log(`  Вариант ${variant.id.split('_')[2]}: fitness=${result.fitness.toFixed(2)}, profit=${result.profitPercent.toFixed(2)}%`)
        }
        
        // Сортируем по fitness
        population.sort((a, b) => b.fitness - a.fitness)
        
        // Сохраняем лучшие 3
        const elite = population.slice(0, 3)
        
        // Если не последнее поколение - создаём новое на основе элиты
        if (gen < generations - 1) {
          const newPopulation = [...elite]
          
          // Генерируем потомков от лучших
          while (newPopulation.length < populationSize) {
            const parent = elite[Math.floor(Math.random() * elite.length)]
            const children = this.generateVariations(parent.params, 1)
            newPopulation.push(...children)
          }
          
          population = newPopulation
        }
      }
      
      // Сохраняем лучшие параметры
      const best = population[0]
      this.bestParams = best.params
      localStorage.setItem('best_params', JSON.stringify(best.params))
      
      // Сохраняем результаты
      this.testResults.push({
        timestamp: Date.now(),
        params: best.params,
        result: best.result
      })
      localStorage.setItem('optimization_results', JSON.stringify(this.testResults.slice(-20)))
      
      console.log('✅ Оптимизация завершена!')
      console.log('🏆 Лучшие параметры:', best.params)
      console.log('📈 Результат:', best.result)
      
      return {
        bestParams: best.params,
        result: best.result,
        allResults: population.map(p => ({ params: p.params, result: p.result }))
      }
    }
  
    // Подготовка исторических данных для оптимизации
    async prepareHistoricalDataset(symbols = ['BTC', 'ETH', 'SOL']) {
      const dataset = []
      
      for (const symbol of symbols) {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=500`
        )
        const candles = await res.json()
        
        // Упрощённо: создаём датапоинты
        for (let i = 50; i < candles.length; i++) {
          const closes = candles.slice(i - 50, i).map(c => parseFloat(c[4]))
          const rsi = this.calculateSimpleRSI(closes, 14)
          
          dataset.push({
            symbol,
            timestamp: candles[i][0],
            price: parseFloat(candles[i][4]),
            rsi,
            confidence: 70 + Math.random() * 20,
            advancedConfidence: 60 + Math.random() * 20,
            atr: (parseFloat(candles[i][2]) - parseFloat(candles[i][3])) * 0.5,
            volume: Math.random() > 0.5 ? 'HIGH' : 'LOW'
          })
        }
      }
      
      return dataset
    }
  
    calculateSimpleRSI(prices, period = 14) {
      const changes = []
      for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1])
      }
      
      const gains = changes.slice(-period).filter(c => c > 0).reduce((a, b) => a + b, 0) / period
      const losses = Math.abs(changes.slice(-period).filter(c => c < 0).reduce((a, b) => a + b, 0)) / period
      
      const rs = gains / (losses + 0.001)
      return 100 - (100 / (1 + rs))
    }
  
    // Применить оптимизированные параметры к AI
    applyOptimizedParams(aiTrader) {
      console.log('🔄 Применяем оптимизированные параметры к AI...')
      
      // Обновляем параметры в AI Trader
      aiTrader.optimizedParams = this.bestParams
      
      console.log('✅ Параметры применены:', this.bestParams)
    }
  }