import { useState, useEffect } from 'react'

export const useLiveProfit = (positions) => {
  const [prices, setPrices] = useState({})

  useEffect(() => {
    const streams = []
    
    positions.forEach(pos => {
      const symbol = pos.pair.replace('/USDT', '').toLowerCase()
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}usdt@ticker`)
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setPrices(prev => ({
          ...prev,
          [pos.pair]: parseFloat(data.c)
        }))
      }
      
      streams.push(ws)
    })

    return () => streams.forEach(ws => ws.close())
  }, [positions.length])

  // Расчёт прибыли
  const withProfit = positions.map(pos => {
    const currentPrice = prices[pos.pair] || pos.entry
    const profit = ((currentPrice - pos.entry) / pos.entry) * pos.amount
    const profitPercent = ((currentPrice - pos.entry) / pos.entry) * 100

    return {
      ...pos,
      currentPrice,
      profit: profit.toFixed(2),
      profitPercent: profitPercent.toFixed(2)
    }
  })

  return withProfit
}