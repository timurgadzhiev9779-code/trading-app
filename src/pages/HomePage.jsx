import { useState } from 'react'
import { Menu, Bell, TrendingUp, Pause } from 'lucide-react'
import { useTrading } from '../context/TradingContext'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveProfit } from '../hooks/useLiveProfit'
import { formatPrice } from '../utils/formatPrice'
import MenuSidebar from '../components/MenuSidebar'
import NotificationsPanel from '../components/NotificationsPanel'

export default function HomePage() {
  const {
    portfolio,
    positions,
    aiEnabled,
    toggleAI,
    closePosition,
    aiSignals,
    notifications
  } = useTrading()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const aiPositionsLive = useLiveProfit(positions.ai)
  const manualPositionsLive = useLiveProfit(positions.manual)

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setShowMenu(true)}>
          <Menu size={24} />
        </button>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <button onClick={() => setShowNotifications(true)} className="relative">
          <Bell size={24} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Portfolio */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <p className="text-gray-400 text-sm">Общий баланс</p>
        <h1 className="text-4xl font-bold mb-2">
          ${portfolio.balance.toLocaleString()}
        </h1>

        <div className="h-16 mb-3 flex items-end gap-1">
          {[40,45,43,48,52,50,55,58,54,60,62,58,65,68,70].map((h,i) => (
            <div key={i} className="flex-1 bg-green-500/30 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-400">Доступно</p>
            <p className="font-medium">${portfolio.available.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">P&L</p>
            <p className="text-green-500 font-medium">
              +${portfolio.pnl} (+{portfolio.pnlPercent}%)
            </p>
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

          <button
            onClick={toggleAI}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
          >
            <Pause size={16} />
            {aiEnabled ? 'Пауза' : 'Запустить'}
          </button>
        </div>
      </div>

      {/* Signals */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">🎯 Сигналы</h2>
        <span className="text-sm text-gray-400">{aiSignals.length} активных</span>
      </div>

      {aiSignals.length === 0 ? (
        <div className="bg-[#1A1A1A] rounded-xl p-6 mb-4 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            {aiEnabled ? 'AI ищет возможности...' : 'Включите AI'}
          </p>
        </div>
      ) : (
        aiSignals.slice(0, 3).map((s, i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 mb-3 border border-gray-800">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-lg">{s.pair}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    s.manual ? 'bg-orange-400/10 text-orange-400' : 'bg-[#00E5FF]/10 text-[#00E5FF]'
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

            {/* Market Context */}
            {s.context && (
              <div className="bg-[#0A0A0A] rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-400 mb-2">Рыночный контекст:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">BTC тренд: </span>
                    <span className={`font-medium ${s.context.btcTrend.trend.includes('BULL') ? 'text-green-500' : 'text-red-500'}`}>
                      {s.context.btcTrend.trend}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">BTC.D: </span>
                    <span className="font-medium">{s.context.btcDom.btc}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Fear&Greed: </span>
                    <span className={`font-medium ${
                      s.context.fearGreed.value > 50 ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {s.context.fearGreed.value}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Correlation: </span>
                    <span className="font-medium">{s.context.correlation.strength}</span>
                  </div>
                </div>
              </div>
            )}

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
              <span>Entry: {formatPrice(s.entry)}</span>
              <span>TP: {formatPrice(s.tp)}</span>
              <span>SL: {formatPrice(s.sl)}</span>
            </div>

            <button 
              onClick={() => navigate('/signal-detail', { state: { signal: s } })}
              className="w-full bg-[#00E5FF] hover:bg-[#00D5EF] text-black py-3 rounded-lg font-medium"
            >
              Торговать →
            </button>
          </div>
        ))
      )}

      <Link to="/signals" className="w-full py-3 text-[#00E5FF] text-sm font-medium block text-center">
        Смотреть все сигналы →
      </Link>

      <Link to="/history" className="w-full py-3 text-[#00E5FF] text-sm font-medium block text-center">
        История сделок →
      </Link>

      <Link 
        to="/statistics"
        className="w-full bg-[#1A1A1A] border border-gray-800 py-4 rounded-lg font-medium text-center block mt-4"
      >
        📊 Посмотреть статистику
      </Link>

      {/* Sidebars */}
      {showMenu && <MenuSidebar onClose={() => setShowMenu(false)} />}
      {showNotifications && <NotificationsPanel notifications={notifications} onClose={() => setShowNotifications(false)} />}
    </div>
  )
}