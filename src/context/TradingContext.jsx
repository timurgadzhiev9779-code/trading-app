import { createContext, useContext, useState } from 'react'
import { portfolio as initialPortfolio, positions as initialPositions } from '../data/mockData'

const TradingContext = createContext()

export function TradingProvider({ children }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio)
  const [positions, setPositions] = useState(initialPositions)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [tradeHistory, setTradeHistory] = useState([]) // ✅ добавлено

  // Открыть позицию
  const openPosition = (trade) => {
    // Валидация
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

    return true
  }

  // Закрыть позицию (ОБНОВЛЕНО)
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

    // Добавить в историю + вернуть деньги
    if (closedPosition) {
      setTradeHistory(prev => [{
        ...closedPosition,
        closeTime: Date.now(),
        status: 'closed'
      }, ...prev])

      setPortfolio(prev => ({
        ...prev,
        available: prev.available + closedPosition.amount + closedPosition.profit,
        balance: prev.balance + closedPosition.profit,
        pnl: prev.pnl + closedPosition.profit
      }))
    }
  }

  // Переключить AI
  const toggleAI = () => {
    setAiEnabled(prev => !prev)
  }

  return (
    <TradingContext.Provider value={{
      portfolio,
      positions,
      aiEnabled,
      tradeHistory,     // ✅ добавлено
      openPosition,
      closePosition,
      toggleAI
    }}>
      {children}
    </TradingContext.Provider>
  )
}

export const useTrading = () => useContext(TradingContext)
