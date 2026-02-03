import { X, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { useTrading } from '../context/TradingContext'

export default function NotificationsPanel({ notifications, onClose }) {
  const { clearNotifications } = useTrading()

  if (!notifications || notifications.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose}>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] p-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">🔔 Уведомления</h2>
            <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
          </div>
          <div className="text-center text-gray-400 mt-12">
            <p>Нет новых уведомлений</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">🔔 Уведомления</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (confirm('Очистить все уведомления?')) {
                  clearNotifications()
                }
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Очистить
            </button>
            <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.map((notif, i) => (
            <div key={notif.id || i} className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800">
              <div className="flex items-start gap-3">
                {notif.type === 'signal' && <TrendingUp className="text-[#00E5FF]" size={20} />}
                {notif.type === 'trade' && <CheckCircle className="text-green-500" size={20} />}
                {notif.type === 'alert' && <AlertCircle className="text-orange-400" size={20} />}
                <div className="flex-1">
                  <p className="font-medium text-white">{notif.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}