import { ArrowLeft, Plus, Search, Play, Pause } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTrading } from '../context/TradingContext'

export default function ManualMonitoringPage() {
  const { manualMonitor } = useTrading()
  
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem('manualMonitorActive') === 'true'
  })
  
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('manualMonitoring')
    return saved ? JSON.parse(saved) : [
      { symbol: 'BTC/USDT', timeframe: '4h', enabled: true, minConfidence: 70 },
      { symbol: 'ETH/USDT', timeframe: '1h', enabled: true, minConfidence: 70 },
      { symbol: 'SOL/USDT', timeframe: '4h', enabled: false, minConfidence: 70 },
      { symbol: 'AVAX/USDT', timeframe: '1h', enabled: false, minConfidence: 70 },
    ]
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [newCoin, setNewCoin] = useState({ symbol: '', timeframe: '4h' })

  useEffect(() => {
    localStorage.setItem('manualMonitoring', JSON.stringify(coins))
  }, [coins])

  useEffect(() => {
    localStorage.setItem('manualMonitorActive', isActive)
  }, [isActive])

  useEffect(() => {
    if (isActive && manualMonitor) {
      const enabled = coins.filter(c => c.enabled)
      if (enabled.length > 0) {
        manualMonitor.start(enabled.map(c => ({ symbol: c.symbol, price: 95000 })))
      }
    }
  }, [])

  const enabledCount = coins.filter(c => c.enabled).length

  const toggleMonitoring = () => {
    if (!isActive) {
      const enabled = coins.filter(c => c.enabled)
      if (enabled.length === 0) {
        alert('Выберите хотя бы одну монету')
        return
      }
      manualMonitor.start(enabled.map(c => ({ symbol: c.symbol, price: 95000 })))
      setIsActive(true)
    } else {
      manualMonitor.stop()
      setIsActive(false)
    }
  }

  const toggleCoin = (index) => {
    const updated = [...coins]
    updated[index].enabled = !updated[index].enabled
    setCoins(updated)
  }

  const updateConfidence = (index, value) => {
    const updated = [...coins]
    updated[index].minConfidence = parseInt(value)
    setCoins(updated)
  }

  const updateTimeframe = (index, timeframe) => {
    const updated = [...coins]
    updated[index].timeframe = timeframe
    setCoins(updated)
    setEditingIndex(null)
  }

  const removeCoin = (index) => {
    if (confirm(`Удалить ${coins[index].symbol}?`)) {
      setCoins(coins.filter((_, i) => i !== index))
    }
  }

  const addCoin = () => {
    if (!newCoin.symbol) return
    setCoins([...coins, {
      symbol: `${newCoin.symbol}/USDT`,
      timeframe: newCoin.timeframe,
      enabled: false,
      minConfidence: 70
    }])
    setShowAddModal(false)
    setNewCoin({ symbol: '', timeframe: '4h' })
  }

  const availableCoins = ['ADA', 'XRP', 'DOGE', 'ATOM', 'LTC', 'BCH', 'XLM', 'TRX']
  const sortedCoins = [...coins].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1
    if (!a.enabled && b.enabled) return 1
    return 0
  })

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/ai"><ArrowLeft size={24} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Ручной Мониторинг</h1>
          <p className="text-xs text-gray-400">Только сигналы, торгуете сами</p>
        </div>
      </div>

      {/* Status + Control */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-orange-400/30">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-bold">Статус</p>
            <p className={`text-sm ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
              {isActive ? '● Активен' : '○ Остановлен'}
            </p>
          </div>
          <button 
            onClick={toggleMonitoring}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
              isActive ? 'bg-red-500/20 text-red-500' : 'bg-green-500 text-white'
            }`}
          >
            {isActive ? <><Pause size={16} /> Остановить</> : <><Play size={16} /> Запустить</>}
          </button>
        </div>
        <div className="text-sm text-gray-400">
          Активно: <span className="text-orange-400 font-bold">{enabledCount}</span>/{coins.length} монет
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Поиск монеты..."
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400"
        />
      </div>

      {/* Add Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-orange-400 text-black py-3 rounded-lg font-medium mb-4 flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Добавить монету
      </button>

      {/* Coins List */}
      <div className="space-y-3">
        {sortedCoins.map((coin, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold">{coin.symbol}</p>
                <p className="text-sm text-gray-400">Timeframe: {coin.timeframe}</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" checked={coin.enabled} onChange={() => toggleCoin(i)} className="sr-only" />
                <span className={`absolute inset-0 rounded-full transition ${coin.enabled ? 'bg-orange-400' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${coin.enabled ? 'translate-x-6' : ''}`}></span>
                </span>
              </label>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Мин. уверенность</span>
                <span className="text-orange-400">{coin.minConfidence}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="95" 
                value={coin.minConfidence}
                onChange={(e) => updateConfidence(i, e.target.value)}
                className="w-full h-1 bg-gray-700 rounded"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => setEditingIndex(i)}
                className="flex-1 bg-gray-800 py-2 rounded text-sm"
              >
                Изменить
              </button>
              <button 
                onClick={() => removeCoin(i)}
                className="flex-1 bg-red-500/10 text-red-500 py-2 rounded text-sm"
              >
                Удалить
              </button>
            </div>

            {/* Edit Modal */}
            {editingIndex === i && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setEditingIndex(null)}>
                <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl p-6 m-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{coin.symbol}</h3>
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['15m', '1h', '4h', '1D'].map(tf => (
                        <button 
                          key={tf}
                          onClick={() => updateTimeframe(i, tf)}
                          className={`py-2 rounded-lg ${coin.timeframe === tf ? 'bg-orange-400 text-black' : 'bg-[#0A0A0A] border border-gray-800'}`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setEditingIndex(null)} className="w-full bg-gray-800 py-3 rounded-lg">
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl p-6 m-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Добавить монету</h3>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Монета</label>
              <select 
                value={newCoin.symbol}
                onChange={(e) => setNewCoin({...newCoin, symbol: e.target.value})}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3 text-white"
              >
                <option value="">Выберите монету</option>
                {availableCoins.map(c => (
                  <option key={c} value={c}>{c}/USDT</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
              <div className="grid grid-cols-4 gap-2">
                {['15m', '1h', '4h', '1D'].map(tf => (
                  <button 
                    key={tf}
                    onClick={() => setNewCoin({...newCoin, timeframe: tf})}
                    className={`py-2 rounded-lg ${newCoin.timeframe === tf ? 'bg-orange-400 text-black' : 'bg-[#0A0A0A] border border-gray-800'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-800 py-3 rounded-lg">
                Отмена
              </button>
              <button onClick={addCoin} className="flex-1 bg-orange-400 text-black py-3 rounded-lg font-medium">
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}