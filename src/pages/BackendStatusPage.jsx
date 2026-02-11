import { useState, useEffect } from 'react'
import { ArrowLeft, Activity, Wifi, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTrading } from '../context/TradingContext'

export default function BackendStatusPage() {
  const { backendConnected, positions } = useTrading()
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const apiUrl = 'http://104.248.245.135:3001'
      
      const res = await fetch(`${apiUrl}/health`)
      const data = await res.json()
      setHealth(data)
    } catch (err) {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = async () => {
    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://твой-vps-домен.com'
        : 'http://localhost:3001'
      
      await fetch(`${apiUrl}/api/test-notification`, { method: 'POST' })
      alert('✅ Проверь Telegram!')
    } catch (err) {
      alert('❌ Ошибка отправки')
    }
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-xl font-bold">Backend Status</h1>
          <p className="text-xs text-gray-400">24/7 мониторинг сервер</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`rounded-xl p-4 mb-4 border ${
        backendConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {backendConnected ? (
            <Wifi size={32} className="text-green-500" />
          ) : (
            <WifiOff size={32} className="text-red-500" />
          )}
          <div>
            <p className="font-bold">
              {backendConnected ? 'Подключено' : 'Отключено'}
            </p>
            <p className="text-xs text-gray-400">
              {backendConnected ? 'WebSocket активен' : 'WebSocket не доступен'}
            </p>
          </div>
        </div>

        {backendConnected && (
          <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm">
            <p className="text-gray-400">✅ TP/SL мониторинг работает 24/7</p>
            <p className="text-gray-400">✅ Telegram уведомления активны</p>
            <p className="text-gray-400">✅ Real-time цены обновляются</p>
          </div>
        )}
      </div>

      {/* Health Info */}
      {loading ? (
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400">Загрузка...</p>
        </div>
      ) : health ? (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={20} className="text-[#00E5FF]" />
            <h3 className="font-bold">Server Health</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Статус</span>
              <span className="text-green-500 font-bold">{health.status.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime</span>
              <span>{Math.floor(health.uptime / 60)} минут</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Мониторится позиций</span>
              <span className="text-[#00E5FF] font-bold">{health.positions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Timestamp</span>
              <span className="text-xs">{new Date(health.timestamp).toLocaleTimeString('ru-RU')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-red-500 font-bold mb-2">❌ Backend недоступен</p>
          <p className="text-sm text-gray-400">
            Проверьте что сервер запущен на порту 3001
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={testNotification}
          className="w-full bg-[#00E5FF] text-black py-3 rounded-xl font-medium"
        >
          📱 Тест Telegram уведомления
        </button>

        <button
          onClick={checkHealth}
          className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium"
        >
          🔄 Обновить статус
        </button>
      </div>

      {/* Info */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mt-4 border border-gray-800">
        <h3 className="font-bold mb-2">ℹ️ Как это работает</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Backend сервер работает 24/7 на VPS</li>
          <li>• Получает цены через Binance WebSocket</li>
          <li>• Проверяет TP/SL каждую секунду</li>
          <li>• Отправляет уведомления в Telegram</li>
          <li>• Синхронизируется с приложением</li>
        </ul>
      </div>
    </div>
  )
}