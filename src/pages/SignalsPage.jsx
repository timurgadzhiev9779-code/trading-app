import { useTrading } from '../context/TradingContext'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SignalsPage() {
  const { aiSignals, openPosition, portfolio } = useTrading()

  const handleTrade = (signal) => {
    openPosition({
      pair: signal.pair,
      type: signal.direction,
      entry: signal.entry,
      tp: signal.tp,
      sl: signal.sl,
      amount: Math.min(portfolio.available * 0.05, 500),
      isAI: false // Ручная торговля по сигналу
    })
    alert('✅ Позиция открыта!')
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Все сигналы</h1>
      </div>

      {aiSignals.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p>Нет активных сигналов</p>
          <p className="text-sm mt-2">Включите AI на главном экране</p>
        </div>
      ) : (
        <div className="space-y-3">
          {aiSignals.map((s, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{s.pair}</p>
                  <span className="text-xs bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-1 rounded">
                    AI {s.confidence}%
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-green-500 font-bold">{s.direction}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">Entry</p>
                  <p className="font-bold">${s.entry.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">TP</p>
                  <p className="font-bold text-green-500">${s.tp.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">SL</p>
                  <p className="font-bold text-red-500">${s.sl.toFixed(2)}</p>
                </div>
              </div>

              <button 
                onClick={() => handleTrade(s)}
                className="w-full bg-[#00E5FF] text-black py-2 rounded-lg font-medium"
              >
                Торговать
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}