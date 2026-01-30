import { createContext, useContext, useState, useEffect } from 'react'
import { portfolio as initialPortfolio, positions as initialPositions } from '../data/mockData'
import { AITrader } from '../services/aiTrading'
import { PositionMonitor } from '../services/positionMonitor'

const TradingContext = createContext()

export function TradingProvider({ children }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio)
  const [positions, setPositions] = useState(initialPositions)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [tradeHistory, setTradeHistory] = useState([])
  const [aiTrader, setAiTrader] = useState(null)
  const [aiSignals, setAiSignals] = useState([])

  const [monitor] = useState(
    () =>
      new PositionMonitor((pair, profit, reason) => {
        console.log(`🎯 ${reason}: ${pair} Profit: $${profit.toFixed(2)}`)
        closePosition(pair, true)
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

    // ▶️ Начать мониторинг позиции
    monitor.watchPosition(newPosition)

    return true
  }

  // AI Trader init + сигналы + авто-открытие
  useEffect(() => {
    const trader = new AITrader(
      (signal) => {
        setAiSignals(prev => [signal, ...prev].slice(0, 5))
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
          console.log('✅ AI открыл позицию:', signal.pair)
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
        aiTrader
      }}
    >
      {children}
    </TradingContext.Provider>
  )
}

export const useTrading = () => useContext(TradingContext)
