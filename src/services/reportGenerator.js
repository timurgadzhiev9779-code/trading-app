export class ReportGenerator {
  
    // Ежедневный отчёт
    generateDailyReport(tradeHistory, portfolio) {
      const today = new Date().toDateString()
      const todayTrades = tradeHistory.filter(t => 
        new Date(t.closeTime).toDateString() === today
      )
  
      const wins = todayTrades.filter(t => t.profit > 0)
      const losses = todayTrades.filter(t => t.profit < 0)
      const totalProfit = todayTrades.reduce((sum, t) => sum + parseFloat(t.profit), 0)
  
      return {
        date: new Date().toLocaleDateString('ru-RU'),
        trades: todayTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: todayTrades.length > 0 ? ((wins.length / todayTrades.length) * 100).toFixed(1) : '0',
        profit: totalProfit.toFixed(2),
        balance: portfolio.balance.toFixed(2),
        bestTrade: todayTrades.length > 0 
          ? Math.max(...todayTrades.map(t => t.profit)).toFixed(2)
          : '0',
        worstTrade: todayTrades.length > 0
          ? Math.min(...todayTrades.map(t => t.profit)).toFixed(2)
          : '0'
      }
    }
  
    // Недельный отчёт
    generateWeeklyReport(tradeHistory, portfolio) {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      const weekTrades = tradeHistory.filter(t => t.closeTime >= weekAgo)
  
      const wins = weekTrades.filter(t => t.profit > 0)
      const losses = weekTrades.filter(t => t.profit < 0)
      const totalProfit = weekTrades.reduce((sum, t) => sum + parseFloat(t.profit), 0)
  
      // Лучшая пара
      const pairProfits = {}
      weekTrades.forEach(t => {
        pairProfits[t.pair] = (pairProfits[t.pair] || 0) + parseFloat(t.profit)
      })
      const bestPair = Object.entries(pairProfits).sort((a, b) => b[1] - a[1])[0]
  
      // Лучшая стратегия
      const strategyProfits = {}
      weekTrades.forEach(t => {
        const strategy = t.strategy || 'Manual'
        strategyProfits[strategy] = (strategyProfits[strategy] || 0) + parseFloat(t.profit)
      })
      const bestStrategy = Object.entries(strategyProfits).sort((a, b) => b[1] - a[1])[0]
  
      return {
        period: '7 дней',
        trades: weekTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: weekTrades.length > 0 ? ((wins.length / weekTrades.length) * 100).toFixed(1) : '0',
        profit: totalProfit.toFixed(2),
        profitPercent: ((totalProfit / 10000) * 100).toFixed(2),
        avgProfit: (totalProfit / weekTrades.length).toFixed(2),
        bestPair: bestPair ? `${bestPair[0]} (+$${bestPair[1].toFixed(2)})` : 'N/A',
        bestStrategy: bestStrategy ? `${bestStrategy[0]} (+$${bestStrategy[1].toFixed(2)})` : 'N/A'
      }
    }
  
    // Проверка аномалий
    detectAnomalies(tradeHistory, portfolio) {
      const alerts = []
      const recent = tradeHistory.slice(-10)
  
      // Серия убытков
      const lastFive = recent.slice(-5)
      if (lastFive.length === 5 && lastFive.every(t => t.profit < 0)) {
        alerts.push({
          type: 'DANGER',
          title: '🔴 Серия убытков',
          message: '5 убыточных сделок подряд. Рассмотрите остановку AI.'
        })
      }
  
      // Большая просадка
      if (portfolio.pnlPercent < -5) {
        alerts.push({
          type: 'WARNING',
          title: '⚠️ Большая просадка',
          message: `Просадка: ${portfolio.pnlPercent.toFixed(2)}%. Проверьте настройки.`
        })
      }
  
      // Низкий винрейт
      const recentWins = recent.filter(t => t.profit > 0).length
      const recentWinRate = recent.length > 0 ? (recentWins / recent.length) * 100 : 0
      if (recent.length >= 10 && recentWinRate < 50) {
        alerts.push({
          type: 'WARNING',
          title: '⚠️ Низкий винрейт',
          message: `Последние 10 сделок: ${recentWinRate.toFixed(0)}% винрейт. Ожидалось 70%+.`
        })
      }
  
      // Отличные результаты
      if (recentWinRate >= 80 && recent.length >= 10) {
        alerts.push({
          type: 'SUCCESS',
          title: '✅ Отличная производительность',
          message: `Винрейт: ${recentWinRate.toFixed(0)}%! AI работает отлично.`
        })
      }
  
      // Много активных позиций
      if (portfolio.available < portfolio.balance * 0.2) {
        alerts.push({
          type: 'INFO',
          title: 'ℹ️ Высокая загрузка капитала',
          message: `${((1 - portfolio.available / portfolio.balance) * 100).toFixed(0)}% капитала в позициях.`
        })
      }
  
      return alerts
    }
  
    // Сохранение отчёта
    saveReport(report, type) {
      const reports = JSON.parse(localStorage.getItem('reports') || '[]')
      reports.push({
        timestamp: Date.now(),
        type,
        data: report
      })
      localStorage.setItem('reports', JSON.stringify(reports.slice(-30)))
    }
  
    // Экспорт отчёта в CSV
    exportToCSV(tradeHistory) {
      const headers = ['Date', 'Pair', 'Type', 'Entry', 'Exit', 'Amount', 'Profit', 'Profit%', 'Strategy', 'AI']
      const rows = tradeHistory.map(t => [
        new Date(t.closeTime).toLocaleString('ru-RU'),
        t.pair,
        t.type,
        t.entry,
        t.exit,
        t.amount,
        t.profit,
        t.profitPercent,
        t.strategy || 'Manual',
        t.isAI ? 'Yes' : 'No'
      ])
  
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trading-history-${Date.now()}.csv`
      a.click()
    }
  }