import { useState } from 'react'
import { ArrowLeft, Play, Loader } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Backtester } from '../services/backtesting'

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('BTC')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const runTest = async () => {
    setLoading(true)
    setResult(null)
    
    const backtester = new Backtester()
    const res = await backtester.runBacktest(symbol, days)
    
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/statistics"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold">📈 Backtesting</h1>
      </div>

      {/* Inputs */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Монета</label>
          <select 
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3"
          >
            <option value="BTC">BTC/USDT</option>
            <option value="ETH">ETH/USDT</option>
            <option value="SOL">SOL/USDT</option>
            <option value="AVAX">AVAX/USDT</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Период (дней)</label>
          <select 
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-3"
          >
            <option value="7">7 дней</option>
            <option value="14">14 дней</option>
            <option value="30">30 дней</option>
            <option value="60">60 дней</option>
          </select>
        </div>

        <button 
          onClick={runTest}
          disabled={loading}
          className="w-full bg-[#00E5FF] text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader className="animate-spin" size={20} /> Тестирую...</>
          ) : (
            <><Play size={20} /> Запустить тест</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Начальный баланс</p>
              <p className="text-2xl font-bold">${result.initialBalance.toLocaleString()}</p>
            </div>
            <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Конечный баланс</p>
              <p className={`text-2xl font-bold ${result.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${result.finalBalance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
            <h3 className="font-bold mb-3">Результаты</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Прибыль/Убыток</span>
                <span className={`font-bold ${result.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)} ({result.profitPercent >= 0 ? '+' : ''}{result.profitPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Всего сделок</span>
                <span className="font-bold">{result.trades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Прибыльных</span>
                <span className="text-green-500 font-bold">{result.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Убыточных</span>
                <span className="text-red-500 font-bold">{result.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate</span>
                <span className="font-bold text-[#00E5FF]">{result.winRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Trade List */}
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <h3 className="font-bold mb-3">История сделок</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.tradeList.map((trade, i) => (
                <div key={i} className="bg-[#0A0A0A] p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{trade.pair}</span>
                    <span className={`text-xs px-2 py-1 rounded ${trade.result === 'WIN' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {trade.result}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Entry: ${trade.entry.toFixed(2)}</span>
                    <span>Exit: ${trade.exit.toFixed(2)}</span>
                    <span className={trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}