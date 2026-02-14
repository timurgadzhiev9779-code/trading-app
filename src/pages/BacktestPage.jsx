import { useState } from 'react'
import { ArrowLeft, Play, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BacktestService } from '../services/backtestService'

export default function BacktestPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  
  // Настройки
  const [symbol, setSymbol] = useState('BTC')
  const [mode, setMode] = useState('balanced')
  const [style, setStyle] = useState('swing')
  const [days, setDays] = useState(180)

  const runBacktest = async () => {
    setLoading(true)
    setResults(null)
    
    const service = new BacktestService()
    const result = await service.runBacktest(symbol, mode, style, days)
    
    setResults(result)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Бэктест системы</h1>
      </div>

      {/* Описание */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-400">
          Протестируйте стратегию на исторических данных и узнайте:
          винрейт, доходность, просадку за последние {days} дней.
        </p>
      </div>

      {/* Настройки */}
      <div className="space-y-4 mb-6">
        {/* Монета */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Монета</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="BNB">Binance Coin (BNB)</option>
            <option value="XRP">Ripple (XRP)</option>
          </select>
        </div>

        {/* Режим */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Режим уверенности</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="conservative">Консервативный (70%)</option>
            <option value="balanced">Сбалансированный (60%)</option>
            <option value="aggressive">Агрессивный (50%)</option>
          </select>
        </div>

        {/* Стиль */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Стиль торговли</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="scalping">Скальпинг</option>
            <option value="daytrading">Дейтрейдинг</option>
            <option value="swing">Свинг</option>
          </select>
        </div>

        {/* Период */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Период (дней)</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-3 focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="90">90 дней (3 месяца)</option>
            <option value="180">180 дней (6 месяцев)</option>
            <option value="365">365 дней (1 год)</option>
          </select>
        </div>
      </div>

      {/* Кнопка запуска */}
      <button
        onClick={runBacktest}
        disabled={loading}
        className="w-full bg-[#00E5FF] hover:bg-[#00D5EF] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition mb-6"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            Анализ данных...
          </>
        ) : (
          <>
            <Play size={20} />
            Запустить бэктест
          </>
        )}
      </button>

      {/* Результаты */}
      {results && !results.error && (
        <div className="space-y-4">
          {/* Главные метрики */}
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <h3 className="font-bold mb-4">📊 Основные показатели</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="text-green-500" />
                  <span className="text-xs text-gray-400">Прибыль</span>
                </div>
                <p className={`text-xl font-bold ${results.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {results.totalPnL >= 0 ? '+' : ''}{results.totalPnL.toFixed(2)} USDT
                </p>
                <p className="text-xs text-gray-500">
                  {results.totalPnLPercent >= 0 ? '+' : ''}{results.totalPnLPercent.toFixed(2)}%
                </p>
              </div>

              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={16} className="text-blue-500" />
                  <span className="text-xs text-gray-400">Годовая</span>
                </div>
                <p className={`text-xl font-bold ${results.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {results.annualizedReturn >= 0 ? '+' : ''}{results.annualizedReturn.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">годовых</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Сделок</p>
                <p className="text-2xl font-bold">{results.trades}</p>
              </div>

              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Винрейт</p>
                <p className="text-2xl font-bold text-green-500">{results.winRate}%</p>
              </div>

              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-green-500" />
                  <p className="text-xs text-gray-400">Прибыльных</p>
                </div>
                <p className="text-xl font-bold text-green-500">{results.winTrades}</p>
              </div>

              <div className="bg-[#0A0A0A] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={14} className="text-red-500" />
                  <p className="text-xs text-gray-400">Убыточных</p>
                </div>
                <p className="text-xl font-bold text-red-500">{results.lossTrades}</p>
              </div>
            </div>
          </div>

          {/* Риски */}
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <h3 className="font-bold mb-3">⚠️ Риски</h3>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-gray-400 mb-1">Макс. просадка</p>
              <p className="text-2xl font-bold text-red-500">-{results.maxDrawdown}%</p>
              <p className="text-xs text-gray-500 mt-2">
                Максимальное падение капитала от пика
              </p>
            </div>
          </div>

          {/* История сделок */}
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800">
            <h3 className="font-bold mb-3">📜 Последние сделки</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.allTrades.slice(-10).reverse().map((trade, i) => (
  <div
    key={i}
    className={`bg-[#0A0A0A] rounded-lg p-3 border ${
      trade.result === 'WIN' ? 'border-green-500/30' : 'border-red-500/30'
    }`}
  >
    {/* Шапка сделки */}
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-xs text-gray-400">
          {new Date(trade.entryDate).toLocaleDateString('ru-RU')}
        </p>
        <p className="text-xs text-gray-500">
          Размер: {trade.size.toFixed(4)} {symbol}
        </p>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded ${
          trade.result === 'WIN' 
            ? 'bg-green-500/20 text-green-500' 
            : 'bg-red-500/20 text-red-500'
        }`}>
          {trade.exitReason}
        </span>
      </div>
    </div>

    {/* Цены */}
    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
      <div className="bg-[#1A1A1A] rounded p-2">
        <p className="text-gray-500 mb-1">Вход</p>
        <p className="font-medium">${trade.entry.toFixed(2)}</p>
      </div>
      <div className="bg-[#1A1A1A] rounded p-2">
        <p className="text-gray-500 mb-1">Выход</p>
        <p className="font-medium">${trade.exit.toFixed(2)}</p>
      </div>
    </div>

    {/* Сумма и P&L */}
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <p className="text-gray-500 mb-1">Сумма позиции</p>
        <p className="font-medium text-[#00E5FF]">
          ${trade.positionValue ? trade.positionValue.toFixed(2) : (trade.size * trade.entry).toFixed(2)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-gray-500 mb-1">P&L</p>
        <div>
          <p className={`font-bold ${
            trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </p>
          <p className={`text-xs ${
            trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            ({trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>

    {/* Дополнительно */}
    <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between text-xs text-gray-500">
      <span>Уверенность: {trade.confidence}%</span>
      <span>{trade.mode.toUpperCase()} • {trade.style.toUpperCase()}</span>
    </div>
  </div>
))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-xs text-yellow-400">
              ⚠️ Исторические результаты не гарантируют будущую прибыль. 
              Бэктест использует упрощённую модель и не учитывает комиссии, 
              проскальзывание и изменение рыночных условий.
            </p>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {results && results.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-500">Ошибка: {results.error}</p>
        </div>
      )}
    </div>
  )
}