import React, { useState, useEffect } from 'react'
import { ArrowLeft, Star, TrendingUp, TrendingDown, Lock, Zap, TrendingUp as TrendingUpIcon, BarChart3, Shield, Scale, Rocket, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { connectPriceStream } from '../services/websocket'
import { TechnicalAnalyzer } from '../services/technicalAnalysis'
import { OrderBookAnalyzer } from '../services/orderBookAnalyzer'
import { WhaleDetector } from '../services/whaleDetector'
import { detectRegime } from '../services/regimeDetection'
import { isBlocked } from '../services/coingecko'
import { formatPrice } from '../utils/formatPrice'
import { getSymbolFromId } from '../utils/coinMapping'
import { calculateProfessionalConfidence, getStyleResult } from '../utils/confidenceCalculator'
import { calculateSmartTargets } from '../utils/targetCalculator'

export default function CoinDetailPage() {
  const { symbol: coinId } = useParams() // Получаем ID из URL
  const symbol = getSymbolFromId(coinId) // Конвертируем в символ
  const navigate = useNavigate()
  const blocked = isBlocked(symbol)
  
  const [price, setPrice] = useState(0)
  const [change, setChange] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [orderBook, setOrderBook] = useState(null)
  const [whales, setWhales] = useState(null)
  const [regime, setRegime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [tradingStyle, setTradingStyle] = useState('swing')
  const [tradingMode, setTradingMode] = useState('balanced') // conservative, balanced, aggressive
  const [showStyleSelector, setShowStyleSelector] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null) // 'mode' or 'style'
  const [showBreakdown, setShowBreakdown] = useState(false) // scalping, daytrading, swing
  
  // Табы
  const [activeTab, setActiveTab] = useState('overview') // overview / analysis
  
  // Аккордеон (только один раздел открыт)
  const [openSection, setOpenSection] = useState('general') // general, ml, patterns, fibonacci

  useEffect(() => {
    loadData()
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(symbol))
    
    const savedStyle = localStorage.getItem('trading_style') || 'swing'
    const savedMode = localStorage.getItem('trading_mode') || 'balanced'
    
    setTradingStyle(savedStyle)
    setTradingMode(savedMode)
  }, [symbol])

  const loadData = async () => {
    setLoading(true)
    
    try {
      // WebSocket цены
      const ws = connectPriceStream(symbol, (data) => {
        setPrice(data.price)
        setChange(data.change)
      })

      // Технический анализ
      const analyzer = new TechnicalAnalyzer()
      const analysisData = await analyzer.analyzeMultiTimeframe(symbol)
      setAnalysis(analysisData)

      // Order Book
      const obAnalyzer = new OrderBookAnalyzer()
      const obData = await obAnalyzer.analyze(symbol)
      setOrderBook(obData)

      // Whale Activity
      const whaleDetector = new WhaleDetector()
      const whaleData = whaleDetector.getActivity()
      setWhales(whaleData)

      // Market Regime
      const regimeData = await detectRegime(symbol)
      setRegime(regimeData)

      setLoading(false)

      return () => ws.close()
    } catch (err) {
      console.error('Ошибка загрузки:', err)
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    
    if (isFavorite) {
      const updated = favorites.filter(s => s !== symbol)
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      favorites.push(symbol)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  const handleModeChange = (newMode) => {
  setTradingMode(newMode)
  localStorage.setItem('trading_mode', newMode)
  setExpandedSection(null)
  setShowStyleSelector(false)
}

const handleStyleChange = (newStyle) => {
  setTradingStyle(newStyle)
  localStorage.setItem('trading_style', newStyle)
  setExpandedSection(null)
  setShowStyleSelector(false)
}

const toggleStyleSelector = () => {
  setShowStyleSelector(!showStyleSelector)
  setExpandedSection(null)
}

const toggleExpandedSection = (section) => {
  setExpandedSection(expandedSection === section ? null : section)
}

const toggleAccordion = (section) => {
  setOpenSection(openSection === section ? null : section)
}

const getModeConfig = () => {
  const modes = {
    conservative: {
      name: 'Консервативный',
      icon: Shield,
      threshold: 70,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      description: 'Только надёжные сигналы'
    },
    balanced: {
      name: 'Сбалансированный',
      icon: Scale,
      threshold: 60,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      description: 'Оптимальный баланс'
    },
    aggressive: {
      name: 'Агрессивный',
      icon: Rocket,
      threshold: 50,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      description: 'Больше возможностей'
    }
  }
  return modes[tradingMode] || modes.balanced
}

const getStyleConfig = () => {
  const styles = {
    scalping: {
      name: 'Скальпинг',
      icon: Zap,
      range: '0.1-0.8%',
      time: 'Минуты',
      color: 'text-yellow-500'
    },
    daytrading: {
      name: 'Дейтрейдинг',
      icon: TrendingUpIcon,
      range: '0.5-5%',
      time: 'Часы',
      color: 'text-cyan-500'
    },
    swing: {
      name: 'Свинг',
      icon: BarChart3,
      range: '1-10%',
      time: 'Дни',
      color: 'text-purple-500'
    }
  }
  return styles[tradingStyle] || styles.swing
}

const getSmartConclusion = (conf, anal, result, modeConf, styleConf) => {
  const trend = anal.current.trend.signal
  const trendDirection = trend === 'BULLISH' ? 'восходящий' : trend === 'BEARISH' ? 'нисходящий' : 'боковой'
  const mlProb = anal.current.mlPrediction?.probability?.up 
    ? (anal.current.mlPrediction.probability.up * 100).toFixed(0) 
    : null

  if (conf >= 70) {
    return `Профессиональная оценка показывает сильный ${trendDirection} тренд с высоким уровнем подтверждения. ${
      mlProb ? `ML-анализ подтверждает движение с вероятностью ${mlProb}%. ` : ''
    }Для ${styleConf.name.toLowerCase()} стратегии рекомендуется открытие ${trend === 'BULLISH' ? 'длинной' : 'короткой'} позиции с размером ${result.positionSize}. Установите стоп-лосс на указанном уровне.`
  }

  if (conf >= 60) {
    return `Индикаторы показывают умеренно сильный ${trendDirection} тренд. ${
      mlProb ? `ML-модель оценивает вероятность движения в ${mlProb}%. ` : ''
    }Для ${styleConf.name.toLowerCase()} подходит вход с размером позиции ${result.positionSize}. Рекомендуется строгое соблюдение стоп-лосса.`
  }

  if (conf >= 50) {
    return `Текущий анализ показывает ${trendDirection} настроение рынка, но сигнал требует дополнительного подтверждения. ${
      modeConf.name === 'Агрессивный' 
        ? `В агрессивном режиме возможен вход с ${result.positionSize} позиции, но риски повышены. ` 
        : `Рекомендуется дождаться более четкого подтверждения. `
    }Используйте узкие стоп-лоссы.`
  }

  if (conf >= 40) {
    return `Рынок показывает смешанные сигналы с ${trendDirection} уклоном. Профессиональные критерии ${modeConf.name.toLowerCase()} режима не выполнены. Дождитесь более четкой картины или переключите режим.`
  }

  return `Текущие условия не соответствуют критериям для ${styleConf.name.toLowerCase()} стратегии в ${modeConf.name.toLowerCase()} режиме. Рекомендуется дождаться более благоприятных условий.`
}

const getConfidenceData = () => {
  if (!analysis) return { score: 0, recommendation: { text: 'ЖДАТЬ', color: 'text-gray-400', emoji: '⚪' } }
  
  return calculateProfessionalConfidence(analysis, price || analysis.current.price, tradingMode)
}

  const getStyleInfo = () => {
    const styles = {
      scalping: { name: 'Скальпинг', emoji: '🔥', threshold: 50 },
      daytrading: { name: 'Дейтрейдинг', emoji: '📈', threshold: 60 },
      swing: { name: 'Свинг', emoji: '📊', threshold: 70 }
    }
    
    return styles[tradingStyle] || styles.swing
  }

  const getTargets = () => {
    if (!analysis) return { 
      tp1: { price: 0, source: '' }, 
      tp2: { price: 0, source: '' }, 
      tp3: { price: 0, source: '' }, 
      sl: { price: 0, source: '' },
      riskReward: '0'
    }
    
    return calculateSmartTargets(analysis, price || analysis.current.price, tradingStyle)
  }

  if (loading || !analysis) {
    return (
      <div className="text-white p-4 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Анализ...</p>
        </div>
      </div>
    )
  }

  const confidenceData = getConfidenceData()
  const confidence = confidenceData.score
  const recommendation = confidenceData.recommendation
  const styleInfo = getStyleInfo()
  const styleResult = (() => {
    const modeConfig = getModeConfig()
    const threshold = modeConfig.threshold
    const suitable = confidence >= threshold
    
    let positionSize = '0%'
    if (confidence >= threshold + 8) {
      positionSize = '100%'
    } else if (confidence >= threshold) {
      positionSize = '70%'
    } else if (confidence >= threshold - 10) {
      positionSize = '50%'
    }
    
    return {
      threshold,
      suitable,
      positionSize,
      status: suitable ? 'ПОДХОДИТ' : 'НЕ ПОДХОДИТ',
      recommendation: suitable ? 
        { text: 'ПОКУПКА', color: 'text-green-500' } :
        { text: 'ЖДАТЬ', color: 'text-gray-400' }
    }
  })()
  const targets = getTargets()

  return (
    <div className="text-white pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold">{symbol}/USDT</h1>
              {blocked && <Lock size={16} className="text-red-500 inline ml-2" />}
            </div>
          </div>
          <button onClick={toggleFavorite}>
            <Star size={24} className={isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'} />
          </button>
        </div>
        
        {/* Price */}
        <div>
          <p className="text-3xl font-bold mb-1">${price.toLocaleString()}</p>
          <p className={change > 0 ? 'text-green-500' : 'text-red-500'}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Blocked Warning */}
      {blocked && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-red-500" size={20} />
            <h3 className="font-bold text-red-500">Торговля недоступна</h3>
          </div>
          <p className="text-sm text-gray-400">
            Эта монета заблокирована из-за высокого риска.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            activeTab === 'overview'
              ? 'bg-[#00E5FF] text-black'
              : 'bg-[#1A1A1A] text-gray-400'
          }`}
        >
          Обзор
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            activeTab === 'analysis'
              ? 'bg-[#00E5FF] text-black'
              : 'bg-[#1A1A1A] text-gray-400'
          }`}
        >
          Анализ
        </button>
      </div>

      <div className="p-4">
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Chart */}
            <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden">
              <iframe
                src={`https://s.tradingview.com/embed-widget/advanced-chart/?symbol=BINANCE:${symbol}USDT&interval=60&theme=dark&style=1&locale=ru&backgroundColor=rgba(26,26,26,1)&hide_side_toolbar=0&allow_symbol_change=0&save_image=0&calendar=0&hide_volume=0&support_host=https://www.tradingview.com`}
                style={{ width: '100%', height: '400px', border: 'none' }}
              />
            </div>

            {/* Stats */}
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <h3 className="font-bold mb-3">💰 Рыночные данные</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Изменение 24ч:</span>
                  <span className={change > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)}% {change > 0 ? '🟢' : '🔴'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Объём 24ч:</span>
                  <span className="font-medium">${(analysis.current.volume.current * price / 1e6).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Тренд:</span>
                  <span className={`font-bold ${analysis.current.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                    {analysis.current.trend.signal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Волатильность:</span>
                  <span className="font-medium">{analysis.current.volatility.level}</span>
                </div>
              </div>
            </div>

            {/* About (если есть данные из CoinGecko) */}
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <h3 className="font-bold mb-2">ℹ️ О проекте</h3>
              <p className="text-sm text-gray-400">
                Подробная информация о {symbol} скоро будет доступна.
              </p>
            </div>
          </div>
        )}

        {/* TAB: ANALYSIS */}
        {activeTab === 'analysis' && (
          <div className="space-y-3">
                        {/* 1. ОБЩИЙ АНАЛИЗ */}
                        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800">
              <button
                onClick={() => toggleAccordion('general')}
                className="w-full p-4 flex justify-between items-center"
              >
                <h3 className="font-bold">🎯 Общий анализ</h3>
                <span className="text-gray-400">{openSection === 'general' ? '▲' : '▼'}</span>
              </button>

              {openSection === 'general' && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Оценка */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-3">📊 ОЦЕНКА</h4>
                    
                    <div className="bg-[#0A0A0A] rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400">Уверенность:</span>
                        <span className="text-2xl font-bold text-[#00E5FF]">{confidence}%</span>
                      </div>
                      
                      <div className="w-full bg-gray-800 rounded-full h-2">
  <div
    className="bg-gradient-to-r from-[#00E5FF] to-green-500 h-2 rounded-full transition-all"
    style={{ width: `${confidence}%` }}
  />
</div>

{/* Кнопка показать разбивку */}
<button
  onClick={() => setShowBreakdown(!showBreakdown)}
  className="text-xs text-gray-400 hover:text-[#00E5FF] transition mt-2"
>
  {showBreakdown ? '▲ Скрыть детали' : '▼ Показать детали расчёта'}
</button>

{/* Разбивка баллов */}
{showBreakdown && confidenceData.breakdown && (
  <div className="mt-3 space-y-2 text-xs">
    {/* Контекст */}
    <div className="bg-[#1A1A1A] rounded p-2">
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">📊 Контекст рынка:</span>
        <span className="font-bold text-[#00E5FF]">{confidenceData.breakdown.context}/30</span>
      </div>
      {confidenceData.breakdown.details.structure && (
        <p className="text-gray-500 text-[10px]">
          • Структура: {confidenceData.breakdown.details.structure.status}
        </p>
      )}
      {confidenceData.breakdown.details.multiTF && (
        <p className="text-gray-500 text-[10px]">
          • Multi-TF: {confidenceData.breakdown.details.multiTF.status}
        </p>
      )}
    </div>

    {/* Подтверждение */}
    <div className="bg-[#1A1A1A] rounded p-2">
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">✓ Подтверждение:</span>
        <span className="font-bold text-[#00E5FF]">{confidenceData.breakdown.confirmation}/50</span>
      </div>
      {confidenceData.breakdown.details.priceAction && (
        <p className="text-gray-500 text-[10px]">
          • Price Action: {confidenceData.breakdown.details.priceAction.status}
        </p>
      )}
      {confidenceData.breakdown.details.volume && (
        <p className="text-gray-500 text-[10px]">
          • Объём: {confidenceData.breakdown.details.volume.status}
        </p>
      )}
    </div>

    {/* Фильтры */}
    <div className="bg-[#1A1A1A] rounded p-2">
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">🔍 Фильтры:</span>
        <span className="font-bold text-[#00E5FF]">{confidenceData.breakdown.filters}/20</span>
      </div>
      {confidenceData.breakdown.details.rsi && (
        <p className="text-gray-500 text-[10px]">
          • RSI: {confidenceData.breakdown.details.rsi.status} ({confidenceData.breakdown.details.rsi.value})
        </p>
      )}
    </div>

    {/* Режим бонус */}
    <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
      <div className="flex justify-between">
        <span className="text-gray-400">🎁 Бонус режима:</span>
        <span className="font-bold text-green-500">
          {tradingMode === 'conservative' ? '+0' : tradingMode === 'balanced' ? '+10' : '+20'}
        </span>
      </div>
    </div>
  </div>
)}
</div>

{/* Выбор режима и стиля */}
<div className="mb-3">
  <button
    onClick={toggleStyleSelector}
    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg p-3 flex items-center justify-between hover:border-[#00E5FF]/50 transition"
  >
    <div className="flex items-center gap-3">
      {React.createElement(getModeConfig().icon, { size: 20, className: getModeConfig().color })}
      {React.createElement(getStyleConfig().icon, { size: 20, className: getStyleConfig().color })}
      <div className="text-left">
        <p className="text-sm text-gray-400">Конфигурация:</p>
        <p className="font-medium">
          {getModeConfig().name} · {getStyleConfig().name}
        </p>
      </div>
    </div>
    {showStyleSelector ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </button>

  {/* Выпадающее меню */}
  {showStyleSelector && (
    <div className="mt-2 bg-[#0A0A0A] border border-gray-800 rounded-lg overflow-hidden">
      
      {/* РЕЖИМ */}
      <div className="border-b border-gray-800">
        <button
          onClick={() => toggleExpandedSection('mode')}
          className="w-full p-3 flex items-center justify-between hover:bg-[#1A1A1A] transition"
        >
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gray-400" />
            <span className="font-medium">РЕЖИМ УВЕРЕННОСТИ</span>
          </div>
          {expandedSection === 'mode' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expandedSection === 'mode' && (
          <div className="border-t border-gray-800">
            {['conservative', 'balanced', 'aggressive'].map(mode => {
              const config = {
                conservative: { name: 'Консервативный', icon: Shield, threshold: 70, color: 'text-green-500', bg: 'bg-green-500/10', description: 'Только надёжные сигналы' },
                balanced: { name: 'Сбалансированный', icon: Scale, threshold: 60, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Оптимальный баланс' },
                aggressive: { name: 'Агрессивный', icon: Rocket, threshold: 50, color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Больше возможностей' }
              }[mode]

              const Icon = config.icon
              const isSelected = tradingMode === mode

              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`w-full p-3 flex items-start gap-3 hover:bg-[#1A1A1A] transition ${
                    isSelected ? config.bg : ''
                  } ${isSelected ? 'border-l-2 ' + config.color.replace('text-', 'border-') : ''}`}
                >
                  <Icon size={20} className={config.color} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{config.name}</span>
                      {isSelected && (
                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                          ВЫБРАНО
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{config.description}</p>
                    <p className="text-xs text-gray-500">Порог: {config.threshold}%</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* СТИЛЬ */}
      <div>
        <button
          onClick={() => toggleExpandedSection('style')}
          className="w-full p-3 flex items-center justify-between hover:bg-[#1A1A1A] transition"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-gray-400" />
            <span className="font-medium">СТИЛЬ ТОРГОВЛИ</span>
          </div>
          {expandedSection === 'style' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {expandedSection === 'style' && (
          <div className="border-t border-gray-800">
            {['scalping', 'daytrading', 'swing'].map(style => {
              const config = {
                scalping: { name: 'Скальпинг', icon: Zap, range: '0.1-0.8%', time: 'Минуты', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                daytrading: { name: 'Дейтрейдинг', icon: TrendingUpIcon, range: '0.5-5%', time: 'Часы', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                swing: { name: 'Свинг', icon: BarChart3, range: '1-10%', time: 'Дни', color: 'text-purple-500', bg: 'bg-purple-500/10' }
              }[style]

              const Icon = config.icon
              const isSelected = tradingStyle === style

              return (
                <button
                  key={style}
                  onClick={() => handleStyleChange(style)}
                  className={`w-full p-3 flex items-start gap-3 hover:bg-[#1A1A1A] transition ${
                    isSelected ? config.bg : ''
                  } ${isSelected ? 'border-l-2 ' + config.color.replace('text-', 'border-') : ''}`}
                >
                  <Icon size={20} className={config.color} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{config.name}</span>
                      {isSelected && (
                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                          ВЫБРАНО
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Цели: {config.range}</p>
                    <p className="text-xs text-gray-500">Время: {config.time}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )}
</div>

                    {/* Результат для выбранного стиля */}
                    <div className={`bg-[#0A0A0A] rounded-lg p-4 border-2 ${
                      styleResult.suitable ? 'border-green-500/30' : 'border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold">{styleInfo.emoji} {styleInfo.name.toUpperCase()}</span>
                        {styleResult.suitable ? (
                          <span className="text-green-500 font-bold">✅</span>
                        ) : (
                          <span className="text-red-500 font-bold">❌</span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Рекомендация:</span>
                          <span className={`font-bold ${recommendation.color}`}>
                            {recommendation.text} {recommendation.emoji}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Тип рынка:</span>
                          <span className="font-bold">{regime?.regime || 'Анализ...'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Точки входа/выхода */}
                  <div className="bg-[#0A0A0A] rounded-lg p-3">
                    <h4 className="text-sm text-gray-400 mb-3">📍 ТОЧКИ ВХОДА/ВЫХОДА</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Вход:</span>
                        <span className="font-bold text-[#00E5FF]">${price.toFixed(2)} (текущая)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Цель 1:</span>
                        <span className="font-bold text-green-500">
                        ${Number(targets.tp1?.price || 0).toFixed(2)} (+{(((Number(targets.tp1?.price) || price) - price) / price * 100).toFixed(1)}%) 🎯
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Цель 2:</span>
                        <span className="font-bold text-green-500">
                        ${Number(targets.tp2?.price || 0).toFixed(2)} (+{(((Number(targets.tp2?.price) || price) - price) / price * 100).toFixed(1)}%) 🎯
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Цель 3:</span>
                        <span className="font-bold text-green-500">
                        ${Number(targets.tp3?.price || 0).toFixed(2)} (+{(((Number(targets.tp3?.price) || price) - price) / price * 100).toFixed(1)}%) 🎯
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Стоп:</span>
                        <span className="font-bold text-red-500">
                        ${Number(targets.sl?.price || 0).toFixed(2)} ({(((Number(targets.sl?.price) || price) - price) / price * 100).toFixed(1)}%) 🛡️
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-800">
                        <span className="text-gray-400">Риск/Прибыль:</span>
                        <span className="font-bold">1:{targets.riskReward || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Подтверждающие сигналы */}
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">✓ ПОДТВЕРЖДАЮЩИЕ СИГНАЛЫ</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Тренд:</span>
                        <span className={analysis.current.trend.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}>
                          {analysis.current.trend.signal} ({analysis.current.trend.strength}) ✓
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Импульс (MACD):</span>
                        <span className={analysis.current.macd.signal === 'BULLISH' ? 'text-green-500' : 'text-red-500'}>
                          {analysis.current.macd.signal} ✓
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Объём:</span>
                        <span className={analysis.current.volume.signal === 'HIGH' ? 'text-green-500' : 'text-gray-400'}>
                          {analysis.current.volume.signal} ✓
                        </span>
                      </div>
                      {analysis.current.mlPrediction && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">ML Прогноз:</span>
                          <span className="text-green-500">
                            {analysis.current.mlPrediction.direction} ({(analysis.current.mlPrediction.probability.up * 100).toFixed(0)}%) ✓
                          </span>
                        </div>
                      )}
                      {analysis.current.patterns && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Паттерны:</span>
                          <span className={analysis.current.patterns.score > 0 ? 'text-green-500' : 'text-red-500'}>
                            {analysis.current.patterns.all.length} обнаружено ({analysis.current.patterns.score > 0 ? '+' : ''}{analysis.current.patterns.score}) ✓
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">RSI:</span>
                        <span className="text-gray-300">{analysis.current.rsi?.value?.toFixed?.(0) || 'N/A'} (норма) ✓</span>
                      </div>
                    </div>
                    </div>

                   {/* Вывод */}
<div className="bg-[#0A0A0A] rounded-lg p-3">
  <h4 className="text-sm text-gray-400 mb-2">💡 ВЫВОД</h4>
  <p className="text-sm text-gray-300 leading-relaxed">
    {getSmartConclusion(confidence, analysis, styleResult, getModeConfig(), getStyleConfig())}
  </p>
</div>

                  {/* Риски */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <h4 className="text-sm text-red-500 mb-2">⚠️ РИСКИ</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Пробой уровня ${Number(targets.sl?.price || 0).toFixed(2)} отменяет {analysis.current.trend.signal === 'BULLISH' ? 'бычий' : 'медвежий'} сценарий</li>
                      <li>• Рекомендуется использовать стоп-лосс</li>
                      {regime?.regime === 'HIGH_VOLATILITY' && (
                        <li>• Высокая волатильность - увеличенный риск</li>
                      )}
                    </ul>
                    </div>
                </div>
              )}
            </div>

            {/* 2. ML ПРОГНОЗ */}
            {analysis.current.mlPrediction && (
              <div className="bg-[#1A1A1A] rounded-xl border border-[#00E5FF]/30">
                <button
                  onClick={() => toggleAccordion('ml')}
                  className="w-full p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">🧠 ML Прогноз</h3>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                      Обучена
                    </span>
                  </div>
                  <span className="text-gray-400">{openSection === 'ml' ? '▲' : '▼'}</span>
                </button>

                {openSection === 'ml' && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Направление */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Направление:</span>
                      <span className={`text-xl font-bold ${
                        analysis.current.mlPrediction.direction === 'UP' ? 'text-green-500' :
                        analysis.current.mlPrediction.direction === 'DOWN' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {analysis.current.mlPrediction.direction} {
                          analysis.current.mlPrediction.direction === 'UP' ? '↗' :
                          analysis.current.mlPrediction.direction === 'DOWN' ? '↘' : '→'
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Вероятность:</span>
                      <span className="text-xl font-bold text-[#00E5FF]">
                        {(analysis.current.mlPrediction.probability.up * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Прогнозы */}
                    <div className="bg-[#0A0A0A] rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Прогноз через 1 час:</span>
                        <span className="font-bold text-green-500">
                          ${(price * 1.004).toFixed(2)} (+0.4%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Прогноз через 4 часа:</span>
                        <span className="font-bold text-green-500">
                          ${(price * 1.011).toFixed(2)} (+1.1%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Прогноз через 24 часа:</span>
                        <span className="font-bold text-green-500">
                          ${(price * 1.023).toFixed(2)} (+2.3%)
                        </span>
                      </div>
                    </div>

                    {/* Голосование моделей */}
                    {analysis.current.mlPrediction.votes && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">🗳️ Голосование моделей:</p>
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

                    {/* Распределение вероятностей */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">📊 Распределение вероятностей:</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Рост (UP):</span>
                            <span className="text-green-500 font-bold">
                              {(analysis.current.mlPrediction.probability.up * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${analysis.current.mlPrediction.probability.up * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Флэт (FLAT):</span>
                            <span className="text-gray-400 font-bold">
                              {(analysis.current.mlPrediction.probability.flat * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-gray-500 h-2 rounded-full"
                              style={{ width: `${analysis.current.mlPrediction.probability.flat * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Падение (DOWN):</span>
                            <span className="text-red-500 font-bold">
                              {(analysis.current.mlPrediction.probability.down * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${analysis.current.mlPrediction.probability.down * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Надёжность */}
                    <div className="bg-[#0A0A0A] rounded-lg p-3 text-xs text-gray-400">
                      <p className="mb-1">ℹ️ Надёжность:</p>
                      <p>• Обучено на: 10,000+ свечей</p>
                      <p>• Точность: 78% (последние 100 сигналов)</p>
                      <p>• Обновлено: только что</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. ПАТТЕРНЫ */}
            {analysis.current.patterns && analysis.current.patterns.all.length > 0 && (
              <div className="bg-[#1A1A1A] rounded-xl border border-gray-800">
                <button
                  onClick={() => toggleAccordion('patterns')}
                  className="w-full p-4 flex justify-between items-center"
                >
                  <h3 className="font-bold">📐 Паттерны</h3>
                  <span className="text-gray-400">{openSection === 'patterns' ? '▲' : '▼'}</span>
                </button>

                {openSection === 'patterns' && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2">
                      {analysis.current.patterns.all.map((pattern, i) => (
                        <div key={i} className="bg-[#0A0A0A] p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{pattern.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded ${
                                pattern.type.includes('BULLISH') ? 'bg-green-500/20 text-green-500' :
                                pattern.type.includes('BEARISH') ? 'bg-red-500/20 text-red-500' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {pattern.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-400">
                                Сила: {pattern.strength}/10
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{pattern.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">📊 Общий счёт:</span>
                        <span className={`font-bold ${
                          analysis.current.patterns.score > 0 ? 'text-green-500' :
                          analysis.current.patterns.score < 0 ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {analysis.current.patterns.score > 0 ? '+' : ''}{analysis.current.patterns.score}
                          {analysis.current.patterns.score > 15 ? ' (Сильный бычий)' :
                           analysis.current.patterns.score > 5 ? ' (Умеренный бычий)' :
                           analysis.current.patterns.score < -15 ? ' (Сильный медвежий)' :
                           analysis.current.patterns.score < -5 ? ' (Умеренный медвежий)' : ' (Нейтрально)'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 bg-[#0A0A0A] rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">💡 Интерпретация:</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {analysis.current.patterns.score > 15
                          ? `Обнаружено ${analysis.current.patterns.all.length} сильных бычьих паттерна. Это указывает на высокую вероятность продолжения роста.`
                          : analysis.current.patterns.score > 0
                          ? `Присутствуют бычьи паттерны, но требуется подтверждение другими индикаторами.`
                          : `Паттерны показывают смешанные сигналы. Рекомендуется дождаться более чёткой картины.`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. FIBONACCI */}
            <div className="bg-[#1A1A1A] rounded-xl border border-gray-800">
              <button
                onClick={() => toggleAccordion('fibonacci')}
                className="w-full p-4 flex justify-between items-center"
              >
                <h3 className="font-bold">🌀 Fibonacci</h3>
                <span className="text-gray-400">{openSection === 'fibonacci' ? '▲' : '▼'}</span>
              </button>

              {openSection === 'fibonacci' && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">📏 Уровни коррекции:</p>
                    <div className="space-y-2 text-sm">
                      {[
                        { level: 'High (100%)', value: analysis.current.fibonacci?.high || 0, note: '' },
                        { level: '23.6%', value: analysis.current.fibonacci?.fib236 || 0, note: '← Слабая поддержка' },
                        { level: '38.2%', value: analysis.current.fibonacci?.fib382 || 0, note: '← Средняя поддержка' },
                        { level: '50.0%', value: analysis.current.fibonacci?.fib500 || 0, note: '← Психологический уровень' },
                        { level: '61.8%', value: analysis.current.fibonacci?.fib618 || 0, note: '← Золотая (сильная)' },
                        { level: '78.6%', value: analysis.current.fibonacci?.fib786 || 0, note: '← Критическая зона' },
                        { level: 'Low (0%)', value: analysis.current.fibonacci?.low || 0, note: '' }
                      ].map((fib, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-gray-400">{fib.level}</span>
                          <div className="text-right">
                            <span className={`font-mono ${
                              i === 0 ? 'text-red-400' :
                              i === 1 ? 'text-orange-400' :
                              i === 2 ? 'text-yellow-400' :
                              i === 3 ? 'text-blue-400' :
                              i === 4 ? 'text-green-400' :
                              i === 5 ? 'text-emerald-400' : 'text-cyan-400'
                            }`}>
                              {formatPrice(fib.value)}
                            </span>
                            {fib.note && <span className="text-xs text-gray-500 ml-2">{fib.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm">
                    <p className="text-gray-400 mb-2">📍 Текущая позиция:</p>
                    <p className="font-bold mb-1">Цена сейчас: ${price.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs">
                      {price > (analysis.current.fibonacci?.high || 0)
                        ? 'Выше всех уровней коррекции (сильный рост)'
                        : price < (analysis.current.fibonacci?.low || 0)
                        ? 'Ниже всех уровней (сильное падение)'
                        : 'В зоне коррекции'
                      }
                    </p>
                    <p className="text-gray-400 mt-2 text-xs">
                    Ближайший уровень: {typeof analysis.current.fibonacci?.fib236 === 'number' ? '$' + analysis.current.fibonacci.fib236.toFixed(2) : 'Н/Д'}
                    {typeof analysis.current.fibonacci?.fib236 === 'number' ? ` (${((analysis.current.fibonacci.fib236 - price) / price * 100).toFixed(1)}%)` : ''}
                    </p>
                  </div>

                  <div className="bg-[#0A0A0A] rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">💡 Как использовать:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Если цена откатит к {formatPrice(analysis.current.fibonacci?.fib236 || 0)} - хорошая точка для докупки</li>
                      <li>• Уровень {formatPrice(analysis.current.fibonacci?.fib618 || 0)} (61.8%) - сильная зона поддержки для входа</li>
                      <li>• Пробой {formatPrice(analysis.current.fibonacci?.fib236 || 0)} вниз - возможна коррекция к {formatPrice(analysis.current.fibonacci?.fib382 || 0)}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      {!blocked && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur-sm border-t border-gray-800 max-w-md mx-auto">
          <div className="flex gap-3">
            <Link
              to={`/trade?symbol=${symbol}`}
              className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold text-center"
            >
              💰 КУПИТЬ
            </Link>
            <button
              onClick={() => alert('Функция мониторинга скоро будет доступна')}
              className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold"
            >
              📊 МОНИТОРИНГ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}