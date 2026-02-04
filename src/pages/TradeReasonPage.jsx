import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function TradeReasonPage() {
  const location = useLocation()
  const { position, analysis } = location.state || {}

  if (!position || !analysis) {
    return (
      <div className="text-white p-4">
        <p>Данные не найдены</p>
        <Link to="/" className="text-[#00E5FF]">← Назад</Link>
      </div>
    )
  }

  const { checks, context, confidence } = analysis

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">Почему AI вошёл</h1>
      </div>

      {/* Position Info */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <h2 className="text-2xl font-bold mb-2">{position.pair}</h2>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Entry: ${position.entry}</span>
          <span className="text-[#00E5FF] font-bold">Уверенность: {confidence}%</span>
        </div>
      </div>

      {/* Checks */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Проверки ({Object.values(checks).filter(Boolean).length}/{Object.keys(checks).length})</h3>
        
        <div className="space-y-3">
          <CheckItem 
            passed={checks.btcTrendOK}
            title="BTC тренд"
            description={`${context.btcTrend.trend} (${context.btcTrend.change7d > 0 ? '+' : ''}${context.btcTrend.change7d}% за неделю)`}
          />
          
          <CheckItem 
            passed={checks.btcDomOK}
            title="BTC доминация"
            description={`${context.btcDom.btc}% ${parseFloat(context.btcDom.btc) < 60 ? '(Альт-сезон)' : '(BTC сезон)'}`}
          />
          
          <CheckItem 
            passed={checks.fearGreedOK}
            title="Fear & Greed"
            description={`${context.fearGreed.value} - ${context.fearGreed.classification}`}
          />
          
          <CheckItem 
            passed={checks.correlationOK}
            title="Корреляция с BTC"
            description={`${context.correlation.correlation} (${context.correlation.strength})`}
          />
          
          <CheckItem 
            passed={checks.technicalOK}
            title="Технический анализ"
            description="RSI, MACD, EMA, ADX, Volume"
          />
          
          <CheckItem 
            passed={checks.liquidityOK}
            title="Ликвидность"
            description={`Spread: ${context.liquidity.spread}%`}
          />
          
          <CheckItem 
            passed={checks.volatilityOK}
            title="Волатильность"
            description={`${context.volatility.level} (${context.volatility.avgRange}% avg range)`}
          />
          
          <CheckItem 
            passed={checks.sessionOK}
            title="Торговая сессия"
            description={`${context.session.session} (активность: ${context.session.active})`}
          />
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">Технические детали</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Entry price</span>
            <span>${position.entry.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Take Profit</span>
            <span className="text-green-500">${position.tp.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Stop Loss</span>
            <span className="text-red-500">${position.sl.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Risk/Reward</span>
            <span className="text-[#00E5FF]">
              1:{((position.tp - position.entry) / (position.entry - position.sl)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckItem({ passed, title, description }) {
  return (
    <div className="flex items-start gap-3">
      {passed ? (
        <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
      ) : (
        <XCircle className="text-red-500 flex-shrink-0" size={20} />
      )}
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  )
}