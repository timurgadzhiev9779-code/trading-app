import { useState, useEffect } from 'react'
import { TrendingUp, Settings, BarChart3, Shield, CheckCircle, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AI_MODES, getAllModes } from '../config/aiModes'
import { AITradingService } from '../services/aiTradingService'

export default function AIPage() {
  const [selectedMode, setSelectedMode] = useState('BALANCED')
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [aiTradingMode, setAITradingMode] = useState('BALANCED')

  useEffect(() => {
    // Загружаем режим AI трейдинга с сервера
    loadAIMode()
  }, [])
  
  const loadAIMode = async () => {
    const service = new AITradingService()
    const mode = await service.getCurrentMode()
    if (mode) {
      setAITradingMode(mode.id.toUpperCase())
    }
  }

  const handleModeChange = async (modeId) => {
    setSelectedMode(modeId)
    localStorage.setItem('ai_mode', modeId)
    
    // Отправляем на backend
    const service = new AITradingService()
    const result = await service.setMode(modeId)
    
    if (result && result.success) {
      setAITradingMode(modeId)
      console.log('✅ AI режим обновлён:', result.mode.name)
    }
    
    setShowModeSelector(false)
  }

  const currentMode = AI_MODES[selectedMode]
  const allModes = getAllModes()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">🤖 AI Управление</h1>

      {/* AI Mode Selector */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Режим работы AI</h2>
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className="text-[#00E5FF] text-sm"
          >
            {showModeSelector ? 'Свернуть' : 'Изменить'}
          </button>
        </div>

        {/* Current Mode */}
        <div
          className="bg-[#0A0A0A] rounded-lg p-4 border-2"
          style={{ borderColor: currentMode.color }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentMode.emoji}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{currentMode.name}</h3>
              <p className="text-sm text-gray-400">{currentMode.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-[#1A1A1A] rounded p-2">
              <p className="text-gray-400 mb-1">Доходность</p>
              <p className="font-bold text-green-500">{currentMode.expectedReturns.monthly}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded p-2">
              <p className="text-gray-400 mb-1">Win Rate</p>
              <p className="font-bold">{currentMode.expectedReturns.winRate}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded p-2">
              <p className="text-gray-400 mb-1">Просадка</p>
              <p className="font-bold text-red-500">{currentMode.expectedReturns.maxDrawdown}</p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        {showModeSelector && (
          <div className="mt-4 space-y-3">
            {allModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id.toUpperCase())}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedMode === mode.id.toUpperCase()
                    ? 'bg-[#0A0A0A]'
                    : 'bg-[#1A1A1A] border-gray-800 hover:border-gray-700'
                }`}
                style={{
                  borderColor: selectedMode === mode.id.toUpperCase() ? mode.color : undefined
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{mode.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">{mode.name}</h4>
                      {selectedMode === mode.id.toUpperCase() && (
                        <CheckCircle size={16} style={{ color: mode.color }} />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{mode.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-[#0A0A0A] px-2 py-1 rounded">
                        📊 {mode.expectedReturns.monthly}
                      </span>
                      <span className="bg-[#0A0A0A] px-2 py-1 rounded">
                        ✓ {mode.expectedReturns.winRate}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI Auto Trading */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-[#00E5FF]" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI Авто-Трейдинг</h2>
            <p className="text-green-500 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Активно
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0A0A0A] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Мониторинг</p>
            <p className="font-bold">5 пар</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Сделок</p>
            <p className="font-bold text-green-500">3</p>
          </div>
          <div className="bg-[#0A0A0A] rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Win Rate</p>
            <p className="font-bold text-green-500">78%</p>
          </div>
        </div>

        <Link
          to="/ai/monitoring"
          className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Settings size={18} />
          Настроить AI мониторинг
        </Link>
      </div>

      {/* Manual Monitoring */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-orange-400/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-400/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="text-orange-400" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Ручной Мониторинг</h2>
            <p className="text-gray-400 text-sm">Только уведомления</p>
          </div>
        </div>

        <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Активных сигналов</span>
            <span className="font-bold text-orange-400">2</span>
          </div>
        </div>

        <Link
          to="/ai/manual-monitoring"
          className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Settings size={18} />
          Настроить ручной мониторинг
        </Link>
      </div>

{/* Backtest */}
<Link
  to="/backtest"
  className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 mb-4 hover:border-[#00E5FF]/30 flex items-center gap-3"
>
  <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center">
    <Activity className="text-[#00E5FF]" size={24} />
  </div>
  <div className="flex-1">
    <p className="font-bold text-lg">Бэктест системы</p>
    <p className="text-gray-400 text-sm">Проверить стратегию на истории</p>
  </div>
</Link>

      {/* Current Mode Details */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">Параметры режима "{currentMode.name}"</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Размер позиции:</span>
            <span className="font-medium">{(currentMode.settings.positionSize * 100).toFixed(1)}% капитала</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Макс. позиций:</span>
            <span className="font-medium">{currentMode.settings.maxPositions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Риск на сделку:</span>
            <span className="font-medium">{(currentMode.settings.riskPerTrade * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Мин. уверенность:</span>
            <span className="font-medium">{currentMode.settings.minConfidence}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Стратегии:</span>
            <span className="font-medium">{currentMode.settings.strategies.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}