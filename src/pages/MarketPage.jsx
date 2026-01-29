import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { coins } from '../data/mockData'

export default function MarketPage() {
  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Рынки</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Поиск монеты..."
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 placeholder-gray-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['Все', 'AI Signals', 'Gainers', 'Losers', 'Volume'].map(filter => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              filter === 'Все'
                ? 'bg-[#00E5FF] text-black'
                : 'bg-[#1A1A1A] border border-gray-800'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Coins List */}
      <div className="space-y-2">
        {coins.map((coin, i) => (
          <Link key={i} to={`/market/${coin.symbol}`} className="block">
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800 hover:border-[#00E5FF]/30 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-full flex items-center justify-center font-bold text-[#00E5FF]">
                    {coin.symbol.slice(0,2)}
                  </div>
                  <div>
                    <p className="font-bold">{coin.symbol}</p>
                    <p className="text-sm text-gray-400">{coin.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${coin.price.toLocaleString()}</p>
                  <p className={coin.change > 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                    {coin.change > 0 ? '+' : ''}{coin.change}%
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
