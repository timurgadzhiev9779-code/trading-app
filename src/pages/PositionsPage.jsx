import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Target, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PositionsPage() {
  const navigate = useNavigate()
  const [positions, setPositions] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState(null)

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

      if (message.type === 'PRICE_UPDATE') {
        // Обновляем цены в позициях
        setPositions(prev => prev.map(p => {
          if (p.symbol === message.symbol) {
            return { ...p, currentPrice: message.price }
          }
          return p
        }))
      }

      if (message.type === 'TRADE_OPENED') {
        loadPositions()
      }

      if (message.type === 'TRADE_CLOSED') {
        loadPositions()
      }
    }

    // Обновляем каждые 5 сек
    const interval = setInterval(loadPositions, 5000)

    return () => {
      ws.close()
      clearInterval(interval)
    }
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

  const calculatePnL = (position) => {
    // Получаем текущую цену из WebSocket или fallback
    const currentPrice = position.currentPrice || position.entry
    const pnl = (currentPrice - position.entry) * position.quantity
    const pnlPercent = ((currentPrice - position.entry) / position.entry) * 100

    return { 
      pnl, 
      pnlPercent, 
      currentPrice,
      hasRealPrice: !!position.currentPrice
    }
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
            const { pnl, pnlPercent, currentPrice, hasRealPrice } = calculatePnL(position)
            const isExpanded = selectedTrade?.id === position.id

            return (
              <div key={position.id} className="bg-[#1A1A1A] rounded-xl border border-gray-800">
                {/* Компактная карточка */}
                <button
                  onClick={() => setSelectedTrade(isExpanded ? null : position)}
                  className="w-full p-3 flex items-center justify-between hover:bg-[#252525] transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <div className="text-left">
                      <p className="font-bold">{position.symbol}</p>
                      <p className="text-xs text-gray-400">{position.botId}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                </button>

                {/* Развернутая информация */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    {/* Цены */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0A0A0A] rounded p-2">
                        <p className="text-xs text-gray-400">Вход</p>
                        <p className="font-medium">${position.entry.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#0A0A0A] rounded p-2">
                        <p className="text-xs text-gray-400">Текущая</p>
                        <p className="font-medium">${currentPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Размер позиции */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                      <p className="text-xs text-gray-400 mb-1">Размер позиции</p>
                      <p className="font-bold text-[#00E5FF]">
                        ${(position.entry * position.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">{position.quantity.toFixed(6)} {position.symbol.replace('USDT', '')}</p>
                    </div>

                    {/* P&L */}
                    <div className={`rounded p-3 ${
                      pnl >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">P&L</span>
                        <div className="text-right">
  <p className={`font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
    {!hasRealPrice && (
      <span className="ml-1 text-xs text-gray-500">⏳</span>
    )}
  </p>
  <p className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
  </p>
</div>
                      </div>
                    </div>

                    {/* Цели */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-500">TP3</span>
                        <span>${position.tp3.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500">TP2</span>
                        <span>${position.tp2.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-500">TP1</span>
                        <span>${position.tp1.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-800">
                        <span className="text-red-500">SL</span>
                        <span>${position.sl.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}