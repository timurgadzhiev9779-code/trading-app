import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [])

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-[#00E5FF]" size={20} />
  }

  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-[#00E5FF]/30 bg-[#00E5FF]/10'
  }

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full bg-[#1A1A1A] border ${colors[type]} rounded-lg p-4 shadow-lg z-50 animate-slide-in`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="text-white text-sm flex-1">{message}</p>
        <button onClick={onClose}>
          <X size={18} className="text-gray-400" />
        </button>
      </div>
    </div>
  )
}