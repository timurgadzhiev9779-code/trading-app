import { createContext, useContext, useState } from 'react'
import { portfolio as initialPortfolio, positions as initialPositions } from '../data/mockData'

const TradingContext = createContext()

export function TradingProvider({ children }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio)
  const [positions, setPositions] = useState(initialPositions)
  const [aiEnabled, setAiEnabled] = useState(true)

  // Открыть позицию
  const openPosition = (trade) => {
    const newPosition = {
      ...trade,
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

    // Уменьшить доступный баланс
    setPortfolio(prev => ({
      ...prev,
      available: prev.available - trade.amount
    }))
  }

  // Закрыть позицию
  const closePosition = (pair, isAI) => {
    if (isAI) {
      setPositions(prev => ({
        ...prev,
        ai: prev.ai.filter(p => p.pair !== pair)
      }))
    } else {
      setPositions(prev => ({
        ...prev,
        manual: prev.manual.filter(p => p.pair !== pair)
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
      openPosition,
      closePosition,
      toggleAI
    }}>
      {children}
    </TradingContext.Provider>
  )
}

export const useTrading = () => useContext(TradingContext)