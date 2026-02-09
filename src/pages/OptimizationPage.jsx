import { useState } from 'react'
import { ArrowLeft, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SelfOptimizer } from '../services/selfOptimization'
import { useTrading } from '../context/TradingContext'

export default function OptimizationPage() {
  const { aiTrader } = useTrading()
  const [optimizer] = useState(() => new SelfOptimizer())
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState('')

  const runOptimization = async () => {
    setStatus('running')
    setProgress('Подготовка данных...')
    
    try {
      const dataset = await optimizer.prepareHistoricalDataset(['BTC', 'ETH', 'SOL'])
      
      setProgress('Запуск генетического алгоритма...')
      const optimizationResult = await optimizer.runOptimization(dataset)
      
      setResult(optimizationResult)
      setStatus('completed')
    } catch (err) {
      setStatus('error')
      setProgress(`Ошибка: ${err.message}`)
    }
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-xl font-bold">Самооптимизация</h1>
          <p className="text-xs text-gray-400">AI улучшает сам себя</p>
        </div>
      </div>

      {/* Current Best */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">🏆 Текущие параметры</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(optimizer.bestParams).map(([key, value]) => (
            <div key={key} className="bg-[#0A0A0A] p-2 rounded">
              <p className="text-gray-400">{key}</p>
              <p className="font-bold">{typeof value === 'number' ? value.toFixed(2) : value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      {status === 'running' && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-[#00E5FF]/30">
          <p className="text-sm mb-2">{progress}</p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-[#00E5FF] h-2 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-green-500/30">
          <h3 className="font-bold mb-3 text-green-500">✅ Оптимизация завершена!</h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div className="bg-[#0A0A0A] p-3 rounded">
              <p className="text-gray-400 mb-1">Прибыль</p>
              <p className="text-green-500 font-bold">+{result.result.profitPercent.toFixed(2)}%</p>
            </div>
            <div className="bg-[#0A0A0A] p-3 rounded">
              <p className="text-gray-400 mb-1">Win Rate</p>
              <p className="text-[#00E5FF] font-bold">{result.result.winRate}%</p>
            </div>
            <div className="bg-[#0A0A0A] p-3 rounded">
              <p className="text-gray-400 mb-1">Сделок</p>
              <p className="font-bold">{result.result.trades}</p>
            </div>
            <div className="bg-[#0A0A0A] p-3 rounded">
              <p className="text-gray-400 mb-1">Sharpe</p>
              <p className="font-bold">{result.result.sharpe}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (aiTrader) {
                optimizer.applyOptimizedParams(aiTrader)
                alert('✅ Параметры применены к AI!')
              } else {
                alert('⚠️ AI Trader не активен. Включите AI сначала.')
              }
            }}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium"
          >
            Применить к AI
          </button>
        </div>
      )}

      {/* Action */}
      <button
        onClick={runOptimization}
        disabled={status === 'running'}
        className={`w-full py-4 rounded-xl font-bold text-lg transition ${
          status === 'running'
            ? 'bg-gray-700 text-gray-400'
            : 'bg-[#00E5FF] text-black hover:bg-[#00D5EF]'
        }`}
      >
        {status === 'running' ? '⏳ Оптимизируем...' : '🧬 Запустить оптимизацию'}
      </button>

      {/* Info */}
      <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
        <p className="text-xs text-yellow-500">
          ⚠️ Процесс занимает 2-3 минуты. AI тестирует 50 вариаций параметров на исторических данных.
        </p>
      </div>
    </div>
  )
}