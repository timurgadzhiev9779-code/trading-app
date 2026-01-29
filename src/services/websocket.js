export const connectPriceStream = (symbol, callback) => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@ticker`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback({
        price: parseFloat(data.c),
        change: parseFloat(data.P)
      })
    }
  
    ws.onerror = (err) => console.error('WebSocket error:', err)
    
    return ws
  }