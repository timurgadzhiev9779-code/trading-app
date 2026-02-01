import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAllPrices } from '../services/binanceAPI'

export default function MarketPage() {
  const [coins, setCoins] = useState([])
  const [originalCoins, setOriginalCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState(null)

  const formatPrice = (price) => {
    if (!price) return '0'
    
    if (price >= 1000) {
      return price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } else if (price >= 1) {
      return price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } else if (price >= 0.01) {
      return price.toLocaleString('ru-RU', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    } else {
      return price.toLocaleString('ru-RU', { minimumFractionDigits: 8, maximumFractionDigits: 8 })
    }
  }

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const data = await getAllPrices()
        setCoins(data)
        setOriginalCoins(data)
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredCoins = (sortDirection === null ? originalCoins : coins)
    .filter(coin => {
      return coin.symbol.toLowerCase().includes(search.toLowerCase()) ||
             coin.name.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => {
      if (sortDirection === 'down') return b.change - a.change
      if (sortDirection === 'up') return a.change - b.change
      return 0
    })

  const toggleSort = () => {
    if (sortDirection === null) setSortDirection('down')
    else if (sortDirection === 'down') setSortDirection('up')
    else setSortDirection('down')
  }

  const resetSort = () => {
    setSortDirection(null)
  }

  if (loading) {
    return (
      <div className="text-white p-4 flex items-center justify-center h-screen">
        <p className="text-gray-400">Загрузка цен...</p>
      </div>
    )
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Рынки</h1>

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

      <div className="flex gap-2 mb-4">
        <button 
          onClick={resetSort}
          className={`px-4 py-2 rounded-lg text-sm ${sortDirection === null ? 'bg-[#00E5FF] text-black' : 'bg-[#1A1A1A] text-gray-400'}`}
        >
          Все
        </button>
        <button 
          onClick={toggleSort}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${sortDirection !== null ? 'bg-[#00E5FF] text-black' : 'bg-[#1A1A1A] text-gray-400'}`}
        >
          24ч %
          {sortDirection === 'down' && <ChevronDown size={16} />}
          {sortDirection === 'up' && <ChevronUp size={16} />}
          {sortDirection === null && <ChevronDown size={16} className="opacity-50" />}
        </button>
      </div>

      <div className="text-sm text-gray-400 mb-3">
        Найдено: {filteredCoins.length} монет
        {sortDirection === 'down' && ' • Сначала растущие'}
        {sortDirection === 'up' && ' • Сначала падающие'}
      </div>

      <div className="space-y-2">
        {filteredCoins.map((coin, i) => (
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
                  <p className="font-bold">${formatPrice(coin.price)}</p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${coin.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.change > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {coin.change > 0 ? '+' : ''}{coin.change?.toFixed(2)}%
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