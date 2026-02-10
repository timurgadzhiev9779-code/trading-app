import WebSocket from 'ws'

export class BinanceWebSocket {
  constructor() {
    this.connections = new Map()
    this.priceCallbacks = new Map()
  }

  // Подписка на пару
  subscribe(pair, callback) {
    const symbol = pair.replace('/', '').toLowerCase()
    
    console.log(`📡 Подписка на ${symbol}`)
    
    // Сохраняем callback
    if (!this.priceCallbacks.has(symbol)) {
      this.priceCallbacks.set(symbol, [])
    }
    this.priceCallbacks.get(symbol).push(callback)
    
    // Создаём WebSocket если его нет
    if (!this.connections.has(symbol)) {
      this.createConnection(symbol)
    }
  }

  // Отписка от пары
  unsubscribe(pair, callback) {
    const symbol = pair.replace('/', '').toLowerCase()
    
    if (this.priceCallbacks.has(symbol)) {
      const callbacks = this.priceCallbacks.get(symbol)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      
      // Если больше нет подписчиков - закрываем соединение
      if (callbacks.length === 0) {
        this.closeConnection(symbol)
      }
    }
  }

  // Создание WebSocket соединения
  createConnection(symbol) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@trade`
    const ws = new WebSocket(wsUrl)
    
    ws.on('open', () => {
      console.log(`✅ WebSocket открыт: ${symbol}`)
    })
    
    ws.on('message', (data) => {
      try {
        const trade = JSON.parse(data)
        const price = parseFloat(trade.p)
        
        // Вызываем все callbacks для этой пары
        const callbacks = this.priceCallbacks.get(symbol) || []
        callbacks.forEach(cb => cb(price))
      } catch (err) {
        console.error('Ошибка парсинга:', err)
      }
    })
    
    ws.on('error', (err) => {
      console.error(`❌ WebSocket ошибка ${symbol}:`, err.message)
    })
    
    ws.on('close', () => {
      console.log(`🔴 WebSocket закрыт: ${symbol}`)
      this.connections.delete(symbol)
      
      // Переподключаемся если есть подписчики
      if (this.priceCallbacks.has(symbol) && this.priceCallbacks.get(symbol).length > 0) {
        console.log(`🔄 Переподключение ${symbol}...`)
        setTimeout(() => this.createConnection(symbol), 5000)
      }
    })
    
    this.connections.set(symbol, ws)
  }

  // Закрытие соединения
  closeConnection(symbol) {
    if (this.connections.has(symbol)) {
      this.connections.get(symbol).close()
      this.connections.delete(symbol)
      this.priceCallbacks.delete(symbol)
      console.log(`❌ Отписка от ${symbol}`)
    }
  }

  // Закрытие всех соединений
  closeAll() {
    console.log('🔴 Закрытие всех WebSocket соединений...')
    this.connections.forEach((ws, symbol) => {
      ws.close()
    })
    this.connections.clear()
    this.priceCallbacks.clear()
  }
}