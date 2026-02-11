import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CoinGeckoAPI } from '../services/coingecko'

export default function MarketsPage() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const coinsPerPage = 100
  
  const coinGecko = new CoinGeckoAPI()

  useEffect(() => {
    loadCoins()
  }, [])

  const loadCoins = async () => {
    setLoading(true)
    const data = await coinGecko.getTopCoins(1000)
    setCoins(data)
    setLoading(false)
  }

  // Фильтрация по поиску
  const filteredCoins = searchQuery 
    ? coins.filter(coin => 
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coins

  // Пагинация
  const totalPages = Math.ceil(filteredCoins.length / coinsPerPage)
  const startIndex = (currentPage - 1) * coinsPerPage
  const endIndex = startIndex + coinsPerPage
  const currentCoins = filteredCoins.slice(startIndex, endIndex)

  // Генерация номеров страниц
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF] mx-auto mb-4"></div>
          <p>Загрузка рынков...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Рынки</h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Поиск монеты..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
        />
      </div>

      {/* Coins List */}
<div className="space-y-2">
  {currentCoins.map((coin) => (
    <div
      key={coin.id}
      className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800 hover:border-[#00E5FF]/50 transition"
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full flex-shrink-0" />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">{coin.symbol}</span>
            <span className="text-xs text-gray-500">#{coin.rank}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">{coin.name}</p>
          {/* Капитализация */}
          <p className="text-xs text-gray-500 mt-1">
            ${coin.marketCap >= 1e12 
              ? (coin.marketCap / 1e12).toFixed(2) + 'T' 
              : coin.marketCap >= 1e9 
                ? (coin.marketCap / 1e9).toFixed(2) + 'B'
                : (coin.marketCap / 1e6).toFixed(2) + 'M'
            }
          </p>
        </div>
        
        {/* Price + Change (справа, выровнено по правому краю) */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm whitespace-nowrap">
            ${coin.price < 1 ? coin.price.toFixed(6) : coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {coin.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="whitespace-nowrap">
              {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80'
              }`}
            >
              ←
            </button>

            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 rounded-lg min-w-[40px] ${
                    currentPage === page
                      ? 'bg-[#00E5FF] text-black font-bold'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              )
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80'
              }`}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}