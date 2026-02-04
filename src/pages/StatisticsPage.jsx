import { ArrowLeft, TrendingUp, Target, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'

export default function StatisticsPage() {
  const { tradeHistory, positions } = useTrading()

  // Расчёты
  const totalTrades = tradeHistory.length
  const winTrades = tradeHistory.filter(t => t.profit > 0).length
  const lossTrades = tradeHistory.filter(t => t.profit < 0).length
  const winRate = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : 0
  
  const totalProfit = tradeHistory.reduce((sum, t) => sum + parseFloat(t.profit), 0)
  const avgProfit = totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : 0
  
  const aiTrades = tradeHistory.filter(t => t.isAI)
  const manualTrades = tradeHistory.filter(t => !t.isAI)
  
  const aiWinRate = aiTrades.length > 0 
    ? ((aiTrades.filter(t => t.profit > 0).length / aiTrades.length) * 100).toFixed(1) 
    : 0
  const manualWinRate = manualTrades.length > 0
    ? ((manualTrades.filter(t => t.profit > 0).length / manualTrades.length) * 100).toFixed(1)
    : 0

  // По дням
  const today = new Date().toDateString()
  const todayTrades = tradeHistory.filter(t => 
    new Date(t.closeTime).toDateString() === today
  )

  const thisWeek = tradeHistory.filter(t => {
    const tradeDate = new Date(t.closeTime)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return tradeDate >= weekAgo
  })

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">📊 Статистика</h1>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-[#00E5FF]" size={20} />
            <p className="text-sm text-gray-400">Всего сделок</p>
          </div>
          <p className="text-3xl font-bold">{totalTrades}</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-green-500" size={20} />
            <p className="text-sm text-gray-400">Win Rate</p>
          </div>
          <p className="text-3xl font-bold text-green-500">{winRate}%</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-[#00E5FF]" size={20} />
            <p className="text-sm text-gray-400">Прибыль</p>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${totalProfit.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
          <p className="text-sm text-gray-400 mb-2">Средняя</p>
          <p className={`text-2xl font-bold ${avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${avgProfit}
          </p>
        </div>
      </div>

      {/* Win/Loss */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Результаты</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Прибыльных</span>
            <span className="text-green-500 font-bold">{winTrades}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Убыточных</span>
            <span className="text-red-500 font-bold">{lossTrades}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{width: `${winRate}%`}}
            ></div>
          </div>
        </div>
      </div>

      {/* AI vs Manual */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">AI vs Ручная торговля</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">AI Трейдинг</p>
            <p className="text-xl font-bold text-[#00E5FF]">{aiTrades.length}</p>
            <p className="text-xs text-green-500 mt-1">Win: {aiWinRate}%</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Ручная</p>
            <p className="text-xl font-bold text-orange-400">{manualTrades.length}</p>
            <p className="text-xs text-green-500 mt-1">Win: {manualWinRate}%</p>
          </div>
        </div>
      </div>

      {/* Time Period */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">По периодам</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Сегодня</span>
            <span className="font-bold">{todayTrades.length} сделок</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">За неделю</span>
            <span className="font-bold">{thisWeek.length} сделок</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Всего</span>
            <span className="font-bold">{totalTrades} сделок</span>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">Активные позиции</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">AI позиции</span>
          <span className="font-bold text-[#00E5FF]">{positions.ai.length}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-400">Ручные позиции</span>
          <span className="font-bold text-orange-400">{positions.manual.length}</span>
        </div>
      </div>

      {/* Backtesting Link */}
      <Link 
        to="/backtest"
        className="block bg-[#1A1A1A] rounded-xl p-4 border border-gray-800 mt-4"
      >
        <p className="font-bold">📈 Backtesting</p>
        <p className="text-sm text-gray-400">Протестировать стратегию на истории</p>
      </Link>
    </div>
  )
}