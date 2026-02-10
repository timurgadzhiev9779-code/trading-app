import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { portfolio as initialPortfolio, positions as initialPositions } from '../data/mockData'
import { AITrader, ManualMonitor } from '../services/aiTrading'
import { PositionMonitor } from '../services/positionMonitor'
import Toast from '../components/Toast'
import STORAGE_KEYS, { saveToStorage, loadFromStorage } from '../utils/storage'
import { PortfolioManager } from '../services/portfolioManager'
import { ReportGenerator } from '../services/reportGenerator'
import { BackendConnection } from '../services/backendConnection'

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
  const [signalHistory, setSignalHistory] = useState(() => 
    loadFromStorage('signalHistory', [])
  )

  const [aiTrader, setAiTrader] = useState(null)
  const [aiSignals, setAiSignals] = useState([])
  const [toast, setToast] = useState(null)
  const [portfolioManager] = useState(() => new PortfolioManager())
  const [reportGen] = useState(() => new ReportGenerator())
  const [backend] = useState(() => new BackendConnection())
  const [backendConnected, setBackendConnected] = useState(false)

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

  useEffect(() => {
    saveToStorage('signalHistory', signalHistory)
  }, [signalHistory])

  // Автоматическая генерация ежедневных отчётов
  useEffect(() => {
    const checkDailyReport = () => {
      const lastReport = localStorage.getItem('last-daily-report')
      const today = new Date().toDateString()
      
      if (lastReport !== today && tradeHistory.length > 0) {
        const report = reportGen.generateDailyReport(tradeHistory, portfolio)
        reportGen.saveReport(report, 'daily')
        localStorage.setItem('last-daily-report', today)
        
        // Показываем уведомление
        addNotification('alert', 'Дневной отчёт готов', 
          `${report.trades} сделок, ${report.winRate}% винрейт, ${parseFloat(report.profit) >= 0 ? '+' : ''}$${report.profit}`)
      }
    }

    const interval = setInterval(checkDailyReport, 60000)
    checkDailyReport()
    
    return () => clearInterval(interval)
  }, [tradeHistory, portfolio])

  // Подключение к backend
  useEffect(() => {
    backend.onConnect(async () => {
      console.log('✅ Backend подключен')
      setBackendConnected(true)

      // 🔥 ОСТАНАВЛИВАЕМ ВСЕ ЛОКАЛЬНЫЕ МОНИТОРЫ
      console.log('🛑 Останавливаем локальные мониторы')
      monitor.stopAll()

      try {
        // 1. ПОЛУЧАЕМ ИСТОРИЮ ЗАКРЫТЫХ С BACKEND
        const lastSync = localStorage.getItem('last-history-sync') || '0'
        const historyRes = await fetch(`${backend.apiUrl}/api/closed-history?since=${lastSync}`)
        const historyData = await historyRes.json()

        console.log(`📜 Получено ${historyData.history.length} закрытых позиций с backend`)

        if (historyData.history.length > 0) {
          const existingKeys = new Set(tradeHistory.map(t => `${t.pair}-${t.closeTime}`))

          const newHistory = historyData.history
            .filter(h => !existingKeys.has(`${h.pair}-${h.closeTime}`))
            .map(h => ({
              pair: h.pair,
              type: h.type || 'LONG',
              entry: h.entry,
              exit: h.exit,
              amount: h.amount,
              profit: h.profit,
              profitPercent: h.profitPercent,
              openTime: h.openTime,
              closeTime: h.closeTime,
              time: new Date(h.closeTime).toLocaleString('ru-RU'),
              isAI: h.isAI || false,
              strategy: 'Manual'
            }))

          if (newHistory.length > 0) {
            console.log(`➕ Добавляем ${newHistory.length} сделок в историю`)

            setTradeHistory(prev => [...newHistory, ...prev])

            const totalProfit = newHistory.reduce((sum, h) => sum + h.profit, 0)
            const totalReturn = newHistory.reduce((sum, h) => sum + h.amount + h.profit, 0)

            setPortfolio(prev => ({
              ...prev,
              balance: prev.balance + totalProfit,
              available: prev.available + totalReturn,
              pnl: prev.pnl + totalProfit
            }))

            newHistory.forEach(h => {
              addNotification(
                'trade',
                h.profit >= 0 ? '🎯 Take Profit' : '🛡️ Stop Loss',
                `${h.pair}: ${h.profit >= 0 ? '+' : ''}$${h.profit.toFixed(2)} (${h.profitPercent.toFixed(2)}%)`
              )
            })

            showToast(`📜 Синхронизировано ${newHistory.length} сделок`, 'info')
          }

          localStorage.setItem('last-history-sync', Date.now().toString())
        }

        // 2. ПОЛУЧАЕМ ОТКРЫТЫЕ ПОЗИЦИИ
        const posRes = await fetch(`${backend.apiUrl}/api/positions`)
        const posData = await posRes.json()
        const backendPositions = posData.positions || []
        const backendPairs = new Set(backendPositions.map(p => p.pair))

        console.log(`📊 Backend мониторит: ${backendPositions.length} позиций`)

        setPositions(prev => {
          const cleanedAI = prev.ai.filter(p => backendPairs.has(p.pair))
          const cleanedManual = prev.manual.filter(p => backendPairs.has(p.pair))
          return { ai: cleanedAI, manual: cleanedManual }
        })

      } catch (err) {
        console.error('❌ Ошибка синхронизации:', err)
      }

      showToast('Backend подключен 24/7', 'success')
    })

    backend.onDisconnect(() => {
      console.log('🔴 Backend отключен')
      setBackendConnected(false)

      // 🔥 ЗАПУСКАЕМ ЛОКАЛЬНЫЙ МОНИТОРИНГ ДЛЯ ОТКРЫТЫХ ПОЗИЦИЙ
      const allPositions = [...positions.ai, ...positions.manual]
      if (allPositions.length > 0) {
        console.log(`⚠️ Backend недоступен, запускаем локальный мониторинг для ${allPositions.length} позиций`)
        allPositions.forEach(pos => {
          monitor.watchPosition(pos)
        })
      }

      showToast('Backend отключен, используется локальный мониторинг', 'warning')
    })

    backend.onPositionAlreadyClosed((data) => {
      console.log('🚫 Позиция уже закрыта backend:', data)
      
      setPositions(prev => ({
        ai: prev.ai.filter(p => p.id !== data.id && p.pair !== data.pair),
        manual: prev.manual.filter(p => p.id !== data.id && p.pair !== data.pair)
      }))
    })

    backend.onPositionClosed((data) => {
      console.log('🎯 Backend закрыл позицию:', data)

      // 🔥 НЕ ВЫЗЫВАЕМ closePosition - ОНА УЖЕ ЗАКРЫТА BACKEND
      // Просто удаляем из списка и добавляем в историю

      const isAI = positions.ai.some(p => p.id === data.id || p.pair === data.pair)

      // Удаляем позицию
      setPositions(prev => ({
        ai: prev.ai.filter(p => p.id !== data.id && p.pair !== data.pair),
        manual: prev.manual.filter(p => p.id !== data.id && p.pair !== data.pair)
      }))

      // Добавляем в историю
      const historyEntry = {
        pair: data.pair,
        type: data.type || 'LONG',
        entry: data.entry,
        exit: data.exit || data.closePrice,
        amount: data.amount,
        profit: data.profit,
        profitPercent: data.profitPercent,
        openTime: data.openTime,
        closeTime: data.closeTime,
        time: new Date(data.closeTime).toLocaleString('ru-RU'),
        isAI: data.isAI || isAI || false,
        strategy: 'Manual'
      }

      setTradeHistory(prev => {
        // Проверяем что её нет уже
        const exists = prev.some(t => t.pair === data.pair && t.closeTime === data.closeTime)
        if (exists) {
          console.log('⚠️ Сделка уже в истории')
          return prev
        }
        return [historyEntry, ...prev]
      })

      // Обновляем баланс
      setPortfolio(prev => ({
        ...prev,
        balance: prev.balance + data.profit,
        available: prev.available + data.amount + data.profit,
        pnl: prev.pnl + data.profit
      }))

      // Уведомления
      addNotification(
        'trade',
        data.reason === 'TP' ? '🎯 Take Profit' : '🛡️ Stop Loss',
        `${data.pair}: ${data.profit >= 0 ? '+' : ''}$${data.profit.toFixed(2)} (${data.profitPercent.toFixed(2)}%)`
      )

      showToast(
        `${data.reason === 'TP' ? '🎯' : '🛡️'} ${data.pair}: ${data.profit >= 0 ? '+' : ''}$${data.profit.toFixed(2)}`,
        data.reason === 'TP' ? 'success' : 'error'
      )
    })

    // Подключаемся
    backend.connect()

    // Ping каждые 30 секунд
    const pingInterval = setInterval(() => {
      if (backendConnected) {
        backend.ping()
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      backend.disconnect()
    }
  }, [])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch (err) {}
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

  const recordSignalDecision = (signal, decision) => {
    const record = {
      ...signal,
      decision,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
    
    setSignalHistory(prev => [record, ...prev].slice(0, 100))
  }

  const [manualMonitor] = useState(
    () =>
      new ManualMonitor((signal) => {
        setAiSignals(prev => [signal, ...prev].slice(0, 10))
        showToast(`📊 Новый сигнал: ${signal.pair}`, 'info')
        addNotification('signal', 'Новый сигнал', `${signal.pair} ${signal.direction} (${signal.confidence}%)`)
      })
  )

  useEffect(() => {
    const savedManual = localStorage.getItem('manualMonitoring')
    if (savedManual && manualMonitor) {
      const coins = JSON.parse(savedManual)
      const enabled = coins.filter(c => c.enabled)
      if (enabled.length > 0) {
        manualMonitor.start(enabled)
      }
    }
  }, [])

  const monitorCallbackRef = React.useRef()
  
  monitorCallbackRef.current = (pair, profit, reason, isAI) => {
    const positionList = isAI ? positions.ai : positions.manual
    const position = positionList.find(p => p.pair === pair)
    
    if (!position) return

    const entry = parseFloat(position.entry)
    const amount = parseFloat(position.amount)

    const closedTrade = {
      pair: position.pair,
      type: position.type,
      entry: entry,
      exit: entry + (profit / amount * entry),
      amount: amount,
      profit: parseFloat(profit.toFixed(2)),
      profitPercent: parseFloat(((profit / amount) * 100).toFixed(2)),
      isAI: isAI,
      openTime: position.openTime || Date.now() - 3600000,
      closeTime: Date.now(),
      time: new Date().toLocaleString('ru-RU'),
      status: 'closed'
    }

    setTradeHistory(prev => [closedTrade, ...prev])
    
    if (isAI) {
      setPositions(prev => ({ ...prev, ai: prev.ai.filter(p => p.pair !== pair) }))
    } else {
      setPositions(prev => ({ ...prev, manual: prev.manual.filter(p => p.pair !== pair) }))
    }

    setPortfolio(prev => ({
      ...prev,
      available: prev.available + amount + profit,
      balance: prev.balance + profit,
      pnl: prev.pnl + profit,
      pnlPercent: ((prev.balance + profit - 10000) / 10000) * 100
    }))

    if (reason === 'TP HIT') {
      showToast(`🎯 Take Profit: ${pair} +$${profit.toFixed(2)}`, 'success')
      addNotification('trade', 'Take Profit достигнут', `${pair}: +$${profit.toFixed(2)}`)
    } else {
      showToast(`🛡️ Stop Loss: ${pair} $${profit.toFixed(2)}`, 'error')
      addNotification('alert', 'Stop Loss сработал', `${pair}: $${profit.toFixed(2)}`)
    }
  }

  const [monitor] = useState(
    () =>
      new PositionMonitor((pair, profit, reason, isAI) => {
        monitorCallbackRef.current(pair, profit, reason, isAI)
      })
  )

      // Открыть позицию
      const openPosition = (trade) => {
        if (trade.amount < 10) {
          showToast('Минимум $10', 'error')
          return false
        }

        if (trade.amount > portfolio.available) {
          showToast('Недостаточно средств', 'error')
          return false
        }

        // 🆕 ПРОВЕРКА СЕКТОРОВ
        const sectorCheck = portfolioManager.checkSectorLimits(
          trade.pair,
          trade.amount,
          [...positions.ai, ...positions.manual],
          portfolio.balance
        )
        
        if (!sectorCheck.allowed) {
          showToast(sectorCheck.reason, 'error')
          return false
        }
        
        // 🆕 ПРОВЕРКА КОРРЕЛЯЦИИ
        const correlationCheck = portfolioManager.checkCorrelation(
          trade.pair,
          [...positions.ai, ...positions.manual]
        )
        
        if (!correlationCheck.allowed) {
          showToast(correlationCheck.reason, 'error')
          return false
        }

    const uniqueId = Date.now() + Math.floor(Math.random() * 100000)

    const newPosition = {
      id: uniqueId,
      pair: trade.pair,
      type: trade.type || 'LONG',
      entry: parseFloat(trade.entry),
      tp: parseFloat(trade.tp),
      sl: parseFloat(trade.sl),
      amount: parseFloat(trade.amount),
      openTime: Date.now(),
      profit: 0,
      profitPercent: 0,
      currentPrice: parseFloat(trade.entry),
      time: new Date().toLocaleString('ru-RU'),
      analysis: trade.analysis || null,
      isAI: trade.isAI || false
    }

    console.log(`📍 Открываем позицию:`, newPosition)

    if (trade.isAI) {
      setPositions(prev => ({
        ...prev,
        ai: [...prev.ai, newPosition]
      }))
      showToast(`AI открыл ${trade.pair}`, 'success')
    } else {
      setPositions(prev => ({
        ...prev,
        manual: [...prev.manual, newPosition]
      }))
      showToast(`Позиция открыта: ${trade.pair}`, 'success')
    }

    setPortfolio(prev => ({
      ...prev,
      available: prev.available - trade.amount
    }))

    addNotification('trade', 'Позиция открыта', `${trade.pair} $${trade.amount}`)

    // 🔥 ЛОГИКА МОНИТОРИНГА: ЛИБО BACKEND, ЛИБО FRONTEND
    if (backendConnected) {
      console.log('📡 Отправляем в backend для 24/7 мониторинга')
      backend.addPosition(newPosition)
    } else {
      console.log('⚠️ Backend недоступен, используем локальный мониторинг')
      monitor.watchPosition(newPosition)
    }

    return true
  }

        // AI Trader init + сигналы + авто-открытие
        useEffect(() => {
          const trader = new AITrader(
            (signal) => {
              setAiSignals(prev => [signal, ...prev].slice(0, 5))
              addNotification('signal', 'Новый AI сигнал', `${signal.pair} ${signal.direction} (${signal.confidence}%)`)
              playNotificationSound()
            },
            (signal) => {
              if (aiEnabled && portfolio.available > 100) {
                openPosition({
                  pair: signal.pair,
                  type: signal.direction,
                  entry: signal.entry,
                  tp: signal.tp,
                  sl: signal.sl,
                  amount: signal.amount,
                  isAI: true,
                  analysis: signal.analysis
                })
                addNotification('trade', 'AI открыл позицию', `${signal.pair} по цене $${signal.entry.toFixed(2)}`)
              }
            },
            portfolio,
            tradeHistory
          )
          
          setAiTrader(trader)
          
          // 🔥 ЗАГРУЖАЕМ НАСТРОЙКИ
          if (aiEnabled) {
            const savedMonitoring = localStorage.getItem('aiMonitoring')
            if (savedMonitoring) {
              const coins = JSON.parse(savedMonitoring)
              const enabled = coins.filter(c => c.enabled)
              trader.start(enabled)
            }
          }
    
          return () => {
            if (trader) trader.stop()
          }
        }, [aiEnabled])

            // Закрыть позицию
            const closePosition = (pair, isAI) => {
              const positionList = isAI ? positions.ai : positions.manual
              const position = positionList.find(p => p.pair === pair)
              
              if (!position) return

    const currentPrice = parseFloat(position.currentPrice || position.entry)
    const entry = parseFloat(position.entry)
    const amount = parseFloat(position.amount)
    const profit = parseFloat((((currentPrice - entry) / entry) * amount).toFixed(2))

    const closedTrade = {
      pair: position.pair,
      type: position.type,
      entry: entry,
      exit: currentPrice,
      amount: amount,
      profit: profit,
      profitPercent: parseFloat((((currentPrice - entry) / entry) * 100).toFixed(2)),
      isAI: isAI,
      openTime: position.openTime || Date.now() - 3600000,
      closeTime: Date.now(),
      time: new Date().toLocaleString('ru-RU'),
      status: 'closed'
    }

    setTradeHistory(prev => [closedTrade, ...prev])
    
    if (isAI) {
      setPositions(prev => ({ ...prev, ai: prev.ai.filter(p => p.pair !== pair) }))
    } else {
      setPositions(prev => ({ ...prev, manual: prev.manual.filter(p => p.pair !== pair) }))
    }

    setPortfolio(prev => ({
      ...prev,
      available: prev.available + amount + profit,
      balance: prev.balance + profit,
      pnl: prev.pnl + profit,
      pnlPercent: ((prev.balance + profit - 10000) / 10000) * 100
    }))

    showToast(
      profit >= 0 ? `✅ +$${profit.toFixed(2)}` : `❌ ${profit.toFixed(2)}`,
      profit >= 0 ? 'success' : 'error'
    )
  }

      // Частичное закрытие позиции
  const partialClose = (pair, isAI, percentage, passedCurrentPrice) => {
    const positionList = isAI ? positions.ai : positions.manual
    const position = positionList.find(p => p.pair === pair)
    
    if (!position) {
      showToast('Ошибка: позиция не найдена', 'error')
      return
    }

    const currentPrice = parseFloat(passedCurrentPrice || position.currentPrice || position.entry)
    const entry = parseFloat(position.entry)
    const totalAmount = parseFloat(position.amount)
    
    const closeAmount = parseFloat((totalAmount * percentage / 100).toFixed(2))
    const remainingAmount = parseFloat((totalAmount - closeAmount).toFixed(2))
    
    if (closeAmount <= 0 || isNaN(closeAmount)) {
      showToast('Ошибка расчёта', 'error')
      return
    }

    const profit = parseFloat((((currentPrice - entry) / entry) * closeAmount).toFixed(2))
    
    const closedTrade = {
      pair: position.pair,
      type: position.type,
      entry: entry,
      exit: currentPrice,
      amount: closeAmount,
      profit: profit,
      profitPercent: parseFloat((((currentPrice - entry) / entry) * 100).toFixed(2)),
      isAI: isAI,
      openTime: position.openTime || Date.now() - 3600000,
      closeTime: Date.now(),
      time: new Date().toLocaleString('ru-RU'),
      status: 'partial_close'
    }

    setTradeHistory(prev => [closedTrade, ...prev])
    
    if (remainingAmount >= 10) {
      if (isAI) {
        setPositions(prev => ({
          ...prev,
          ai: prev.ai.map(p => p.pair === pair ? { ...p, amount: remainingAmount } : p)
        }))
      } else {
        setPositions(prev => ({
          ...prev,
          manual: prev.manual.map(p => p.pair === pair ? { ...p, amount: remainingAmount } : p)
        }))
      }
    } else {
      if (isAI) {
        setPositions(prev => ({ ...prev, ai: prev.ai.filter(p => p.pair !== pair) }))
      } else {
        setPositions(prev => ({ ...prev, manual: prev.manual.filter(p => p.pair !== pair) }))
      }
    }
    
    setPortfolio(prev => ({
      ...prev,
      available: prev.available + closeAmount + profit,
      balance: prev.balance + profit,
      pnl: prev.pnl + profit
    }))

    showToast(`Закрыто ${percentage}%: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, 'success')
  }

  // Trailing Stop
  const updateTrailingStop = (pair, isAI) => {
    const positionList = isAI ? positions.ai : positions.manual
    const position = positionList.find(p => p.pair === pair)
    
    if (!position || !position.currentPrice) return
    
    const currentProfit = ((position.currentPrice - position.entry) / position.entry) * 100
    
    if (currentProfit > 2) {
      const newSL = position.entry * 1.005
      
      if (newSL > position.sl) {
        if (isAI) {
          setPositions(prev => ({
            ...prev,
            ai: prev.ai.map(p => 
              p.pair === pair ? { ...p, sl: newSL } : p
            )
          }))
        } else {
          setPositions(prev => ({
            ...prev,
            manual: prev.manual.map(p => 
              p.pair === pair ? { ...p, sl: newSL } : p
            )
          }))
        }
        
        showToast(`Trailing Stop активирован для ${pair}`, 'info')
      }
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
          // Загружаем настройки из AI Monitoring
          const savedMonitoring = localStorage.getItem('aiMonitoring')
          if (savedMonitoring) {
            const coins = JSON.parse(savedMonitoring)
            const enabled = coins.filter(c => c.enabled)
            aiTrader.start(enabled)
          } else {
            // Дефолтные значения
            aiTrader.start([
              { symbol: 'BTC/USDT', minConfidence: 75 },
              { symbol: 'ETH/USDT', minConfidence: 75 }
            ])
          }
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
        clearNotifications,
        signalHistory,
        recordSignalDecision,
        partialClose,
        updateTrailingStop,
        backendConnected,
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