import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { connectPriceStream } from '../services/websocket'

export default function CoinDetailPage() {
  const { symbol } = useParams()
  const [price, setPrice] = useState(0)
  const [change, setChange] = useState(0)

  useEffect(() => {
    const ws = connectPriceStream(symbol, (data) => {
      setPrice(data.price)
      setChange(data.change)
    })

    return () => ws.close()
  }, [symbol])

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/market"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">{symbol}/USDT</h1>
        <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      </div>

      <div className="mb-4">
        <p className="text-4xl font-bold mb-1">${price.toLocaleString()}</p>
        <p className={change > 0 ? 'text-green-500' : 'text-red-500'}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 h-48 flex items-center justify-center border border-gray-800">
        <p className="text-gray-400">График (скоро)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">24ч Изменение</p>
          <p className={change > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Цена</p>
          <p className="font-bold text-sm">${price.toFixed(2)}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Live</p>
          <p className="text-green-500 font-bold">●</p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-[#00E5FF]" size={20} />
          <h3 className="font-bold">AI Анализ</h3>
          <span className="ml-auto text-sm">Уверенность: <span className="text-[#00E5FF] font-bold">78%</span></span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Анализ на основе текущей цены ${price.toFixed(2)}
        </p>

        <div className="flex gap-2">
          <Link to="/trade" className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium text-center">
            Купить
          </Link>
          <button className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium">
            Добавить в мониторинг
          </button>
        </div>
      </div>
    </div>
  )
}