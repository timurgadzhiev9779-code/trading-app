import { ArrowLeft, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import AddPairModal from '../components/AddPairModal'

export default function AIMonitoringPage() {
  const [showModal, setShowModal] = useState(false)

  const [coins, setCoins] = useState([
    { symbol: 'BTC/USDT', timeframe: '4h', enabled: true },
    { symbol: 'ETH/USDT', timeframe: '1h', enabled: true },
    { symbol: 'SOL/USDT', timeframe: '4h', enabled: false },
  ])

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/ai">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Ручной Мониторинг</h1>
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
        onClick={() => setShowModal(true)}
        className="w-full bg-[#00E5FF] text-black py-3 rounded-lg font-medium mb-4 flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Добавить пару
      </button>

      {/* Monitoring List */}
      <div className="space-y-3">
        {coins.map((coin, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold">{coin.symbol}</p>
                <p className="text-sm text-gray-400">Timeframe: {coin.timeframe}</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" checked={coin.enabled} className="sr-only" readOnly />
                <span className={`absolute inset-0 rounded-full transition ${coin.enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${coin.enabled ? 'translate-x-6' : ''}`}></span>
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-gray-800 py-2 rounded text-sm">Изменить</button>
              <button className="flex-1 bg-red-500/10 text-red-500 py-2 rounded text-sm">Удалить</button>
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
            <input type="number" defaultValue="5" className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2" />
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddPairModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
