import { useState, useEffect } from 'react'
import { BotService } from '../services/botService'
import { Power, TrendingUp, Zap, BarChart3, RefreshCw, Settings, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AIPage() {
  const [masterStatus, setMasterStatus] = useState(false)
const [expandedStrategy, setExpandedStrategy] = useState(null)
const [loading, setLoading] = useState(true)
const [portfolioData, setPortfolioData] = useState({
  totalBalance: 0,
  todayPnL: 0,
  todayPnLPercent: 0,
  activeBotsCount: 0,
  todayTrades: 0,
  openPositions: 0
})
const [strategies, setStrategies] = useState([])

const botService = new BotService()

// Загрузка данных при монтировании
useEffect(() => {
  loadBotsStatus()
  
  // Обновляем каждые 5 секунд
  const interval = setInterval(loadBotsStatus, 5000)
  
  return () => clearInterval(interval)
}, [])

// Загрузить статус ботов
const loadBotsStatus = async () => {
  const data = await botService.getBotsStatus()
  
  if (data) {
    setPortfolioData(data.portfolio)
    
    // Преобразуем данные для UI
    const mappedStrategies = data.strategies.map(strat => {
      const config = getStrategyConfig(strat.id)
      
      return {
        ...strat,
        ...config,
        bots: strat.bots.map(bot => ({
          ...bot,
          name: getModeLabel(bot.mode)
        }))
      }
    })
    
    setStrategies(mappedStrategies)
    
    // Определяем мастер-статус
    const allActive = data.strategies.every(s => 
      s.bots.every(b => b.active)
    )
    setMasterStatus(allActive)
    
    setLoading(false)
  }
}

// Конфигурация стратегий
const getStrategyConfig = (id) => {
  const configs = {
    momentum: {
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    trend: {
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    meanreversion: {
      icon: RefreshCw,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  }
  
  return configs[id] || configs.momentum
}

// Название режима
const getModeLabel = (mode) => {
  const labels = {
    aggressive: 'Агрессивный',
    balanced: 'Сбалансированный',
    conservative: 'Консервативный'
  }
  return labels[mode] || mode
}

// Переключить мастер-статус
const toggleMasterStatus = async () => {
  const newStatus = !masterStatus
  
  if (newStatus) {
    await botService.startAll()
  } else {
    await botService.stopAll()
  }
  
  setMasterStatus(newStatus)
  
  // Обновляем статус
  setTimeout(loadBotsStatus, 500)
}

// Переключить бота
const toggleBot = async (botId, currentStatus) => {
  if (currentStatus) {
    await botService.stopBot(botId)
  } else {
    await botService.startBot(botId)
  }
  
  // Обновляем статус
  setTimeout(loadBotsStatus, 500)
}

const toggleStrategy = (strategyId) => {
  setExpandedStrategy(expandedStrategy === strategyId ? null : strategyId)
}


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      
      {/* Header */}
<div className="mb-6">
  <h1 className="text-2xl font-bold mb-2">AI ТРЕЙДИНГ</h1>
  <p className="text-sm text-gray-400">Автоматическое управление портфелем</p>
</div>

{/* Loading */}
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
  </div>
)}

      {!loading && (
        <>
      {/* Master Control */}
      <div className={`mb-6 rounded-xl border-2 transition ${
        masterStatus 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <button
          onClick={toggleMasterStatus}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${masterStatus ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Power size={24} className={masterStatus ? 'text-green-500' : 'text-red-500'} />
            </div>
            <div className="text-left">
              <p className="font-bold">
                {masterStatus ? 'ВСЕ БОТЫ АКТИВНЫ' : 'ВСЕ БОТЫ ОСТАНОВЛЕНЫ'}
              </p>
              <p className="text-xs text-gray-400">
                {masterStatus ? 'Нажмите для остановки' : 'Нажмите для запуска'}
              </p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full transition ${
            masterStatus ? 'bg-green-500' : 'bg-gray-700'
          } relative`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
              masterStatus ? 'left-6' : 'left-0.5'
            }`} />
          </div>
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">БАЛАНС</p>
            <p className="text-2xl font-bold">
              ${portfolioData.totalBalance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">СЕГОДНЯ</p>
            <p className={`text-2xl font-bold ${
              portfolioData.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {portfolioData.todayPnL >= 0 ? '+' : ''}${portfolioData.todayPnL.toFixed(2)}
            </p>
            <p className={`text-xs ${
              portfolioData.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {portfolioData.todayPnL >= 0 ? '+' : ''}{portfolioData.todayPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Активных ботов</p>
            <p className="text-lg font-bold">{portfolioData.activeBotsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Сделок сегодня</p>
            <p className="text-lg font-bold">{portfolioData.todayTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Открытых</p>
            <p className="text-lg font-bold">{portfolioData.openPositions}</p>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">СТРАТЕГИИ</h2>
        
        {strategies.map(strategy => {
          const Icon = strategy.icon
          const isExpanded = expandedStrategy === strategy.id
          
          return (
            <div key={strategy.id} className={`bg-[#1A1A1A] rounded-xl border ${strategy.borderColor} overflow-hidden`}>
              {/* Strategy Header */}
              <button
                onClick={() => toggleStrategy(strategy.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#252525] transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${strategy.bgColor}`}>
                    <Icon size={20} className={strategy.color} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{strategy.name}</p>
                    <p className="text-xs text-gray-400">
                      Капитал: ${strategy.capital.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold ${
                      strategy.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(2)}
                    </p>
                    <p className={`text-xs ${
                      strategy.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {strategy.pnl >= 0 ? '+' : ''}{strategy.pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Bots List */}
              {isExpanded && (
                <div className="border-t border-gray-800">
                  {strategy.bots.map(bot => (
  <div
    key={bot.id}
    className="p-3 border-b border-gray-800 last:border-b-0 hover:bg-[#252525] transition"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          bot.active ? 'bg-green-500' : 'bg-gray-700'
        }`} />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{bot.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded ${
              bot.mode === 'aggressive' ? 'bg-orange-500/20 text-orange-500' :
              bot.mode === 'balanced' ? 'bg-blue-500/20 text-blue-500' :
              'bg-green-500/20 text-green-500'
            }`}>
              {bot.mode === 'aggressive' ? 'AGG' : bot.mode === 'balanced' ? 'BAL' : 'CON'}
            </span>
          </div>
          <p className="text-xs text-gray-500">Сделок: {bot.trades}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-bold text-sm ${
            bot.pnl >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}
          </p>
        </div>
        
        <button
          onClick={() => toggleBot(bot.id, bot.active)}
          className={`w-10 h-5 rounded-full transition relative ${
            bot.active ? 'bg-green-500' : 'bg-gray-700'
          }`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            bot.active ? 'left-5' : 'left-0.5'
          }`} />
        </button>
      </div>
    </div>
  </div>
))}
                  
                  <button className="w-full p-3 text-sm text-[#00E5FF] hover:bg-[#252525] transition flex items-center justify-center gap-2">
                    <Settings size={16} />
                    Настроить стратегию
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">ИНСТРУМЕНТЫ</h2>
        
        <Link
          to="/positions"
          className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30 transition flex items-center gap-3"
        >
          <Activity className="text-[#00E5FF]" size={24} />
          <div className="flex-1">
            <p className="font-medium">Открытые позиции</p>
            <p className="text-gray-400 text-xs">Мониторинг в реальном времени</p>
          </div>
          {portfolioData.openPositions > 0 && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {portfolioData.openPositions}
            </span>
          )}
        </Link>

        <Link
          to="/monitoring"
          className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30 transition flex items-center gap-3"
        >
          <Activity className="text-[#00E5FF]" size={24} />
          <div className="flex-1">
            <p className="font-medium">AI Мониторинг</p>
            <p className="text-gray-400 text-xs">Отслеживание открытых позиций</p>
          </div>
        </Link>

        <Link
          to="/manual-monitoring"
          className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30 transition flex items-center gap-3"
        >
          <BarChart3 className="text-[#00E5FF]" size={24} />
          <div className="flex-1">
            <p className="font-medium">Ручной мониторинг</p>
            <p className="text-gray-400 text-xs">Управление сделками вручную</p>
          </div>
        </Link>

        <Link
          to="/backtest"
          className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30 transition flex items-center gap-3"
        >
          <Activity className="text-[#00E5FF]" size={24} />
          <div className="flex-1">
            <p className="font-medium">Бэктест системы</p>
            <p className="text-gray-400 text-xs">Проверка на исторических данных</p>
          </div>
        </Link>
        </div>
    </>
  )}
    </div>
  )
}