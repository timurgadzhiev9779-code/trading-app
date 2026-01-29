import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { coins } from '../data/mockData'

export default function CoinDetailPage() {
  const { symbol } = useParams()
  const coin = coins.find(c => c.symbol === symbol) || coins[0]

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/market"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">{coin.symbol}/USDT</h1>
      </div>

      {/* Price */}
      <div className="mb-4">
        <p className="text-4xl font-bold mb-1">${coin.price.toLocaleString()}</p>
        <p className={coin.change > 0 ? 'text-green-500' : 'text-red-500'}>
          {coin.change > 0 ? '+' : ''}{coin.change}%
        </p>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 h-48 flex items-center justify-center border border-gray-800">
        <p className="text-gray-400">График (скоро)</p>
      </div>

      {/* Timeframes */}
      <div className="flex gap-2 mb-4">
        {['15m', '1h', '4h', '1D', '1W', '1M'].map(tf => (
          <button key={tf} className={`px-3 py-1 rounded ${tf === '1D' ? 'bg-gray-700' : 'bg-[#1A1A1A]'} text-sm`}>
            {tf}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">24ч Изменение</p>
          <p className={coin.change > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {coin.change > 0 ? '+' : ''}{coin.change}%
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Объём</p>
          <p className="font-bold">${coin.volume}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Капитализация</p>
          <p className="font-bold">${coin.cap}</p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-[#00E5FF]" size={20} />
          <h3 className="font-bold">AI Анализ</h3>
          <span className="ml-auto text-sm">Уверенность: <span className="text-[#00E5FF] font-bold">78%</span></span>
        </div>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Trend</span>
            <span className="text-green-500 font-medium">BULLISH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">RSI</span>
            <span className="text-gray-300">62 (NEUTRAL)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">MACD</span>
            <span className="text-green-500">BULLISH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Support/Resistance</span>
            <span className="text-gray-300">$92,500 / $98,000</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Strong uptrend on daily timeframe with bullish momentum. Consider entries on pullbacks to $93K-94K zone.
        </p>

        <div className="flex gap-2">
          <button className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium">
            Купить
          </button>
          <button className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium">
            Добавить в мониторинг
          </button>
        </div>
      </div>
    </div>
  )
}
