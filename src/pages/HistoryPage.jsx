import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'

export default function HistoryPage() {
  const { tradeHistory } = useTrading()

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">История сделок</h1>
      </div>

      {tradeHistory.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">
          <p>Пока нет закрытых сделок</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tradeHistory.map((trade, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold">{trade.pair}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>{trade.type}</span>
                    <span>•</span>
                    <span>{trade.isAI ? 'AI' : 'Manual'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profit >= 0 ? '+' : ''}${trade.profit}
                  </p>
                  <p className={`text-xs ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.profit >= 0 ? '+' : ''}{trade.profitPercent}%
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Entry: ${trade.entry}</span>
                <span>Amount: ${trade.amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
