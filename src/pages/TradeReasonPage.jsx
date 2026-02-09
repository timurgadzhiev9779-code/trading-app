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

          <CheckItem 
            passed={checks.sentimentOK}
            title="Market Sentiment"
            description={`${context.sentiment?.signal || 'N/A'} (Score: ${context.sentiment?.composite || 0})`}
          />
          
          <CheckItem 
            passed={checks.advancedOK}
            title="Advanced Metrics"
            description={`Bullish Score: ${context.advanced?.bullishScore || 0}/${context.advanced?.maxScore || 7}`}
          />
        </div>
      </div>

      {/* Market Regime */}
      {position.regime && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <h3 className="font-bold mb-3">📊 Режим рынка</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Режим:</span>
            <span className="text-[#00E5FF] font-bold">{position.regime}</span>
          </div>
          {position.analysis?.context?.regime && (
            <p className="text-xs text-gray-400">
              {position.analysis.context.regime.tradingParams.description}
            </p>
          )}
        </div>
      )}
      {/* Advanced Metrics */}
      {context.advanced && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <h3 className="font-bold mb-3">🔬 Advanced Metrics</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Order Flow</span>
              <span className={`font-medium ${
                context.advanced.orderFlow.signal === 'BULLISH' ? 'text-green-500' :
                context.advanced.orderFlow.signal === 'BEARISH' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {context.advanced.orderFlow.signal}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Funding Rate</span>
              <span className="font-medium text-white">
                {context.advanced.funding.rate}% - {context.advanced.funding.signal}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Open Interest</span>
              <span className="font-medium text-[#00E5FF]">
                {context.advanced.openInterest.signal} ({context.advanced.openInterest.change}%)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Exchange Flows</span>
              <span className={`font-medium ${
                context.advanced.flows.interpretation === 'BULLISH' ? 'text-green-500' :
                context.advanced.flows.interpretation === 'BEARISH' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {context.advanced.flows.signal}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex justify-between">
              <span className="text-gray-400">Bullish Score</span>
              <span className="text-[#00E5FF] font-bold">
                {context.advanced.bullishScore}/{context.advanced.maxScore}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Sentiment Breakdown */}
      {context.sentiment && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <h3 className="font-bold mb-3">📰 Sentiment Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fear & Greed Index</span>
              <span className={`font-medium ${
                context.sentiment.breakdown.fearGreed.value > 50 ? 'text-green-500' : 'text-orange-500'
              }`}>
                {context.sentiment.breakdown.fearGreed.value} - {context.sentiment.breakdown.fearGreed.label}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">News Sentiment</span>
              <span className={`font-medium ${
                context.sentiment.breakdown.news.sentiment === 'positive' ? 'text-green-500' :
                context.sentiment.breakdown.news.sentiment === 'negative' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {context.sentiment.breakdown.news.score} - {context.sentiment.breakdown.news.sentiment}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Social Volume</span>
              <span className="font-medium text-[#00E5FF]">
                {context.sentiment.breakdown.social.volume} ({context.sentiment.breakdown.social.trend})
              </span>
            </div>
          </div>

          {/* Recent News */}
          {context.sentiment.breakdown.news.articles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Последние новости:</p>
              {context.sentiment.breakdown.news.articles.map((article, i) => (
                <a 
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#0A0A0A] p-2 rounded mb-2 text-xs hover:bg-gray-800"
                >
                  <p className="text-white line-clamp-2">{article.title}</p>
                  <p className="text-gray-500 mt-1">{article.source} • {article.published}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

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