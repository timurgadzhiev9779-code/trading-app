import { ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'
import { formatPrice } from '../utils/formatPrice'

export default function SignalHistoryPage() {
  const { signalHistory } = useTrading()

  const accepted = signalHistory.filter(s => s.decision === 'ACCEPTED')
  const rejected = signalHistory.filter(s => s.decision === 'REJECTED')

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/signals"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">История сигналов</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Всего</p>
          <p className="text-2xl font-bold">{signalHistory.length}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Принято</p>
          <p className="text-2xl font-bold text-green-500">{accepted.length}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Отклонено</p>
          <p className="text-2xl font-bold text-red-500">{rejected.length}</p>
        </div>
      </div>

      {/* History List */}
      {signalHistory.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <Clock size={48} className="mx-auto mb-4 opacity-50" />
          <p>История пока пуста</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signalHistory.map((signal, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{signal.pair}</p>
                  <p className="text-xs text-gray-400">{signal.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  {signal.decision === 'ACCEPTED' ? (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded flex items-center gap-1">
                      <CheckCircle size={12} /> Принято
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded flex items-center gap-1">
                      <XCircle size={12} /> Отклонено
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${signal.manual ? 'bg-orange-400/10 text-orange-400' : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>
                  {signal.manual ? 'Manual' : 'AI'}
                </span>
                <span className="text-sm text-gray-400">
                  {signal.direction} • {signal.confidence}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">Entry</p>
                  <p className="font-bold">{formatPrice(signal.entry)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">TP</p>
                  <p className="text-green-500 font-bold">{formatPrice(signal.tp)}</p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded">
                  <p className="text-gray-400">SL</p>
                  <p className="text-red-500 font-bold">{formatPrice(signal.sl)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}