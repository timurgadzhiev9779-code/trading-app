import { useState, useEffect } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'
import { useTrading } from '../context/TradingContext'
import { aiSignals } from '../data/mockData'
import { connectPriceStream } from '../services/websocket'

export default function TradePage() {
  const { portfolio, openPosition } = useTrading()
  const [amount, setAmount] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [selectedCoin, setSelectedCoin] = useState('BTC')

  const [tpPercent, setTpPercent] = useState(3)
  const [slPercent, setSlPercent] = useState(2)

  const AVAILABLE_COINS = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'AVAX', name: 'Avalanche' },
    { symbol: 'LINK', name: 'Chainlink' },
    { symbol: 'MATIC', name: 'Polygon' },
    { symbol: 'DOT', name: 'Polkadot' },
    { symbol: 'CHESS', name: 'Chess' },
    { symbol: 'UNI', name: 'Uniswap' }
  ]

  const aiSignal = aiSignals[0]

  useEffect(() => {
    let ws
    let isCancelled = false

    try {
      ws = connectPriceStream(selectedCoin, (data) => {
        if (!isCancelled) {
          setCurrentPrice(data.price)
        }
      })
    } catch (err) {
      console.error('WS error:', err)
      if (!isCancelled) {
        setCurrentPrice(selectedCoin === 'BTC' ? 95000 : 3400)
      }
    }

    return () => {
      isCancelled = true
      if (ws) {
        ws.close()
      }
    }
  }, [selectedCoin])

  const handleTrade = () => {
    if (!amount || amount < 10) {
      alert('Минимальная сумма: $10')
      return
    }

    if (amount > portfolio.available) {
      alert('Недостаточно средств')
      return
    }

    const success = openPosition({
      pair: `${selectedCoin}/USDT`,
      type: 'LONG',
      entry: currentPrice,
      tp: currentPrice * (1 + tpPercent / 100),
      sl: currentPrice * (1 - slPercent / 100),
      amount: parseFloat(amount),
      isAI: false
    })

    if (success) {
      setAmount('')
    }
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚡ Торговля</h1>

            {/* Coin Selector */}
            <div className="mb-4">
        <label className="text-sm text-gray-400 block mb-2">Монета</label>
        <select 
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 py-3 text-white"
        >
          {AVAILABLE_COINS.map(coin => (
            <option key={coin.symbol} value={coin.symbol}>
              {coin.symbol}/USDT - {coin.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Display */}
      <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg">{selectedCoin}/USDT</p>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-sm text-gray-400">${currentPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* AI Suggestion */}
      {useAI && currentPrice > 0 && (
        <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#00E5FF]" />
            <p className="text-sm font-medium">AI Рекомендация: LONG</p>
            <span className="ml-auto text-xs text-[#00E5FF]">
              Уверенность: 78%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Current: ${currentPrice.toFixed(2)}</span>
            <span>
              TP: {(currentPrice * (1 + tpPercent / 100)).toFixed(2)}
            </span>
            <span>
              SL: {(currentPrice * (1 - slPercent / 100)).toFixed(2)}
            </span>
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

      {/* Risk Management */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Risk Management</h3>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Take Profit (%)</span>
            <span className="text-green-500">+{tpPercent}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={tpPercent}
            onChange={(e) => setTpPercent(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Stop Loss (%)</span>
            <span className="text-red-500">-{slPercent}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={slPercent}
            onChange={(e) => setSlPercent(Number(e.target.value))}
            className="w-full"
          />
        </div>
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
