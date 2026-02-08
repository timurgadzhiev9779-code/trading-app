export default function TradeHistoryCard({ trade }) {
    const isProfit = trade.profit >= 0
  
    return (
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-3 border border-gray-800">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-bold">{trade.pair}</p>
            <p className="text-xs text-gray-400">
              {new Date(trade.closeTime).toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}${trade.profit}
            </p>
            <p className={`text-xs ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{trade.profitPercent}%
            </p>
          </div>
        </div>
  
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div className="bg-[#0A0A0A] p-2 rounded">
            <p className="text-gray-400">Entry</p>
            <p className="font-bold">${trade.entry}</p>
          </div>
          <div className="bg-[#0A0A0A] p-2 rounded">
            <p className="text-gray-400">Exit</p>
            <p className="font-bold">${trade.exit}</p>
          </div>
        </div>
  
        <div className="flex justify-between text-xs text-gray-400">
          <span>Amount: ${trade.amount}</span>
          <span className={`px-2 py-1 rounded ${trade.isAI ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-orange-400/10 text-orange-400'}`}>
            {trade.isAI ? 'AI' : 'Manual'}
          </span>
        </div>
      </div>
    )
  }