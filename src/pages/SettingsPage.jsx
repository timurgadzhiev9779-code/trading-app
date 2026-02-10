import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { EXCHANGES } from '../services/exchanges'

export default function SettingsPage() {
  const [selectedExchange, setSelectedExchange] = useState(
    localStorage.getItem('exchange') || EXCHANGES.BINANCE
  )

  const handleExchangeChange = (exchange) => {
    setSelectedExchange(exchange)
    localStorage.setItem('exchange', exchange)
  }

  const exchanges = [
    { id: EXCHANGES.BINANCE, name: 'Binance', logo: '🟡' },
    { id: EXCHANGES.BYBIT, name: 'Bybit', logo: '🟠' },
    { id: EXCHANGES.GATEIO, name: 'Gate.io', logo: '🔵' }
  ]

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">⚙️ Настройки</h1>
      </div>

      {/* Exchange Selection */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Биржа для торговли</h3>
        <div className="space-y-2">
          {exchanges.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleExchangeChange(ex.id)}
              className={`w-full p-4 rounded-lg border transition flex items-center justify-between ${
                selectedExchange === ex.id
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF]'
                  : 'bg-[#0A0A0A] border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ex.logo}</span>
                <span className="font-medium">{ex.name}</span>
              </div>
              {selectedExchange === ex.id && (
                <CheckCircle className="text-[#00E5FF]" size={20} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">AI Настройки</h3>
        <Link 
          to="/ai/monitoring"
          className="block bg-[#0A0A0A] p-3 rounded-lg mb-2"
        >
          <p className="font-medium">AI Мониторинг</p>
          <p className="text-sm text-gray-400">Настроить монеты для AI</p>
        </Link>
        <Link 
          to="/ai/manual-monitoring"
          className="block bg-[#0A0A0A] p-3 rounded-lg"
        >
          <p className="font-medium">Ручной мониторинг</p>
          <p className="text-sm text-gray-400">Настроить монеты для сигналов</p>
        </Link>
      </div>

      {/* Account */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Аккаунт</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Баланс</span>
            <span className="font-bold">$10,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Режим</span>
            <span className="text-orange-400">Demo Trading</span>
          </div>
        </div>
      </div>

      {/* Stats Link */}
      <Link 
        to="/statistics"
        className="block bg-[#1A1A1A] rounded-xl p-4 border border-gray-800"
      >
        <p className="font-bold">📊 Статистика торговли</p>
        <p className="text-sm text-gray-400">Win rate, прибыль, история</p>
      </Link>


      {/* ML Training */}
      <Link 
        to="/ml-training"
        className="block bg-[#1A1A1A] rounded-xl p-4 mt-4 border border-gray-800 hover:bg-[#2A2A2A] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-lg flex items-center justify-center">
            🧠
          </div>
          <div>
            <p className="font-bold">ML Обучение</p>
            <p className="text-sm text-gray-400">Нейросеть для предсказаний</p>
          </div>
        </div>
      </Link>
      
      {/* Self Optimization */}
      <Link 
        to="/optimization"
        className="block bg-[#1A1A1A] rounded-xl p-4 mt-4 border border-gray-800 hover:bg-[#2A2A2A] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-lg flex items-center justify-center">
            🧬
          </div>
          <div>
            <p className="font-bold">Самооптимизация</p>
            <p className="text-sm text-gray-400">AI улучшает сам себя</p>
          </div>
        </div>
      </Link>

      {/* Backend Status */}
      <Link 
        to="/backend-status"
        className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 mt-4 flex items-center justify-between hover:bg-[#2A2A2A] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            📡
          </div>
          <div>
            <p className="font-medium">Backend Status</p>
            <p className="text-xs text-gray-400">24/7 мониторинг сервер</p>
          </div>
        </div>
        <span className="text-gray-400">→</span>
      </Link>

      {/* Reset */}
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <h3 className="font-bold text-red-500 mb-2">⚠️ Опасная зона</h3>
        <p className="text-sm text-gray-400 mb-3">
          Удалит все позиции, историю и вернёт баланс к $10,000
        </p>
        <button 
          onClick={() => {
            if (confirm('Сбросить ВСЕ данные? Это действие нельзя отменить!')) {
              localStorage.clear()
              window.location.href = '/'
            }
          }}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium"
        >
          🗑️ Полный сброс
        </button>
      </div>
    </div>
  )
}