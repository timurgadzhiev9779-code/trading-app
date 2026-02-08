import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'

export default function SignalsPage() {
  const { aiSignals } = useTrading()
  const [filter, setFilter] = useState('all')

  const filtered = aiSignals.filter(s => {
    if (filter === 'ai') return !s.manual
    if (filter === 'manual') return s.manual
    return true
  })

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Все сигналы</h1>
          <p className="text-xs text-gray-400">{aiSignals.length} активных</p>
        </div>
        <Link to="/signal-history" className="text-sm text-[#00E5FF]">
          История →
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all' 
              ? 'bg-[#00E5FF] text-black' 
              : 'bg-[#1A1A1A] border border-gray-800'
          }`}
        >
          Все ({aiSignals.length})
        </button>
        <button 
          onClick={() => setFilter('ai')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'ai' 
              ? 'bg-[#00E5FF] text-black' 
              : 'bg-[#1A1A1A] border border-gray-800'
          }`}
        >
          AI ({aiSignals.filter(s => !s.manual).length})
        </button>
        <button 
          onClick={() => setFilter('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'manual' 
              ? 'bg-orange-400 text-black' 
              : 'bg-[#1A1A1A] border border-gray-800'
          }`}
        >
          Manual ({aiSignals.filter(s => s.manual).length})
        </button>
      </div>

      {/* Signals */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p>Нет сигналов</p>
          <p className="text-sm mt-2">Включите AI или ручной мониторинг</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800 hover-lift">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{s.pair}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      s.manual 
                        ? 'bg-orange-400/10 text-orange-400' 
                        : 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    }`}>
                      {s.manual ? 'Manual' : 'AI'}
                    </span>
                  </div>
                  {s.rsi && (
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span>RSI: {s.rsi}</span>
                      <span>MACD: {s.macd}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${s.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {s.direction}
                  </p>
                  <p className="text-sm text-[#00E5FF]">{s.confidence}%</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">Entry</p>
                  <p className="font-bold">${s.entry.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">TP</p>
                  <p className="text-green-500 font-bold">${s.tp.toFixed(2)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">SL</p>
                  <p className="text-red-500 font-bold">${s.sl.toFixed(2)}</p>
                </div>
              </div>

              <Link 
                to="/signal-detail"
                state={{ signal: s }}
                className="block w-full bg-[#00E5FF] hover:bg-[#00D5EF] text-black py-3 rounded-lg font-medium text-center transition"
              >
                Посмотреть детали →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}