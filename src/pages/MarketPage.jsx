import { useState, useEffect } from 'react'
import { Search, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTopCoins, isBlocked } from '../services/coingecko'
import { SignalSkeleton } from '../components/LoadingSkeleton'

export default function MarketPage() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCoins()
  }, [])

  const loadCoins = async () => {
    const data = await getTopCoins(100)
    setCoins(data)
    setLoading(false)
  }

  const filtered = coins.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-white p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">📊 Топ-100 CoinMarketCap</h1>
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <SignalSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Топ-100 CoinMarketCap</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Поиск монеты..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-10 pr-4 py-3 placeholder-gray-400"
        />
      </div>

      {/* Coins */}
      <div className="space-y-2">
        {filtered.map((coin, i) => {
          const blocked = isBlocked(coin.symbol)
          
          return (
            <Link 
              key={i} 
              to={blocked ? '#' : `/market/${coin.symbol}`}
              className={`block ${blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800 hover:border-[#00E5FF]/30 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 text-sm min-w-[30px]">#{coin.rank}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{coin.symbol}</p>
                        {blocked && <Lock size={14} className="text-red-500" />}
                      </div>
                      <p className="text-sm text-gray-400">{coin.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${coin.price > 1 ? coin.price.toFixed(2) : coin.price.toFixed(6)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      {coin.change24h > 0 ? 
                        <TrendingUp size={14} className="text-green-500" /> : 
                        <TrendingDown size={14} className="text-red-500" />
                      }
                      <p className={`text-sm ${coin.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Market Cap */}
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Cap: ${(coin.marketCap / 1e9).toFixed(2)}B</span>
                  <span>Vol: ${(coin.volume24h / 1e6).toFixed(0)}M</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}