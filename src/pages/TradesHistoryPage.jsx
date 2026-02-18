import { useState, useEffect } from 'react'
import { ArrowLeft, Download, Filter, Search, TrendingUp, TrendingDown, Calendar, Zap, BarChart3, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TradesHistoryPage() {
  const navigate = useNavigate()
  const [trades, setTrades] = useState([])
  const [filteredTrades, setFilteredTrades] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBot, setSelectedBot] = useState('all')
  const [selectedResult, setSelectedResult] = useState('all') // all, win, loss
  const [selectedStrategy, setSelectedStrategy] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState(null)

  useEffect(() => {
    loadTrades()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [trades, searchQuery, selectedBot, selectedResult, selectedStrategy, dateFrom, dateTo])

  const loadTrades = async () => {
    try {
      const response = await fetch('/api/trades/history')
      const data = await response.json()
      setTrades(data.trades || [])
      setLoading(false)
    } catch (err) {
      console.error('Ошибка загрузки истории:', err)
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...trades]

    // Поиск по монете
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Фильтр по боту
    if (selectedBot !== 'all') {
      filtered = filtered.filter(t => t.botId === selectedBot)
    }

    // Фильтр по результату
    if (selectedResult === 'win') {
      filtered = filtered.filter(t => t.pnl > 0)
    } else if (selectedResult === 'loss') {
      filtered = filtered.filter(t => t.pnl <= 0)
    }

    // Фильтр по стратегии
    if (selectedStrategy !== 'all') {
      filtered = filtered.filter(t => t.botId?.startsWith(selectedStrategy.toLowerCase()))
    }

    // Фильтр по дате
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime()
      filtered = filtered.filter(t => t.closeTime >= fromTime)
    }
    if (dateTo) {
      const toTime = new Date(dateTo).getTime() + 86400000 // +1 день
      filtered = filtered.filter(t => t.closeTime <= toTime)
    }

    setFilteredTrades(filtered)
  }

  const exportToCSV = () => {
    const headers = ['Дата', 'Монета', 'Бот', 'Вход', 'Выход', 'P&L $', 'P&L %', 'Причина']
    const rows = filteredTrades.map(t => [
      new Date(t.closeTime).toLocaleString('ru-RU'),
      t.symbol,
      t.botId,
      t.entry.toFixed(2),
      t.closePrice.toFixed(2),
      t.pnl.toFixed(2),
      (((t.closePrice - t.entry) / t.entry) * 100).toFixed(2),
      t.closeReason
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trades_${Date.now()}.csv`
    a.click()
  }

  const getStrategyIcon = (botId) => {
    if (botId?.includes('momentum')) return Zap
    if (botId?.includes('trend')) return TrendingUp
    if (botId?.includes('meanreversion')) return RefreshCw
    return BarChart3
  }

  const getStrategyColor = (botId) => {
    if (botId?.includes('momentum')) return 'text-yellow-500'
    if (botId?.includes('trend')) return 'text-blue-500'
    if (botId?.includes('meanreversion')) return 'text-purple-500'
    return 'text-gray-500'
  }

  const uniqueBots = [...new Set(trades.map(t => t.botId))].filter(Boolean)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">История сделок</h1>
            <p className="text-sm text-gray-400">
              {filteredTrades.length} из {trades.length} сделок
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-[#1A1A1A] border border-gray-800 rounded-lg hover:border-[#00E5FF]/30 transition"
          >
            <Filter size={20} />
          </button>
          <button
            onClick={exportToCSV}
            className="p-2 bg-[#1A1A1A] border border-gray-800 rounded-lg hover:border-[#00E5FF]/30 transition"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по монете..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg pl-10 pr-4 py-2 focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          {/* Filters Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Стратегия</label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 focus:border-[#00E5FF] focus:outline-none"
              >
                <option value="all">Все стратегии</option>
                <option value="momentum">Импульсная</option>
                <option value="trend">Трендовая</option>
                <option value="meanreversion">Контр-трендовая</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Результат</label>
              <select
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 focus:border-[#00E5FF] focus:outline-none"
              >
                <option value="all">Все сделки</option>
                <option value="win">Прибыльные</option>
                <option value="loss">Убыточные</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Бот</label>
              <select
                value={selectedBot}
                onChange={(e) => setSelectedBot(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 focus:border-[#00E5FF] focus:outline-none"
              >
                <option value="all">Все боты</option>
                {uniqueBots.map(bot => (
                  <option key={bot} value={bot}>{bot}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Row 2 - Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">От даты</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">До даты</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedBot('all')
              setSelectedResult('all')
              setSelectedStrategy('all')
              setDateFrom('')
              setDateTo('')
            }}
            className="text-sm text-[#00E5FF] hover:underline"
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-400">Нет сделок по выбранным фильтрам</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map(trade => {
            const Icon = getStrategyIcon(trade.botId)
            const iconColor = getStrategyColor(trade.botId)
            const pnlPercent = ((trade.closePrice - trade.entry) / trade.entry) * 100

            return (
              <div
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 hover:border-[#00E5FF]/30 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={iconColor} />
                    <div>
                      <p className="font-bold">{trade.symbol}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(trade.closeTime).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${
                      trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </p>
                    <p className={`text-xs ${
                      trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{trade.botId}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-800">
                    {trade.closeReason}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTrade(null)}
        >
          <div 
            className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{selectedTrade.symbol}</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Бот:</span>
                <span className="font-medium">{selectedTrade.botId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Вход:</span>
                <span className="font-medium">${selectedTrade.entry.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Выход:</span>
                <span className="font-medium">${selectedTrade.closePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Количество:</span>
                <span className="font-medium">{selectedTrade.quantity?.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P&L:</span>
                <span className={`font-bold ${
                  selectedTrade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Причина закрытия:</span>
                <span className="font-medium">{selectedTrade.closeReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Открыта:</span>
                <span className="font-medium">
                  {new Date(selectedTrade.openTime).toLocaleString('ru-RU')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Закрыта:</span>
                <span className="font-medium">
                  {new Date(selectedTrade.closeTime).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full mt-6 bg-[#00E5FF] text-black font-bold py-3 rounded-lg hover:bg-[#00D5EF] transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}