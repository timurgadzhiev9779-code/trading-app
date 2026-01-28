import { X } from 'lucide-react'

export default function AddPairModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1A1A1A] w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Добавить пару</h2>
          <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
        </div>

        {/* Select Pair */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Торговая пара</label>
          <select className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3 text-white">
            <option>Выбрать пару</option>
            <option>BTC/USDT</option>
            <option>ETH/USDT</option>
            <option>SOL/USDT</option>
            <option>AVAX/USDT</option>
          </select>
        </div>

        {/* Timeframe */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
          <div className="grid grid-cols-4 gap-2">
            {['15m', '1h', '4h', '1D'].map(tf => (
              <button key={tf} className="bg-[#0A0A0A] border border-gray-800 rounded-lg py-2 text-white hover:border-[#00E5FF]">
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-3 rounded-lg">Отмена</button>
          <button className="flex-1 bg-[#00E5FF] text-black py-3 rounded-lg font-medium">Добавить</button>
        </div>
      </div>
    </div>
  )
}
