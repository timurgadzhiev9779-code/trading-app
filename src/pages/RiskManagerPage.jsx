import { useState, useEffect } from 'react'
import { ArrowLeft, Shield, AlertTriangle, TrendingDown, Lock, RefreshCw, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function RiskManagerPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedSettings, setEditedSettings] = useState({})

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadStatus = async () => {
    try {
      const statusRes = await fetch('/api/risk-manager/status')
      const statusData = await statusRes.json()
      setStatus(statusData)

      const settingsRes = await fetch('/api/risk-manager/settings')
      const settingsData = await settingsRes.json()
      setSettings(settingsData)
      setEditedSettings(settingsData)

      setLoading(false)
    } catch (err) {
      console.error('Ошибка загрузки Risk Manager:', err)
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      await fetch('/api/risk-manager/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedSettings)
      })
      setEditing(false)
      loadStatus()
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err)
    }
  }

  const resetLosses = async () => {
    try {
      await fetch('/api/risk-manager/reset-losses', { method: 'POST' })
      loadStatus()
    } catch (err) {
      console.error('Ошибка сброса:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
      </div>
    )
  }

  const isBlocked = status?.blocked
  const dailyLossPercent = parseFloat(status?.stats?.dailyLoss || 0)
  const drawdownPercent = parseFloat(status?.stats?.currentDrawdown || 0)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Risk Manager</h1>
          <p className="text-sm text-gray-400">Защита капитала</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="p-2 bg-[#1A1A1A] border border-gray-800 rounded-lg hover:border-[#00E5FF]/30 transition"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border-2 p-4 mb-6 ${
        isBlocked 
          ? 'bg-red-500/10 border-red-500/30' 
          : 'bg-green-500/10 border-green-500/30'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {isBlocked ? (
            <Lock className="text-red-500" size={24} />
          ) : (
            <Shield className="text-green-500" size={24} />
          )}
          <div className="flex-1">
            <p className="font-bold">
              {isBlocked ? 'ТОРГОВЛЯ ЗАБЛОКИРОВАНА' : 'ВСЁ В НОРМЕ'}
            </p>
            <p className="text-xs text-gray-400">
              {isBlocked 
                ? 'Боты не могут открывать новые позиции' 
                : 'Risk Manager активен и следит за рисками'}
            </p>
          </div>
        </div>

        {isBlocked && status.stopReasons && (
          <div className="mt-3 space-y-1">
            {status.stopReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Stats */}
      <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          ТЕКУЩЕЕ СОСТОЯНИЕ
        </h2>

        <div className="space-y-3">
          {/* Daily Loss */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Убыток за день</span>
              <span className={`font-bold ${
                dailyLossPercent < 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {dailyLossPercent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  Math.abs(dailyLossPercent) >= status.limits.dailyLossLimit
                    ? 'bg-red-500'
                    : 'bg-[#00E5FF]'
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(dailyLossPercent) / status.limits.dailyLossLimit * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Лимит: {status.limits.dailyLossLimit}%
            </p>
          </div>

          {/* Drawdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Просадка от пика</span>
              <span className={`font-bold ${
                drawdownPercent >= status.limits.maxDrawdown * 0.8
                  ? 'text-red-500'
                  : drawdownPercent >= status.limits.maxDrawdown * 0.5
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}>
                {drawdownPercent.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  drawdownPercent >= status.limits.maxDrawdown
                    ? 'bg-red-500'
                    : drawdownPercent >= status.limits.maxDrawdown * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-[#00E5FF]'
                }`}
                style={{ 
                  width: `${Math.min(drawdownPercent / status.limits.maxDrawdown * 100, 100)}%` 
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Лимит: {status.limits.maxDrawdown}%
            </p>
          </div>

          {/* Consecutive Losses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Убыточных подряд</span>
              <span className={`font-bold ${
                status.stats.consecutiveLosses >= status.limits.maxConsecutiveLosses
                  ? 'text-red-500'
                  : status.stats.consecutiveLosses >= status.limits.maxConsecutiveLosses - 1
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}>
                {status.stats.consecutiveLosses} / {status.limits.maxConsecutiveLosses}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  status.stats.consecutiveLosses >= status.limits.maxConsecutiveLosses
                    ? 'bg-red-500'
                    : 'bg-[#00E5FF]'
                }`}
                style={{ 
                  width: `${(status.stats.consecutiveLosses / status.limits.maxConsecutiveLosses) * 100}%` 
                }}
              />
            </div>
            {status.stats.consecutiveLosses > 0 && (
              <button
                onClick={resetLosses}
                className="mt-2 text-xs text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Сбросить счётчик
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      {editing ? (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            НАСТРОЙКИ
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Дневной лимит убытков (%)
              </label>
              <input
                type="number"
                value={editedSettings.dailyLossLimit}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  dailyLossLimit: parseFloat(e.target.value)
                })}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Максимальная просадка (%)
              </label>
              <input
                type="number"
                value={editedSettings.maxDrawdown}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  maxDrawdown: parseFloat(e.target.value)
                })}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Макс. убыточных подряд
              </label>
              <input
                type="number"
                value={editedSettings.maxConsecutiveLosses}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  maxConsecutiveLosses: parseInt(e.target.value)
                })}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Макс. позиций одновременно
              </label>
              <input
                type="number"
                value={editedSettings.maxOpenPositions}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  maxOpenPositions: parseInt(e.target.value)
                })}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveSettings}
                className="flex-1 bg-[#00E5FF] text-black font-bold py-3 rounded-lg hover:bg-[#00D5EF] transition"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEditedSettings(settings)
                }}
                className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            АКТИВНЫЕ ЛИМИТЫ
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Дневной лимит:</span>
              <span className="font-medium">{settings.dailyLossLimit}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Макс. просадка:</span>
              <span className="font-medium">{settings.maxDrawdown}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Убыточных подряд:</span>
              <span className="font-medium">{settings.maxConsecutiveLosses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Макс. позиций:</span>
              <span className="font-medium">{settings.maxOpenPositions}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}