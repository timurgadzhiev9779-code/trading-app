import { useState } from 'react'
import { TrendingUp, X } from 'lucide-react'

export default function PositionActionsModal({ position, onClose, onPartialClose, onTrailingStop }) {
  const [percentage, setPercentage] = useState(50)

  if (!position) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end" onClick={onClose}>
      <div className="bg-[#1A1A1A] w-full max-w-md mx-auto rounded-t-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{position.pair}</h3>
          <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
        </div>

                {/* Current Info */}
                <div className="bg-[#0A0A0A] rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Entry</p>
              <p className="font-bold">${position.entry?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400">Current</p>
              <p className="font-bold">${position.currentPrice?.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400">P&L</p>
              <p className={`font-bold ${parseFloat(position.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(position.profit || 0) >= 0 ? '+' : ''}${position.profit || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Amount</p>
              <p className="font-bold">${position.amount?.toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">Открыто</p>
              <p className="font-bold">{new Date(position.openTime).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>

        {/* Partial Close */}
        <div className="mb-4">
          <h4 className="font-bold mb-3">Частичное закрытие</h4>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Закрыть</span>
              <span className="text-[#00E5FF]">{percentage}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="10"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <button 
            onClick={() => {
              onPartialClose(position.pair, position.isAI, percentage, position.currentPrice)
              onClose()
            }}
            className="w-full bg-orange-400 text-black py-3 rounded-lg font-medium"
          >
            Закрыть {percentage}% (${(position.amount * percentage / 100).toFixed(2)})
          </button>
        </div>

        {/* Trailing Stop */}
        <button 
          onClick={() => {
            onTrailingStop(position.pair, position.isAI)
            onClose()
          }}
          className="w-full bg-[#00E5FF] text-black py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-3"
        >
          <TrendingUp size={20} />
          Активировать Trailing Stop
        </button>

        {/* Close Full */}
        <button 
          onClick={() => {
            onPartialClose(position.pair, position.isAI, 100, position.currentPrice)
            onClose()
          }}
          className="w-full bg-red-500/20 border border-red-500/30 text-red-500 py-3 rounded-lg font-medium"
        >
          Закрыть полностью
        </button>
      </div>
    </div>
  )
}