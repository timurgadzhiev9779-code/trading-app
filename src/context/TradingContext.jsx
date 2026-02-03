import { createContext, useContext, useState, useEffect } from 'react'
import { portfolio as initialPortfolio, positions as initialPositions } from '../data/mockData'
import { AITrader, ManualMonitor } from '../services/aiTrading'
import { PositionMonitor } from '../services/positionMonitor'
import Toast from '../components/Toast'
import STORAGE_KEYS, { saveToStorage, loadFromStorage } from '../utils/storage'

const TradingContext = createContext()

export function TradingProvider({ children }) {
  // Загружаем из localStorage или используем default
  const [portfolio, setPortfolio] = useState(() => 
    loadFromStorage(STORAGE_KEYS.PORTFOLIO, initialPortfolio)
  )
  const [positions, setPositions] = useState(() => 
    loadFromStorage(STORAGE_KEYS.POSITIONS, initialPositions)
  )
  const [tradeHistory, setTradeHistory] = useState(() => 
    loadFromStorage(STORAGE_KEYS.HISTORY, [])
  )
  const [aiEnabled, setAiEnabled] = useState(() => 
    loadFromStorage(STORAGE_KEYS.AI_ENABLED, false)
  )
  const [notifications, setNotifications] = useState(() => 
    loadFromStorage('notifications', [])
  )
  
  const [aiTrader, setAiTrader] = useState(null)
  const [aiSignals, setAiSignals] = useState([])
  const [toast, setToast] = useState(null)

  // Сохраняем при каждом изменении
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORTFOLIO, portfolio)
  }, [portfolio])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.POSITIONS, positions)
  }, [positions])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HISTORY, tradeHistory)
  }, [tradeHistory])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AI_ENABLED, aiEnabled)
  }, [aiEnabled])

  useEffect(() => {
    saveToStorage('notifications', notifications)
  }, [notifications])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const addNotification = (type, title, message) => {
    const notif = {
      id: Date.now(),
      type, // 'signal', 'trade', 'alert'
      title,
      message,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    }
    
    setNotifications(prev => [notif, ...prev].slice(0, 50)) // Последние 50
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const [manualMonitor] = useState(
    () =>
      new ManualMonitor((signal) => {
        setAiSignals(prev => [signal, ...prev].slice(0, 10))
        showToast(`📊 Новый сигнал: ${signal.pair}`, 'info')
        addNotification('signal', 'Новый сигнал', `${signal.pair} ${signal.direction} (${signal.confidence}%)`)
      })
  )

  const [monitor] = useState(
    () =>
      new PositionMonitor((pair, profit, reason) => {
        closePosition(pair, true)

        if (reason === 'TP HIT') {
          showToast(
            `🎯 Take Profit достигнут! ${pair} +$${profit.toFixed(2)}`,
            'success'
          )
          addNotification('trade', 'Take Profit достигнут', `${pair}: +$${profit.toFixed(2)}`)
        } else {
          showToast(
            `🛡️ Stop Loss сработал. ${pair} ${profit.toFixed(2)}`,
            'error'
          )
          addNotification('alert', 'Stop Loss сработал', `${pair}: ${profit.toFixed(2)}`)
        }
      })
  )

  // Открыть позицию
  const openPosition = (trade) => {
    if (trade.amount > portfolio.available) {
      alert('Недостаточно средств!')
      return false
    }

    if (trade.amount < 10) {
      alert('Минимум $10')
      return false
    }

    const newPosition = {
      ...trade,
      openTime: Date.now(),
      profit: 0,
      profitPercent: 0,
      time: 'Сейчас'
    }

    if (trade.isAI) {
      setPositions(prev => ({
        ...prev,
        ai: [...prev.ai, newPosition]
      }))
    } else {
      setPositions(prev => ({
        ...prev,
        manual: [...prev.manual, newPosition]
      }))
    }

    setPortfolio(prev => ({
      ...prev,
      available: prev.available - trade.amount
    }))

    monitor.watchPosition(newPosition)

    showToast(`✅ Позиция открыта: ${trade.pair}`, 'success')

    return true
  }

  // AI Trader init + сигналы + авто-открытие
  useEffect(() => {
    const trader = new AITrader(
      (signal) => {
        setAiSignals(prev => [signal, ...prev].slice(0, 5))
        addNotification('signal', 'Новый AI сигнал', `${signal.pair} ${signal.direction} (${signal.confidence}%)`)
      },
      (signal) => {
        if (aiEnabled && portfolio.available > 100) {
          openPosition({
            pair: signal.pair,
            type: signal.direction,
            entry: signal.entry,
            tp: signal.tp,
            sl: signal.sl,
            amount: Math.min(portfolio.available * 0.02, 1000),
            isAI: true
          })
          addNotification('trade', 'AI открыл позицию', `${signal.pair} по цене $${signal.entry.toFixed(2)}`)
        }
      }
    )

    setAiTrader(trader)
  }, [])

  // Закрыть позицию
  const closePosition = (pair, isAI) => {
    let closedPosition

    if (isAI) {
      closedPosition = positions.ai.find(p => p.pair === pair)
      setPositions(prev => ({
        ...prev,
        ai: prev.ai.filter(p => p.pair !== pair)
      }))
    } else {
      closedPosition = positions.manual.find(p => p.pair === pair)
      setPositions(prev => ({
        ...prev,
        manual: prev.manual.filter(p => p.pair !== pair)
      }))
    }

    if (closedPosition) {
      setTradeHistory(prev => [
        {
          ...closedPosition,
          closeTime: Date.now(),
          status: 'closed'
        },
        ...prev
      ])

      setPortfolio(prev => ({
        ...prev,
        available:
          prev.available + closedPosition.amount + closedPosition.profit,
        balance: prev.balance + closedPosition.profit,
        pnl: prev.pnl + closedPosition.profit
      }))
    }
  }

  // Очистка мониторинга
  useEffect(() => {
    return () => monitor.stopAll()
  }, [])

  // Toggle AI
  const toggleAI = () => {
    setAiEnabled(prev => {
      const newState = !prev

      if (newState && aiTrader) {
        aiTrader.start([
          { symbol: 'BTC/USDT', price: 95000 },
          { symbol: 'ETH/USDT', price: 3400 }
        ])
      } else if (aiTrader) {
        aiTrader.stop()
      }

      return newState
    })
  }

  return (
    <TradingContext.Provider
      value={{
        portfolio,
        positions,
        aiEnabled,
        aiSignals,
        openPosition,
        closePosition,
        toggleAI,
        tradeHistory,
        aiTrader,
        manualMonitor,
        notifications,
        addNotification,
        clearNotifications
      }}
    >
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </TradingContext.Provider>
  )
}

export const useTrading = () => useContext(TradingContext)