import { useState, useEffect } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'
import { useTrading } from '../context/TradingContext'
import { aiSignals } from '../data/mockData'
import { connectPriceStream } from '../services/websocket'

export default function TradePage() {
  const { portfolio, openPosition } = useTrading()
  const [amount, setAmount] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [btcPrice, setBtcPrice] = useState(0)
  const aiSignal = aiSignals[0]

  useEffect(() => {
    let ws

    try {
      ws = connectPriceStream('BTC', (data) => {
        setBtcPrice(data.price)
      })
    } catch (err) {
      console.error('WS error:', err)
      setBtcPrice(95000) // fallback
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [])

  const handleTrade = () => {
    if (!amount || amount <= 0) {
      alert('Введите сумму')
      return
    }

    const success = openPosition({
      pair: 'BTC/USDT',
      type: 'LONG',
      entry: btcPrice,
      tp: aiSignal.tp,
      sl: aiSignal.sl,
      amount: parseFloat(amount),
      isAI: useAI
    })

    if (success) {
      setAmount('')
      alert('✅ Позиция открыта по цене $' + btcPrice.toFixed(2))
    }
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚡ Торговля</h1>

      {/* Pair */}
      <button className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg">BTC/USDT</p>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-sm text-gray-400">${btcPrice.toLocaleString()}</p>
        </div>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {/* AI Suggestion */}
      {useAI && (
        <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#00E5FF]" />
            <p className="text-sm font-medium">
              AI Рекомендация: {aiSignal.direction}
            </p>
            <span className="ml-auto text-xs text-[#00E5FF]">
              Уверенность: {aiSignal.confidence}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Current: ${btcPrice.toFixed(2)}</span>
            <span>TP: ${aiSignal.tp}</span>
            <span>SL: ${aiSignal.sl}</span>
          </div>
        </div>
      )}

      {/* Toggle AI */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">Использовать AI уровни</span>
        <label className="relative inline-block w-12 h-6">
          <input
            type="checkbox"
            checked={useAI}
            onChange={() => setUseAI(!useAI)}
            className="sr-only"
          />
          <span
            className={`absolute inset-0 rounded-full transition ${
              useAI ? 'bg-[#00E5FF]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                useAI ? 'translate-x-6' : ''
              }`}
            ></span>
          </span>
        </label>
      </div>

      {/* Amount */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Сумма (USDT)</span>
          <span>Доступно: ${portfolio.available.toLocaleString()}</span>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 py-3 text-xl font-bold mb-3"
        />
      </div>

      {/* Execute */}
      <button
        onClick={handleTrade}
        className="w-full bg-[#00E5FF] text-black py-4 rounded-lg font-bold text-lg"
      >
        Открыть сделку
      </button>
    </div>
  )
}
