import { Menu, Mail, TrendingUp, Pause } from 'lucide-react'
import { portfolio, aiSignals, positions } from '../data/mockData'

export default function HomePage() {
  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Menu size={24} />
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <Mail size={24} />
      </div>

      {/* Portfolio */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <p className="text-gray-400 text-sm">Общий баланс</p>
        <h1 className="text-4xl font-bold mb-2">${portfolio.balance.toLocaleString()}</h1>
        
        <div className="h-16 mb-3 flex items-end gap-1">
          {[40,45,43,48,52,50,55,58,54,60,62,58,65,68,70].map((h,i) => (
            <div key={i} className="flex-1 bg-green-500/30 rounded-t" style={{height: `${h}%`}}></div>
          ))}
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-400">Доступно</p>
            <p className="font-medium">${portfolio.available.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">P&L</p>
            <p className="text-green-500 font-medium">+${portfolio.pnl} (+{portfolio.pnlPercent}%)</p>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-[#00E5FF]" />
            </div>
            <div>
              <p className="font-medium">AI Торговля</p>
              <p className="text-green-500 text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Активно
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
            <Pause size={16} />
            Пауза
          </button>
        </div>
      </div>

      {/* Signals */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">🎯 AI Сигналы</h2>
        <span className="text-sm text-gray-400">{aiSignals.length} активных</span>
      </div>

      {aiSignals.map((s, i) => (
        <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 mb-3 border border-gray-800">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-lg">{s.pair}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-1 rounded">AI</span>
                <span className="text-sm text-gray-400">Уверенность: {s.confidence}%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-500 font-bold text-lg">+${s.profit}</p>
              <p className="text-green-500 text-sm">+{s.profitPercent}%</p>
            </div>
          </div>
          
          <div className="h-1 bg-gray-800 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-green-500" style={{width: `${s.confidence}%`}}></div>
          </div>

          <button className="w-full bg-[#00E5FF] hover:bg-[#00D5EF] text-black py-3 rounded-lg font-medium">
            Торговать →
          </button>
        </div>
      ))}

      <button className="w-full py-3 text-[#00E5FF] text-sm font-medium">
        Смотреть все сигналы →
      </button>

      {/* Positions */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">📊 Активные позиции</h2>
          <span className="text-sm text-gray-400">{positions.ai.length + positions.manual.length} открыто</span>
        </div>

        <p className="text-sm text-[#00E5FF] mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#00E5FF] rounded"></span>
          AI · {positions.ai.length} позиции
        </p>

        {positions.ai.map((p, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-3 mb-2 border border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="font-bold">{p.pair}</p>
                <p className="text-xs text-gray-400">{p.type} · {p.time}</p>
              </div>
              <div className="text-right">
                <p className="text-green-500 font-bold">+${p.profit}</p>
                <p className="text-green-500 text-xs">+{p.profitPercent}%</p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Entry: ${p.entry}</span>
              <span>TP: ${p.tp}</span>
            </div>
          </div>
        ))}

        <p className="text-sm text-orange-400 mb-2 mt-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-400 rounded"></span>
          Manual · {positions.manual.length} позиции
        </p>

        {positions.manual.map((p, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-3 mb-2 border border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{p.pair}</p>
                <p className="text-xs text-gray-400">{p.type} · {p.time}</p>
              </div>
              <div className="text-right">
                <p className="text-red-500 font-bold">${p.profit}</p>
                <p className="text-red-500 text-xs">{p.profitPercent}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}