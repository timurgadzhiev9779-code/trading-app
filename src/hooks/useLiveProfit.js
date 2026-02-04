import { useState, useEffect } from 'react'

export const useLiveProfit = (positions) => {
  const [prices, setPrices] = useState({})

  useEffect(() => {
    if (!positions || positions.length === 0) return
    
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
      
      ws.onerror = (err) => console.error('WS error:', err)
      
      streams.push(ws)
    })

    return () => streams.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
  }, [positions.length])

  const withProfit = positions.map(pos => {
    const currentPrice = prices[pos.pair] || pos.entry
    const priceDiff = currentPrice - pos.entry
    const profit = (priceDiff / pos.entry) * (pos.amount || 0)
    const profitPercent = (priceDiff / pos.entry) * 100

    return {
      ...pos,
      currentPrice,
      profit: isNaN(profit) ? 0 : parseFloat(profit.toFixed(2)),
      profitPercent: isNaN(profitPercent) ? 0 : parseFloat(profitPercent.toFixed(2))
    }
  })

  return withProfit
}