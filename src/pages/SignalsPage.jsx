import { useTrading } from '../context/TradingContext'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignalsPage() {
  const { aiSignals } = useTrading()
  const navigate = useNavigate()

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
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg">{s.pair}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      s.manual
                        ? 'bg-orange-400/10 text-orange-400'
                        : 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    }`}>
                      {s.manual ? 'Manual' : 'AI'}
                    </span>
                    <span className="text-sm text-gray-400">
                      Уверенность: {s.confidence}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    s.direction === 'LONG' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {s.direction}
                  </p>
                  <p className="text-gray-400 text-xs">Сейчас</p>
                </div>
              </div>

              {s.rsi && (
                <div className="flex gap-2 text-xs mb-3">
                  <span className="bg-[#0A0A0A] px-2 py-1 rounded text-gray-400">
                    RSI: <span className="text-white">{s.rsi}</span>
                  </span>
                  <span className={`bg-[#0A0A0A] px-2 py-1 rounded ${
                    s.macd === 'BULLISH' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    MACD: {s.macd}
                  </span>
                </div>
              )}

              <div className="h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${s.confidence}%` }} />
              </div>

              <div className="flex gap-2 text-xs text-gray-400 mb-3">
                <span>Entry: ${s.entry.toFixed(2)}</span>
                <span>TP: ${s.tp.toFixed(2)}</span>
                <span>SL: ${s.sl.toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate('/signal-detail', { state: { signal: s } })}
                className="w-full bg-[#00E5FF] hover:bg-[#00D5EF] text-black py-3 rounded-lg font-medium"
              >
                Посмотреть детали →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}