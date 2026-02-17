import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Target, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PositionsPage() {
  const navigate = useNavigate()
  const [positions, setPositions] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPositions()

    // WebSocket подключение
    const ws = new WebSocket('wss://104.248.245.135:3001')

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'POSITIONS_UPDATE') {
        setPositions(message.data.positions || [])
        setPortfolio(message.data.portfolio)
      }

      if (message.type === 'TRADE_OPENED') {
        loadPositions()
      }

      if (message.type === 'TRADE_CLOSED') {
        loadPositions()
      }
    }

    return () => ws.close()
  }, [])

  const loadPositions = async () => {
    try {
      const response = await fetch('/api/positions')
      const data = await response.json()
      setPositions(data.positions || [])
      setLoading(false)
    } catch (err) {
      console.error('Ошибка загрузки позиций:', err)
      setLoading(false)
    }
  }

  const calculatePnL = (position, currentPrice) => {
    const pnl = (currentPrice - position.entry) * position.quantity
    const pnlPercent = ((currentPrice - position.entry) / position.entry) * 100
    return { pnl, pnlPercent }
  }

  const getTimeInTrade = (openTime) => {
    const minutes = Math.floor((Date.now() - openTime) / 60000)
    if (minutes < 60) return `${minutes}м`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}ч`
    const days = Math.floor(hours / 24)
    return `${days}д`
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Открытые позиции</h1>
          <p className="text-sm text-gray-400">Мониторинг в реальном времени</p>
        </div>
      </div>

      {/* Portfolio Stats */}
      {portfolio && (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">БАЛАНС</p>
              <p className="text-xl font-bold">${portfolio.totalBalance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">P&L СЕГОДНЯ</p>
              <p className={`text-xl font-bold ${
                portfolio.todayPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {portfolio.todayPnL >= 0 ? '+' : ''}${portfolio.todayPnL.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
        </div>
      )}

      {/* No Positions */}
      {!loading && positions.length === 0 && (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-8 text-center">
          <p className="text-gray-400">Нет открытых позиций</p>
          <p className="text-sm text-gray-500 mt-2">Боты ищут сигналы...</p>
        </div>
      )}

      {/* Positions List */}
      {!loading && positions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            АКТИВНЫЕ СДЕЛКИ ({positions.length})
          </h2>

          {positions.map(position => {
            // Здесь нужно получить текущую цену (заглушка)
            const currentPrice = position.entry * 1.002 // +0.2% для примера
            const { pnl, pnlPercent } = calculatePnL(position, currentPrice)

            return (
              <div
                key={position.id}
                className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-bold">{position.symbol}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-500">
                      {position.side}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {getTimeInTrade(position.openTime)}
                  </div>
                </div>

                {/* Bot Info */}
                <div className="text-xs text-gray-400 mb-3">
                  Бот: {position.botId}
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#0A0A0A] rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-1">Вход</p>
                    <p className="font-medium">${position.entry.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-1">Текущая</p>
                    <p className="font-medium">${currentPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* P&L */}
                <div className={`rounded-lg p-3 mb-3 ${
                  pnl >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className={pnl >= 0 ? 'text-green-500' : 'text-red-500'} />
                      <span className="text-xs text-gray-400">P&L</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </p>
                      <p className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Targets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-green-500">
                      <Target size={12} />
                      <span>TP3</span>
                    </div>
                    <span className="font-medium">${position.tp3.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-green-500">
                      <Target size={12} />
                      <span>TP2</span>
                    </div>
                    <span className="font-medium">${position.tp2.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-green-500">
                      <Target size={12} />
                      <span>TP1</span>
                    </div>
                    <span className="font-medium">${position.tp1.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                    <div className="flex items-center gap-1 text-red-500">
                      <Shield size={12} />
                      <span>SL</span>
                    </div>
                    <span className="font-medium">${position.sl.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}