import { ArrowLeft, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTrading } from '../context/TradingContext'

export default function AIMonitoringPage() {
  const { aiTrader } = useTrading()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [newCoin, setNewCoin] = useState({ symbol: '', timeframe: '4h' })
  
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('aiMonitoring')
    return saved ? JSON.parse(saved) : [
      { symbol: 'BTC/USDT', timeframe: '4h', enabled: true, minConfidence: 75 },
      { symbol: 'ETH/USDT', timeframe: '1h', enabled: true, minConfidence: 75 },
      { symbol: 'SOL/USDT', timeframe: '4h', enabled: true, minConfidence: 75 },
      { symbol: 'AVAX/USDT', timeframe: '4h', enabled: false, minConfidence: 70 },
      { symbol: 'LINK/USDT', timeframe: '1h', enabled: false, minConfidence: 70 },
      { symbol: 'SUI/USDT', timeframe: '4h', enabled: false, minConfidence: 70 },
      { symbol: 'DOT/USDT', timeframe: '4h', enabled: false, minConfidence: 70 },
      { symbol: 'UNI/USDT', timeframe: '1h', enabled: false, minConfidence: 70 },
    ]
  })

  const availableCoins = ['ADA', 'XRP', 'DOGE', 'ATOM', 'LTC', 'BCH', 'XLM', 'TRX']
  const enabledCount = coins.filter(c => c.enabled).length

  // Сортировка: активные сверху
  const sortedCoins = [...coins].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1
    if (!a.enabled && b.enabled) return 1
    return 0
  })

  useEffect(() => {
    localStorage.setItem('aiMonitoring', JSON.stringify(coins))
    
    // Обновляем AI Trader если запущен
    if (aiTrader && aiTrader.isActive) {
      const enabled = coins.filter(c => c.enabled)
      aiTrader.monitoring = enabled
    }
  }, [coins, aiTrader])

  const toggleCoin = (symbol) => {
    const index = coins.findIndex(c => c.symbol === symbol)
    const updated = [...coins]
    updated[index].enabled = !updated[index].enabled
    setCoins(updated)
    
    if (aiTrader) {
      aiTrader.monitoring = updated.filter(c => c.enabled)
    }
  }

  const updateConfidence = (symbol, value) => {
    const index = coins.findIndex(c => c.symbol === symbol)
    const updated = [...coins]
    updated[index].minConfidence = parseInt(value)
    setCoins(updated)
  }

  const updateTimeframe = (symbol, timeframe) => {
    const index = coins.findIndex(c => c.symbol === symbol)
    const updated = [...coins]
    updated[index].timeframe = timeframe
    setCoins(updated)
    setEditingIndex(null)
  }

  const removeCoin = (symbol) => {
    const coin = coins.find(c => c.symbol === symbol)
    if (confirm(`Удалить ${coin.symbol} из мониторинга?`)) {
      const updated = coins.filter(c => c.symbol !== symbol)
      setCoins(updated)
      
      if (aiTrader) {
        aiTrader.monitoring = updated.filter(c => c.enabled)
      }
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

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/ai"><ArrowLeft size={24} /></Link>
          <h1 className="text-xl font-bold">AI Мониторинг</h1>
        </div>
        <span className="text-sm text-gray-400">
          Активно: <span className="text-[#00E5FF] font-bold">{enabledCount}</span>/{coins.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Поиск пары..."
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400"
        />
      </div>

      {/* Add Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-[#00E5FF] text-black py-3 rounded-lg font-medium mb-4 flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Добавить монету
      </button>

      {/* List */}
      <div className="space-y-3">
        {sortedCoins.map((coin, i) => (
          <div key={coin.symbol} className={`bg-[#1A1A1A] rounded-xl p-4 border ${coin.enabled ? 'border-green-500/30' : 'border-gray-800'}`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold">{coin.symbol}</p>
                <p className="text-sm text-gray-400">Timeframe: {coin.timeframe}</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" checked={coin.enabled} onChange={() => toggleCoin(coin.symbol)} className="sr-only" />
                <span className={`absolute inset-0 rounded-full transition ${coin.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${coin.enabled ? 'translate-x-6' : ''}`}></span>
                </span>
              </label>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Мин. уверенность</span>
                <span className="text-[#00E5FF]">{coin.minConfidence}%</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="95" 
                value={coin.minConfidence}
                onChange={(e) => updateConfidence(coin.symbol, e.target.value)}
                className="w-full h-1 bg-gray-700 rounded"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => setEditingIndex(coin.symbol)}
                className="flex-1 bg-gray-800 py-2 rounded text-sm"
              >
                Изменить
              </button>
              <button 
                onClick={() => removeCoin(coin.symbol)}
                className="flex-1 bg-red-500/10 text-red-500 py-2 rounded text-sm"
              >
                Удалить
              </button>
            </div>

            {/* Edit Modal */}
            {editingIndex === coin.symbol && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setEditingIndex(null)}>
                <div className="bg-[#1A1A1A] w-full max-w-sm rounded-2xl p-6 m-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">{coin.symbol}</h3>
                  
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['15m', '1h', '4h', '1D'].map(tf => (
                        <button 
                          key={tf}
                          onClick={() => updateTimeframe(coin.symbol, tf)}
                          className={`py-2 rounded-lg ${coin.timeframe === tf ? 'bg-[#00E5FF] text-black' : 'bg-[#0A0A0A] border border-gray-800'}`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setEditingIndex(null)}
                    className="w-full bg-gray-800 py-3 rounded-lg"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global Settings */}
      <div className="mt-6 bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">Общие настройки</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Макс. открытых позиций</label>
            <input type="number" defaultValue="5" className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Риск на сделку (%)</label>
            <input type="number" defaultValue="2" step="0.5" className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2" />
          </div>
        </div>
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
                    className={`py-2 rounded-lg ${newCoin.timeframe === tf ? 'bg-[#00E5FF] text-black' : 'bg-[#0A0A0A] border border-gray-800'}`}
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
              <button onClick={addCoin} className="flex-1 bg-[#00E5FF] text-black py-3 rounded-lg font-medium">
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}