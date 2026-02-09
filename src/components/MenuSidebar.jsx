import { X, Settings, BarChart3, History, HelpCircle, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MenuSidebar({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose}>
      <div className="absolute left-0 top-0 h-full w-full max-w-sm bg-[#0A0A0A] p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Меню</h2>
          <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
        </div>

        <div className="space-y-2">
          <Link 
            to="/statistics" 
            onClick={onClose}
            className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-gray-800"
          >
            <BarChart3 className="text-[#00E5FF]" size={20} />
            <div>
              <p className="font-medium text-white">Статистика</p>
              <p className="text-xs text-gray-400">Win rate, прибыль</p>
            </div>
          </Link>

          <Link 
            to="/history" 
            onClick={onClose}
            className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-gray-800"
          >
            <History className="text-[#00E5FF]" size={20} />
            <div>
              <p className="font-medium text-white">История</p>
              <p className="text-xs text-gray-400">Закрытые сделки</p>
            </div>
          </Link>

          <Link 
            to="/live-testing" 
            onClick={onClose}
            className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-[#00E5FF]/30"
          >
            <Activity className="text-green-500" size={20} />
            <div>
              <p className="font-medium text-white">Live Testing</p>
              <p className="text-xs text-gray-400">AI производительность</p>
            </div>
          </Link>

          <Link 
            to="/settings" 
            onClick={onClose}
            className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-gray-800"
          >
            <Settings className="text-[#00E5FF]" size={20} />
            <div>
              <p className="font-medium text-white">Настройки</p>
              <p className="text-xs text-gray-400">Биржа, AI, аккаунт</p>
            </div>
          </Link>

          <button 
            className="flex items-center gap-3 bg-[#1A1A1A] p-4 rounded-lg border border-gray-800 w-full"
          >
            <HelpCircle className="text-[#00E5FF]" size={20} />
            <div className="text-left">
              <p className="font-medium text-white">Помощь</p>
              <p className="text-xs text-gray-400">FAQ, поддержка</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}