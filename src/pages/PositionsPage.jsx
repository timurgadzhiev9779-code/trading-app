import { useState, useEffect } from 'react'
import { ArrowLeft, Clock, DollarSign, Target, Shield, Activity, Calendar } from 'lucide-react'
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
    const wsUrl = window.location.hostname === 'localhost' 
      ? 'ws://104.248.245.135:3001' 
      : 'wss://104.248.245.135:3001'
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'POSITIONS_UPDATE') {
        setPositions(message.data.positions || [])
        setPortfolio(message.data.portfolio)
      }

      if (message.type === 'PRICE_UPDATE') {
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
      
      // Сохраняем текущие цены при обновлении
      setPositions(prev => {
        const newPositions = data.positions || []
        return newPositions.map(pos => {
          const existing = prev.find(p => p.id === pos.id)
          if (existing && existing.currentPrice) {
            return { ...pos, currentPrice: existing.currentPrice }
          }
          return pos
        })
      })
      
      setLoading(false)
    } catch (err) {
      console.error('Ошибка загрузки позиций:', err)
      setLoading(false)
    }
  }

  const calculatePnL = (position) => {
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

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeInTrade = (openTime) => {
    const ms = Date.now() - openTime
    const minutes = Math.floor(ms / 60000)
    
    if (minutes < 60) return `${minutes}м`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}ч ${minutes % 60}м`
    
    const days = Math.floor(hours / 24)
    return `${days}д ${hours % 24}ч`
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
                {/* КОМПАКТНАЯ КАРТОЧКА */}
                <button
                  onClick={() => setSelectedTrade(isExpanded ? null : position)}
                  className="w-full p-3 flex items-center justify-between hover:bg-[#252525] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${hasRealPrice ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <div className="text-left">
                      <p className="font-bold">{position.symbol}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        <span>{getTimeInTrade(position.openTime)}</span>
                      </div>
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

                {/* РАЗВЕРНУТАЯ ИНФОРМАЦИЯ */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 space-y-3">
                    
                    {/* ВРЕМЯ ОТКРЫТИЯ */}
                    <div className="bg-[#0A0A0A] rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#00E5FF] mt-[1px]" />
                      
                        <p className="font-medium leading-tight">
                        {formatDateTime(position.openTime)}
                      </p>
                    </div>
                  </div>
                  
                    {/* БОТ */}
                    <div className="bg-[#0A0A0A] rounded p-2">
                      <p className="text-xs text-gray-400">Бот</p>
                      <p className="font-medium text-sm">{position.botId}</p>
                    </div>

                    {/* ЦЕНЫ */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0A0A0A] rounded p-3">
                        <p className="text-xs text-gray-400 mb-1">Вход</p>
                        <p className="font-medium">${position.entry.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#0A0A0A] rounded p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs text-gray-400">Текущая</p>
                          {hasRealPrice ? (
                            <Activity size={12} className="text-green-500" />
                          ) : (
                            <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                        <p className="font-medium">${currentPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* РАЗМЕР ПОЗИЦИИ */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Размер позиции</p>
                      <p className="font-bold text-[#00E5FF] text-lg">
                        ${(position.entry * position.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {position.quantity.toFixed(6)} {position.symbol.replace('USDT', '')}
                      </p>
                    </div>

                    

                    {/* ЦЕЛИ */}
                    <div className="bg-[#0A0A0A] rounded-lg p-3 space-y-2">
                      <h4 className="text-xs text-gray-400 font-bold uppercase mb-3">Цели</h4>
                      
                      {/* TP3 */}
                      <div className="flex items-center justify-between py-2 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-green-500" />
                          <span className="text-sm text-green-400">TP3</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${position.tp3.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            +{(((position.tp3 - position.entry) / position.entry) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* TP2 */}
                      <div className="flex items-center justify-between py-2 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-green-500" />
                          <span className="text-sm text-green-400">TP2</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${position.tp2.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            +{(((position.tp2 - position.entry) / position.entry) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* TP1 */}
                      <div className="flex items-center justify-between py-2 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-green-500" />
                          <span className="text-sm text-green-400">TP1</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${position.tp1.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            +{(((position.tp1 - position.entry) / position.entry) * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* SL */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-red-500" />
                          <span className="text-sm text-red-400">SL</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${position.sl.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {(((position.sl - position.entry) / position.entry) * 100).toFixed(2)}%
                          </p>
                        </div>
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