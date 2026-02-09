import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, BarChart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'
import { ReportGenerator } from '../services/reportGenerator'

export default function LiveTestingPage() {
  const { aiEnabled, tradeHistory, positions, portfolio, aiSignals } = useTrading()
  const [testStats, setTestStats] = useState(null)
  const [reportGen] = useState(() => new ReportGenerator())
  const [dailyReport, setDailyReport] = useState(null)
  const [weeklyReport, setWeeklyReport] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [startTime] = useState(() => {
    const saved = localStorage.getItem('test-start-time')
    return saved ? parseInt(saved) : Date.now()
  })

  useEffect(() => {
    if (!localStorage.getItem('test-start-time')) {
      localStorage.setItem('test-start-time', Date.now())
    }
  }, [])

  useEffect(() => {
    calculateStats()
  }, [tradeHistory, positions])

  useEffect(() => {
    if (tradeHistory.length > 0) {
      const daily = reportGen.generateDailyReport(tradeHistory, portfolio)
      const weekly = reportGen.generateWeeklyReport(tradeHistory, portfolio)
      const anomalies = reportGen.detectAnomalies(tradeHistory, portfolio)
      
      setDailyReport(daily)
      setWeeklyReport(weekly)
      setAlerts(anomalies)
    }
  }, [tradeHistory, portfolio])

  const calculateStats = () => {
    const testDuration = Date.now() - startTime
    const daysRunning = testDuration / (1000 * 60 * 60 * 24)

    const testTrades = tradeHistory.filter(t => t.closeTime >= startTime)
    const wins = testTrades.filter(t => t.profit > 0)
    const losses = testTrades.filter(t => t.profit < 0)

    const totalProfit = testTrades.reduce((sum, t) => sum + parseFloat(t.profit), 0)
    const winRate = testTrades.length > 0 ? (wins.length / testTrades.length) * 100 : 0

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.profit, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + Math.abs(t.profit), 0) / losses.length : 0

    const profitFactor = losses.length > 0 
      ? wins.reduce((sum, t) => sum + t.profit, 0) / losses.reduce((sum, t) => sum + Math.abs(t.profit), 0)
      : wins.length > 0 ? 999 : 0

    // Sharpe Ratio
    const returns = testTrades.map(t => t.profitPercent)
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b) / returns.length : 0
    const variance = returns.length > 0 
      ? returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b) / returns.length 
      : 0
    const stdDev = Math.sqrt(variance)
    const sharpe = stdDev > 0 ? avgReturn / stdDev : 0

    // Projected monthly return
    const dailyProfit = daysRunning > 0 ? totalProfit / daysRunning : 0
    const projectedMonthly = (dailyProfit * 30 / 10000) * 100

    // Drawdown
    const balanceHistory = [10000]
    testTrades.forEach(t => {
      balanceHistory.push(balanceHistory[balanceHistory.length - 1] + t.profit)
    })
    const peak = Math.max(...balanceHistory)
    const currentDrawdown = ((peak - portfolio.balance) / peak) * 100

    setTestStats({
      daysRunning: daysRunning.toFixed(1),
      totalTrades: testTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: winRate.toFixed(1),
      totalProfit: totalProfit.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      sharpe: sharpe.toFixed(2),
      projectedMonthly: projectedMonthly.toFixed(2),
      currentDrawdown: currentDrawdown.toFixed(2),
      activePositions: positions.ai.length + positions.manual.length,
      signalsGenerated: aiSignals.length + parseInt(localStorage.getItem('total-signals') || '0')
    })
  }

  const resetTest = () => {
    if (confirm('Сбросить тест? История останется, но счётчик обнулится.')) {
      localStorage.setItem('test-start-time', Date.now())
      window.location.reload()
    }
  }

  if (!testStats) return <div className="text-white p-4">Loading...</div>

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-xl font-bold">Live Testing</h1>
          <p className="text-xs text-gray-400">Отслеживание производительности AI</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div 
              key={i} 
              className={`rounded-xl p-4 border ${
                alert.type === 'DANGER' ? 'bg-red-500/10 border-red-500/30' :
                alert.type === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' :
                alert.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/30' :
                'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <p className="font-bold text-sm mb-1">{alert.title}</p>
              <p className="text-xs text-gray-300">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {aiEnabled ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-green-500">AI Активен</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="font-bold text-gray-400">AI Остановлен</span>
              </>
            )}
          </div>
          <span className="text-sm text-gray-400">{testStats.daysRunning} дней</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Сделок</p>
            <p className="text-2xl font-bold">{testStats.totalTrades}</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Активных</p>
            <p className="text-2xl font-bold text-[#00E5FF]">{testStats.activePositions}</p>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">📊 Производительность</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Win Rate</span>
            <span className={`font-bold ${parseFloat(testStats.winRate) >= 70 ? 'text-green-500' : parseFloat(testStats.winRate) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {testStats.winRate}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Total P&L</span>
            <span className={`font-bold ${parseFloat(testStats.totalProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(testStats.totalProfit) >= 0 ? '+' : ''}${testStats.totalProfit}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Projected Monthly</span>
            <span className={`font-bold ${parseFloat(testStats.projectedMonthly) >= 10 ? 'text-green-500' : 'text-yellow-500'}`}>
              {parseFloat(testStats.projectedMonthly) >= 0 ? '+' : ''}{testStats.projectedMonthly}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Profit Factor</span>
            <span className={`font-bold ${parseFloat(testStats.profitFactor) >= 2 ? 'text-green-500' : parseFloat(testStats.profitFactor) >= 1.5 ? 'text-yellow-500' : 'text-red-500'}`}>
              {testStats.profitFactor}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Sharpe Ratio</span>
            <span className={`font-bold ${parseFloat(testStats.sharpe) >= 1.5 ? 'text-green-500' : parseFloat(testStats.sharpe) >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
              {testStats.sharpe}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Current Drawdown</span>
            <span className={`font-bold ${parseFloat(testStats.currentDrawdown) < 5 ? 'text-green-500' : parseFloat(testStats.currentDrawdown) < 8 ? 'text-yellow-500' : 'text-red-500'}`}>
              {testStats.currentDrawdown}%
            </span>
          </div>
        </div>
      </div>

      {/* Trade Breakdown */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">💼 Детали сделок</h3>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-500/10 p-3 rounded border border-green-500/30">
            <p className="text-gray-400 mb-1">Wins</p>
            <p className="text-2xl font-bold text-green-500">{testStats.wins}</p>
            <p className="text-xs text-gray-400 mt-1">Avg: ${testStats.avgWin}</p>
          </div>

          <div className="bg-red-500/10 p-3 rounded border border-red-500/30">
            <p className="text-gray-400 mb-1">Losses</p>
            <p className="text-2xl font-bold text-red-500">{testStats.losses}</p>
            <p className="text-xs text-gray-400 mt-1">Avg: ${testStats.avgLoss}</p>
          </div>
        </div>
      </div>

      {/* Targets */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">🎯 Целевые показатели</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Win Rate ≥ 70%</span>
            <span>{parseFloat(testStats.winRate) >= 70 ? '✅' : '⏳'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Monthly Return ≥ 10%</span>
            <span>{parseFloat(testStats.projectedMonthly) >= 10 ? '✅' : '⏳'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Sharpe Ratio ≥ 1.5</span>
            <span>{parseFloat(testStats.sharpe) >= 1.5 ? '✅' : '⏳'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Profit Factor ≥ 2.0</span>
            <span>{parseFloat(testStats.profitFactor) >= 2 ? '✅' : '⏳'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Drawdown &lt; 8%</span>
            <span>{parseFloat(testStats.currentDrawdown) < 8 ? '✅' : '⚠️'}</span>
          </div>
        </div>
      </div>

      {/* Daily Report */}
      {dailyReport && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <h3 className="font-bold mb-3">📅 Сегодня ({dailyReport.date})</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400">Сделок</p>
              <p className="font-bold">{dailyReport.trades}</p>
            </div>
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400">Win Rate</p>
              <p className="font-bold text-green-500">{dailyReport.winRate}%</p>
            </div>
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400">P&L</p>
              <p className={`font-bold ${parseFloat(dailyReport.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${dailyReport.profit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report */}
      {weeklyReport && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <h3 className="font-bold mb-3">📊 За неделю</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Сделок</span>
              <span className="font-bold">{weeklyReport.trades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate</span>
              <span className="font-bold text-green-500">{weeklyReport.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profit</span>
              <span className={`font-bold ${parseFloat(weeklyReport.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${weeklyReport.profit} ({weeklyReport.profitPercent}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Лучшая пара</span>
              <span className="font-bold text-[#00E5FF]">{weeklyReport.bestPair}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Лучшая стратегия</span>
              <span className="font-bold text-purple-400">{weeklyReport.bestStrategy}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Link 
          to="/statistics"
          className="block w-full bg-[#00E5FF] text-black py-3 rounded-xl font-medium text-center"
        >
          📊 Детальная статистика
        </Link>

        <button
          onClick={() => reportGen.exportToCSV(tradeHistory)}
          className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium"
        >
          📥 Экспорт в CSV
        </button>

        <button
          onClick={resetTest}
          className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium"
        >
          🔄 Сбросить счётчик
        </button>
      </div>
    </div>
  )
}