import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, Lock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { connectPriceStream } from '../services/websocket'
import { TechnicalAnalyzer } from '../services/technicalAnalysis'
import { isBlocked } from '../services/coingecko'
import { formatPrice } from '../utils/formatPrice'

export default function CoinDetailPage() {
  const { symbol } = useParams()
  const blocked = isBlocked(symbol)
  const [price, setPrice] = useState(0)
  const [change, setChange] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFib, setShowFib] = useState(false)
  const [showMTF, setShowMTF] = useState(false)
  const [showML, setShowML] = useState(false)
  const [showPatterns, setShowPatterns] = useState(false)

  useEffect(() => {
    const ws = connectPriceStream(symbol, (data) => {
      setPrice(data.price)
      setChange(data.change)
    })

    const analyzer = new TechnicalAnalyzer()
    analyzer.analyzeMultiTimeframe(symbol).then(data => {
      setAnalysis(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })

    return () => ws.close()
  }, [symbol])

  if (loading || !analysis) {
    return (
      <div className="text-white p-4 flex items-center justify-center h-screen">
        <p className="text-gray-400">Анализ...</p>
      </div>
    )
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/market"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">{symbol}/USDT</h1>
        {blocked && <Lock size={18} className="text-red-500" />}
        <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      </div>

      <div className="mb-4">
        <p className="text-4xl font-bold mb-1">${price.toLocaleString()}</p>
        <p className={change > 0 ? 'text-green-500' : 'text-red-500'}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
        </p>
      </div>

      {/* Blocked Warning */}
      {blocked && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-red-500" size={20} />
            <h3 className="font-bold text-red-500">Торговля недоступна</h3>
          </div>
          <p className="text-sm text-gray-400">
            Эта монета заблокирована из-за высокого риска (дериватив или проблемный актив).
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-[#1A1A1A] rounded-xl mb-4 border border-gray-800 overflow-hidden">
        <iframe
          src={`https://s.tradingview.com/embed-widget/advanced-chart/?symbol=BINANCE:${symbol}USDT&interval=60&theme=dark&style=1&locale=ru&backgroundColor=rgba(26,26,26,1)&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&calendar=0&hide_volume=0&support_host=https://www.tradingview.com`}
          style={{ width: '100%', height: '400px', border: 'none' }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">24ч</p>
          <p className={change > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Тренд</p>
          <p className={`font-bold text-sm ${analysis.current.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
            {analysis.current.trend.signal}
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Live</p>
          <p className="text-green-500 font-bold">●</p>
        </div>
      </div>

      {/* Multi-Timeframe */}
      <div className="bg-[#1A1A1A] rounded-xl mb-4 border border-gray-800">
        <button 
          onClick={() => setShowMTF(!showMTF)}
          className="w-full p-4 flex justify-between items-center"
        >
          <h3 className="font-bold">Multi-Timeframe Analysis</h3>
          <span className="text-gray-400">{showMTF ? '▲' : '▼'}</span>
        </button>
        
        {showMTF && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-[#0A0A0A] p-2 rounded text-center">
                <p className="text-gray-400 mb-1">1H</p>
                <p className={`font-bold ${analysis.current.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.current.trend.signal}
                </p>
                <p className="text-gray-400 text-xs mt-1">RSI: {analysis.current.rsi.value}</p>
              </div>
              <div className="bg-[#0A0A0A] p-2 rounded text-center">
                <p className="text-gray-400 mb-1">4H</p>
                <p className={`font-bold ${analysis.h4.trend === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.h4.trend}
                </p>
                <p className="text-gray-400 text-xs mt-1">RSI: {analysis.h4.rsi}</p>
              </div>
              <div className="bg-[#0A0A0A] p-2 rounded text-center">
                <p className="text-gray-400 mb-1">1D</p>
                <p className={`font-bold ${analysis.d1.trend === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                  {analysis.d1.trend}
                </p>
                <p className="text-gray-400 text-xs mt-1">RSI: {analysis.d1.rsi}</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className={`text-xs px-3 py-1 rounded ${analysis.alignment === 'ALIGNED' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                {analysis.alignment === 'ALIGNED' ? '✓ Timeframes Aligned' : '⚠ Mixed Signals'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ML Prediction */}
      {analysis.current.mlPrediction && (
        <div className="bg-[#1A1A1A] rounded-xl mb-4 border border-[#00E5FF]/30">
          <button 
            onClick={() => setShowML(!showML)}
            className="w-full p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold">🧠 ML Прогноз</h3>
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                Обучена
              </span>
              {analysis.current.mlPrediction.multiTF && (
                <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-500">
                  Multi-TF
                </span>
              )}
              {analysis.current.mlPrediction.ensemble && (
                <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-500">
                  Ensemble
                </span>
              )}
            </div>
            <span className="text-gray-400">{showML ? '▲' : '▼'}</span>
          </button>
          
          {showML && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400">Направление:</span>
                <span className={`text-xl font-bold ${
                  analysis.current.mlPrediction.direction === 'UP' ? 'text-green-500' : 
                  analysis.current.mlPrediction.direction === 'DOWN' ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {analysis.current.mlPrediction.direction}
                </span>
              </div>
              
              {analysis.current.mlPrediction.multiTF && (
                <div className="mb-3 text-xs text-gray-400">
                  Анализ: 15m, 1h, 4h, 1D, 1W → Комплексное решение
                </div>
              )}
              
              {/* Ensemble Voting */}
              {analysis.current.mlPrediction.ensemble && analysis.current.mlPrediction.votes && (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Голосование моделей:</p>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {Object.entries(analysis.current.mlPrediction.votes).map(([model, probs]) => (
                      <div key={model} className="bg-[#0A0A0A] p-2 rounded text-center">
                        <p className="text-gray-500 mb-1 uppercase text-[10px]">{model}</p>
                        <p className={`font-bold ${probs[2] > 0.5 ? 'text-green-500' : probs[0] > 0.5 ? 'text-red-500' : 'text-gray-400'}`}>
                          {(probs[2] * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-[#0A0A0A] p-2 rounded text-center">
                  <p className="text-gray-400 mb-1">Up</p>
                  <p className="text-green-500 font-bold">
                    {(analysis.current.mlPrediction.probability.up * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded text-center">
                  <p className="text-gray-400 mb-1">Flat</p>
                  <p className="text-gray-400 font-bold">
                    {(analysis.current.mlPrediction.probability.flat * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded text-center">
                  <p className="text-gray-400 mb-1">Down</p>
                  <p className="text-red-500 font-bold">
                    {(analysis.current.mlPrediction.probability.down * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patterns */}
      {analysis.current.patterns && analysis.current.patterns.all.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-xl mb-4 border border-gray-800">
          <button 
            onClick={() => setShowPatterns(!showPatterns)}
            className="w-full p-4 flex justify-between items-center"
          >
            <h3 className="font-bold">📊 Обнаруженные паттерны</h3>
            <span className="text-gray-400">{showPatterns ? '▲' : '▼'}</span>
          </button>
          
          {showPatterns && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {analysis.current.patterns.all.map((pattern, i) => (
                  <div key={i} className="bg-[#0A0A0A] p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{pattern.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          pattern.type.includes('BULLISH') ? 'bg-green-500/20 text-green-500' :
                          pattern.type.includes('BEARISH') ? 'bg-red-500/20 text-red-500' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {pattern.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">Сила: {pattern.strength}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{pattern.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Общий счёт:</span>
                  <span className={`font-bold ${
                    analysis.current.patterns.score > 0 ? 'text-green-500' : 
                    analysis.current.patterns.score < 0 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {analysis.current.patterns.score > 0 ? '+' : ''}{analysis.current.patterns.score}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fibonacci Levels - Collapsible */}
      <div className="bg-[#1A1A1A] rounded-xl mb-4 border border-gray-800">
        <button 
          onClick={() => setShowFib(!showFib)}
          className="w-full p-4 flex justify-between items-center"
        >
          <h3 className="font-bold">Fibonacci Levels</h3>
          <span className="text-gray-400">{showFib ? '▲' : '▼'}</span>
        </button>
        
        {showFib && (
          <div className="px-4 pb-4 space-y-2 text-sm">
            {[
              { level: 'High', value: analysis.current.fibonacci.high, color: 'text-red-400' },
              { level: '23.6%', value: analysis.current.fibonacci.fib236, color: 'text-orange-400' },
              { level: '38.2%', value: analysis.current.fibonacci.fib382, color: 'text-yellow-400' },
              { level: '50%', value: analysis.current.fibonacci.fib500, color: 'text-blue-400' },
              { level: '61.8%', value: analysis.current.fibonacci.fib618, color: 'text-green-400' },
              { level: '78.6%', value: analysis.current.fibonacci.fib786, color: 'text-emerald-400' },
              { level: 'Low', value: analysis.current.fibonacci.low, color: 'text-cyan-400' }
            ].map((fib, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-400">{fib.level}</span>
                <span className={`font-mono ${fib.color}`}>{formatPrice(fib.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Analysis - только если НЕ заблокирован */}
      {!blocked && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-[#00E5FF]" size={20} />
            <h3 className="font-bold">AI Анализ</h3>
            <span className="ml-auto text-sm">
              Уверенность: <span className="text-[#00E5FF] font-bold">{analysis.current.confidence}%</span>
            </span>
          </div>
          
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Trend</span>
              <span className={`font-medium ${analysis.current.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                {analysis.current.trend.signal} ({analysis.current.trend.strength})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">RSI (14)</span>
              <span className={`font-medium ${
                analysis.current.rsi.signal === 'OVERSOLD' ? 'text-green-500' : 
                analysis.current.rsi.signal === 'OVERBOUGHT' ? 'text-red-500' : 'text-gray-300'
              }`}>
                {analysis.current.rsi.value} ({analysis.current.rsi.signal})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">MACD</span>
              <span className={`font-medium ${analysis.current.macd.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                {analysis.current.macd.signal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ADX (Trend Strength)</span>
              <span className={`font-medium ${
                analysis.current.trendStrength.signal === 'STRONG' ? 'text-green-500' : 
                analysis.current.trendStrength.signal === 'MODERATE' ? 'text-yellow-500' : 'text-gray-300'
              }`}>
                {analysis.current.trendStrength.adx} ({analysis.current.trendStrength.signal})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volatility (ATR)</span>
              <span className="text-gray-300">
                {analysis.current.volatility.atr} ({analysis.current.volatility.level})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume</span>
              <span className={`font-medium ${analysis.current.volume.signal === 'HIGH' ? 'text-green-500' : 'text-gray-300'}`}>
                {analysis.current.volume.current} ({analysis.current.volume.signal})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Support / Resistance</span>
              <span className="text-gray-300">${analysis.current.support} / ${analysis.current.resistance}</span>
            </div>
          </div>

          <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-sm">
              {analysis.current.trend.signal === 'BULLISH' 
                ? `Strong uptrend with ${analysis.current.trend.strength.toLowerCase()} momentum. Entry zone: $${analysis.current.support}`
                : `Downtrend detected. Wait for reversal above $${analysis.current.resistance}`
              }
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs mb-4">
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400 mb-1">Entry</p>
              <p className="text-[#00E5FF] font-bold">${price.toFixed(2)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400 mb-1">Target</p>
              <p className="text-green-500 font-bold">${analysis.current.resistance}</p>
            </div>
            <div className="bg-[#0A0A0A] p-2 rounded text-center">
              <p className="text-gray-400 mb-1">Stop</p>
              <p className="text-red-500 font-bold">${analysis.current.support}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/trade" className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium text-center">
              Купить
            </Link>
            <button className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-medium">
              В мониторинг
            </button>
          </div>
        </div>
      )}
    </div>
  )
}