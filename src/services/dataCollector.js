export class DataCollector {
  
    async collectHistoricalData(symbol, interval = '1h', limit = 1000) {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`
        )
        const candles = await res.json()
        
        return candles.map(c => ({
          timestamp: c[0],
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
          volume: parseFloat(c[5])
        }))
      } catch (err) {
        console.error('Data collection error:', err)
        return []
      }
    }
  
    async collectMultipleCoins(coins, interval = '1h', limit = 1000) {
      const promises = coins.map(coin => this.collectHistoricalData(coin, interval, limit))
      const results = await Promise.all(promises)
      
      const dataset = {}
      coins.forEach((coin, i) => {
        dataset[coin] = results[i]
      })
      
      return dataset
    }
  
    // Сохранить датасет
    saveDataset(dataset, filename = 'training_data.json') {
      const json = JSON.stringify(dataset)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    }
  }