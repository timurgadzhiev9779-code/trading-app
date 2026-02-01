import { ArrowLeft, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useTrading } from '../context/TradingContext'
import { ALLOWED_COINS } from '../services/binanceAPI'

export default function ManualMonitoringPage() {
  const { manualMonitor } = useTrading()
  const [coins, setCoins] = useState([
    { symbol: 'BTC/USDT', timeframe: '4h', enabled: true },
    { symbol: 'ETH/USDT', timeframe: '1h', enabled: true },
    { symbol: 'SOL/USDT', timeframe: '4h', enabled: false },
  ])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [editIndex, setEditIndex] = useState(null)

  // Фильтр списка
  const filteredCoins = coins.filter(coin => 
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  )

  // Доступные для добавления монеты
  const availableCoins = ALLOWED_COINS.filter(symbol => 
    !coins.find(c => c.symbol === `${symbol}/USDT`) &&
    symbol.toLowerCase().includes(addSearch.toLowerCase())
  )

  const toggleCoin = (index) => {
    const updated = [...coins]
    updated[index].enabled = !updated[index].enabled
    setCoins(updated)
  }

  const addCoin = (symbol) => {
    setCoins([...coins, { 
      symbol: `${symbol}/USDT`, 
      timeframe: '1h', 
      enabled: true 
    }])
    setShowAddModal(false)
    setAddSearch('')
  }

  const removeCoin = (index) => {
    const updated = coins.filter((_, i) => i !== index)
    setCoins(updated)
  }

  const updateTimeframe = (index, timeframe) => {
    const updated = [...coins]
    updated[index].timeframe = timeframe
    setCoins(updated)
    setEditIndex(null)
  }

  const startMonitoring = () => {
    const enabled = coins.filter(c => c.enabled)
    manualMonitor.start(enabled.map(c => ({ symbol: c.symbol, price: 0 })))
    alert('✅ Мониторинг запущен!')
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/ai"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Ручной Мониторинг</h1>
      </div>

      {/* Start Button */}
      <button
        onClick={startMonitoring}
        className="w-full bg-green-500 text-white py-3 rounded-lg font-medium mb-4"
      >
        Запустить мониторинг
      </button>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск пары..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400"
        />
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-[#00E5FF] text-black py-3 rounded-lg font-medium mb-4 flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Добавить пару
      </button>

      {/* Stats */}
      <div className="text-sm text-gray-400 mb-3">
        Активных: {coins.filter(c => c.enabled).length} из {coins.length}
      </div>

      {/* Monitoring List */}
      <div className="space-y-3">
        {filteredCoins.map((coin, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold">{coin.symbol}</p>
                <p className="text-sm text-gray-400">Timeframe: {coin.timeframe}</p>
              </div>
              <label className="relative inline-block w-12 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coin.enabled}
                  onChange={() => toggleCoin(i)}
                  className="sr-only"
                />
                <span className={`absolute inset-0 rounded-full transition ${coin.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${coin.enabled ? 'translate-x-6' : ''}`}></span>
                </span>
              </label>
            </div>

            {/* Edit Timeframe */}
            {editIndex === i ? (
              <div className="flex gap-2 mb-3">
                {['15m', '1h', '4h', '1d'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => updateTimeframe(i, tf)}
                    className={`flex-1 py-2 rounded text-sm ${coin.timeframe === tf ? 'bg-[#00E5FF] text-black' : 'bg-gray-800'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button 
                onClick={() => setEditIndex(editIndex === i ? null : i)}
                className="flex-1 bg-gray-800 py-2 rounded text-sm"
              >
                {editIndex === i ? 'Закрыть' : 'Изменить'}
              </button>
              <button 
                onClick={() => removeCoin(i)}
                className="flex-1 bg-red-500/10 text-red-500 py-2 rounded text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="mt-6 bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">Общие настройки</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Мин. уверенность AI</label>
            <input type="range" min="50" max="95" defaultValue="70" className="w-full" />
            <p className="text-right text-sm mt-1">70%</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Макс. открытых позиций</label>
            <input
              type="number"
              defaultValue="5"
              className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-xl p-4 w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Добавить пару</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="Поиск..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {availableCoins.map((symbol, i) => (
                <button
                  key={i}
                  onClick={() => addCoin(symbol)}
                  className="w-full bg-[#0A0A0A] hover:bg-[#00E5FF]/10 border border-gray-800 hover:border-[#00E5FF]/30 rounded-lg p-3 text-left transition"
                >
                  <span className="font-bold">{symbol}</span>
                  <span className="text-gray-400">/USDT</span>
                </button>
              ))}
              {availableCoins.length === 0 && (
                <p className="text-gray-400 text-center py-4">Все монеты добавлены</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}