import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'
import TradeHistoryCard from '../components/TradeHistoryCard'

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
        <div>
        {tradeHistory.map((trade, i) => (
          <TradeHistoryCard key={i} trade={trade} />
        ))}
      </div>
      )}
    </div>
  )
}
