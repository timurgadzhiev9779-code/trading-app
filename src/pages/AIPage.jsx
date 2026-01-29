import { TrendingUp, Settings, BarChart3, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AIPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">🤖 AI Управление</h1>

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

        <Link to="/ai/manual-monitoring" className="w-full bg-gray-800 hover:bg-gray-700 py-3 rounded-lg flex items-center justify-center gap-2">
          <Settings size={18} />
          Настроить ручной мониторинг
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30">
          <Shield className="text-[#00E5FF] mb-2" size={24} />
          <p className="font-medium text-sm">Risk Profile</p>
          <p className="text-gray-400 text-xs">Сбалансированный</p>
        </button>

        <button className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 hover:border-[#00E5FF]/30">
          <BarChart3 className="text-[#00E5FF] mb-2" size={24} />
          <p className="font-medium text-sm">Performance</p>
          <p className="text-green-500 text-xs">+12.4% месяц</p>
        </button>
      </div>
    </div>
  )
}
