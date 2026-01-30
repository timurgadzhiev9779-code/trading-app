import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { connectPriceStream } from '../services/websocket'
import { TechnicalAnalyzer } from '../services/technicalAnalysis'

export default function CoinDetailPage() {
  const { symbol } = useParams()
  const [price, setPrice] = useState(0)
  const [change, setChange] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ws = connectPriceStream(symbol, (data) => {
      setPrice(data.price)
      setChange(data.change)
    })

    // Загрузить анализ
    const analyzer = new TechnicalAnalyzer()
    analyzer.analyze(symbol).then(data => {
      setAnalysis(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })

    return () => ws.close()
  }, [symbol])

  if (loading || !analysis) {
    return (
      <div className="text-white p-4 flex items-center justify-center h-screen">
        <p className="text-gray-400">Анализ...</p>
      </div>
    )
  }

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
          <p className="text-xs text-gray-400 mb-1">24ч</p>
          <p className={change > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Тренд</p>
          <p className={`font-bold text-sm ${analysis.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
            {analysis.trend.signal}
          </p>
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
          <span className="ml-auto text-sm">
            Уверенность: <span className="text-[#00E5FF] font-bold">{analysis.confidence}%</span>
          </span>
        </div>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Trend</span>
            <span className={`font-medium ${analysis.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
              {analysis.trend.signal} ({analysis.trend.strength})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">RSI (14)</span>
            <span className={`font-medium ${
              analysis.rsi.signal === 'OVERSOLD' ? 'text-green-500' : 
              analysis.rsi.signal === 'OVERBOUGHT' ? 'text-red-500' : 'text-gray-300'
            }`}>
              {analysis.rsi.value} ({analysis.rsi.signal})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">MACD</span>
            <span className={`font-medium ${analysis.macd.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
              {analysis.macd.signal}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Support / Resistance</span>
            <span className="text-gray-300">${analysis.support} / ${analysis.resistance}</span>
          </div>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
          <p className="text-gray-400 text-sm">
            {analysis.trend.signal === 'BULLISH' 
              ? `Strong uptrend with ${analysis.trend.strength.toLowerCase()} momentum. Entry zone: $${analysis.support}`
              : `Downtrend detected. Wait for reversal above $${analysis.resistance}`
            }
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs mb-4">
          <div className="bg-[#0A0A0A] p-2 rounded text-center">
            <p className="text-gray-400 mb-1">Entry</p>
            <p className="text-[#00E5FF] font-bold">${price.toFixed(2)}</p>
          </div>
          <div className="bg-[#0A0A0A] p-2 rounded text-center">
            <p className="text-gray-400 mb-1">Target</p>
            <p className="text-green-500 font-bold">${analysis.resistance}</p>
          </div>
          <div className="bg-[#0A0A0A] p-2 rounded text-center">
            <p className="text-gray-400 mb-1">Stop</p>
            <p className="text-red-500 font-bold">${analysis.support}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to="/trade" className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium text-center">
            Купить
          </Link>
          <button className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium">
            В мониторинг
          </button>
        </div>
      </div>
    </div>
  )
}