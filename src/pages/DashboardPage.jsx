import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Award, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [equityCurve, setEquityCurve] = useState([])
  const [dailyPnL, setDailyPnL] = useState([])
  const [strategyHeatmap, setStrategyHeatmap] = useState([])
  const [topSymbols, setTopSymbols] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Каждые 30 сек
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      // Кривая капитала
      const curveRes = await fetch('/api/dashboard/equity-curve')
      const curveData = await curveRes.json()
      setEquityCurve(curveData.curve || [])

      // Дневной P&L
      const dailyRes = await fetch('/api/dashboard/daily-pnl')
      const dailyData = await dailyRes.json()
      setDailyPnL(dailyData.daily || [])

      // Heatmap стратегий
      const heatmapRes = await fetch('/api/dashboard/strategy-heatmap')
      const heatmapData = await heatmapRes.json()
      setStrategyHeatmap(heatmapData.heatmap || [])

      // Топ монеты
      const symbolsRes = await fetch('/api/dashboard/top-symbols')
      const symbolsData = await symbolsRes.json()
      setTopSymbols(symbolsData.topSymbols || [])

      // Общая статистика
      const statsRes = await fetch('/api/stats/trading')
      const statsData = await statsRes.json()
      setStats(statsData.total)

      setLoading(false)
    } catch (err) {
      console.error('Ошибка загрузки dashboard:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
      </div>
    )
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Данные для Win/Loss pie chart
  const winLossData = stats ? [
    { name: 'Прибыльные', value: stats.wins, color: '#10b981' },
    { name: 'Убыточные', value: stats.losses, color: '#ef4444' }
  ] : []

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">Аналитика торговли</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Всего сделок</p>
            <p className="text-2xl font-bold">{stats.trades}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Винрейт</p>
            <p className="text-2xl font-bold text-[#00E5FF]">{stats.winRate}%</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Общий P&L</p>
            <p className={`text-2xl font-bold ${
              parseFloat(stats.totalPnL) >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              ${stats.totalPnL}
            </p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
            <p className="text-xs text-gray-400 mb-1">Средняя прибыль</p>
            <p className="text-2xl font-bold text-green-500">${stats.avgWin}</p>
          </div>
        </div>
      )}

      {/* Equity Curve */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          КРИВАЯ КАПИТАЛА
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatDateTime}
              stroke="#666"
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '10px' }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1A1A1A', 
                border: '1px solid #333',
                borderRadius: '8px'
              }}
              labelFormatter={formatDateTime}
              formatter={(value) => [`$${value}`, 'Баланс']}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#00E5FF" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily P&L */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          P&L ПО ДНЯМ
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyPnL}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="date" 
              stroke="#666"
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '10px' }}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1A1A1A', 
                border: '1px solid #333',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'P&L']}
            />
            <Bar 
              dataKey="pnl" 
              fill="#00E5FF"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win/Loss Pie + Top Symbols */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Win/Loss Pie */}
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            СООТНОШЕНИЕ СДЕЛОК
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1A1A1A', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Symbols */}
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            ТОП МОНЕТЫ
          </h2>
          <div className="space-y-2">
            {topSymbols.map((item, index) => (
              <div 
                key={item.symbol}
                className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <span className="font-medium">{item.symbol}</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    item.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.trades} сделок
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Heatmap */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
          СТАТИСТИКА ПО СТРАТЕГИЯМ
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          {strategyHeatmap.map(item => (
            <div 
              key={`${item.strategy}-${item.mode}`}
              className="bg-[#0A0A0A] rounded-lg p-4 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">{item.strategy}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                  {item.mode}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L:</span>
                  <span className={`font-bold ${
                    item.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Сделок:</span>
                  <span className="font-medium">{item.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Винрейт:</span>
                  <span className="font-medium text-[#00E5FF]">
                    {item.winRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}