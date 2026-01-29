import { useState } from 'react'
import { ChevronDown, TrendingUp } from 'lucide-react'
import { portfolio, coins, aiSignals } from '../data/mockData'

export default function TradePage() {
  const [amount, setAmount] = useState('')
  const [useAI, setUseAI] = useState(true)

  const btc = coins[0]
  const aiSignal = aiSignals[0]

  const percent = (amount / portfolio.available) * 100 || 0

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚡ Торговля</h1>

      {/* Pair */}
      <button className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-lg">{btc.symbol}/USDT</p>
          <p className="text-sm text-gray-400">${btc.price.toLocaleString()}</p>
        </div>
        <ChevronDown size={20} className="text-gray-400" />
      </button>

      {/* AI Suggestion */}
      {useAI && (
        <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-[#00E5FF]" />
            <p className="text-sm font-medium">AI Рекомендация: {aiSignal.direction}</p>
            <span className="ml-auto text-xs text-[#00E5FF]">Уверенность: {aiSignal.confidence}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Entry: ${aiSignal.entry}</span>
            <span>TP: ${aiSignal.tp}</span>
            <span>SL: ${aiSignal.sl}</span>
          </div>
        </div>
      )}

      {/* Toggle AI */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">Использовать AI уровни</span>
        <label className="relative inline-block w-12 h-6">
          <input type="checkbox" checked={useAI} onChange={() => setUseAI(!useAI)} className="sr-only" />
          <span className={`absolute inset-0 rounded-full transition ${useAI ? 'bg-[#00E5FF]' : 'bg-gray-600'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${useAI ? 'translate-x-6' : ''}`}></span>
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

        <input 
          type="range"
          min="0"
          max="100"
          value={percent}
          onChange={(e) => setAmount((portfolio.available * e.target.value / 100).toFixed(2))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00E5FF ${percent}%, #374151 ${percent}%)`
          }}
        />

        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>{percent.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Risk Management</h3>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Take Profit (%)</span>
            <span className="text-green-500">+3.4%</span>
          </div>
          <input type="number" defaultValue="3.4" className="w-full bg-[#0A0A0A] border border-gray-800 rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Stop Loss (%)</span>
            <span className="text-red-500">-2.2%</span>
          </div>
          <input type="number" defaultValue="2.2" className="w-full bg-[#0A0A0A] border border-gray-800 rounded px-3 py-2 text-sm" />
        </div>
      </div>

      {/* Summary (ВОЗВРАЩЕНО) */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Сводка</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Вы купите:</span>
            <span>~0.0195 BTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Потенциальная прибыль:</span>
            <span className="text-green-500">+$42.50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Макс. убыток:</span>
            <span className="text-red-500">-$27.50</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Risk/Reward:</span>
            <span className="text-[#00E5FF]">1:1.5</span>
          </div>
        </div>
      </div>

      {/* Execute */}
      <button className="w-full bg-[#00E5FF] text-black py-4 rounded-lg font-bold text-lg">
        Открыть сделку
      </button>
    </div>
  )
}
