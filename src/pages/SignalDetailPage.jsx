import { useState } from 'react'
import { ArrowLeft, Check, X, TrendingUp } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'

export default function SignalDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { openPosition, portfolio } = useTrading()
  const signal = location.state?.signal
  
  const [amount, setAmount] = useState('')

  if (!signal) {
    return (
      <div className="text-white p-4">
        <p>Сигнал не найден</p>
        <Link to="/signals" className="text-[#00E5FF]">← Назад</Link>
      </div>
    )
  }

  const handleAccept = () => {
    if (!amount || amount <= 0) {
      alert('Введите сумму')
      return
    }
    
    const success = openPosition({
      pair: signal.pair,
      type: signal.direction,
      entry: signal.entry,
      tp: signal.tp,
      sl: signal.sl,
      amount: parseFloat(amount),
      isAI: false
    })
    
    if (success) {
      navigate('/')
    }
  }

  const handleReject = () => {
    // Можно сохранить в rejected signals
    navigate('/signals')
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/signals"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Сигнал</h1>
      </div>

      {/* Signal Info */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{signal.pair}</h2>
            <p className="text-gray-400 text-sm">
              {signal.manual ? 'Ручной мониторинг' : 'AI Трейдинг'}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${signal.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
              {signal.direction}
            </p>
            <p className="text-sm text-[#00E5FF]">{signal.confidence}%</p>
          </div>
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Entry</p>
            <p className="font-bold text-[#00E5FF]">${signal.entry.toFixed(2)}</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Take Profit</p>
            <p className="font-bold text-green-500">${signal.tp.toFixed(2)}</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-xs text-gray-400 mb-1">Stop Loss</p>
            <p className="font-bold text-red-500">${signal.sl.toFixed(2)}</p>
          </div>
        </div>

        {/* Indicators */}
        {signal.rsi && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">RSI</span>
              <span className="text-white">{signal.rsi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">MACD</span>
              <span className={signal.macd === 'BULLISH' ? 'text-green-500' : 'text-red-500'}>
                {signal.macd}
              </span>
            </div>
          </div>
        )}

        {/* Risk/Reward */}
        <div className="bg-[#0A0A0A] rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Потенциальная прибыль</span>
            <span className="text-green-500">+{((signal.tp - signal.entry) / signal.entry * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Потенциальный убыток</span>
            <span className="text-red-500">-{((signal.entry - signal.sl) / signal.entry * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Сумма сделки</h3>
        <div className="mb-2">
          <p className="text-sm text-gray-400 mb-2">Доступно: ${portfolio.available.toLocaleString()}</p>
          <input 
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3 text-xl font-bold"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map(percent => (
            <button 
              key={percent}
              onClick={() => setAmount((portfolio.available * percent / 100).toFixed(2))}
              className="bg-[#0A0A0A] border border-gray-800 py-2 rounded hover:border-[#00E5FF]"
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleReject}
          className="bg-red-500/10 border border-red-500/30 text-red-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <X size={20} />
          Отклонить
        </button>
        <button 
          onClick={handleAccept}
          className="bg-green-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Принять
        </button>
      </div>
    </div>
  )
}