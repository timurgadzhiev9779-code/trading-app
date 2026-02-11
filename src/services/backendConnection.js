export class BackendConnection {
    constructor() {
      this.ws = null
      this.isConnected = false
      this.reconnectAttempts = 0
      this.maxReconnectAttempts = 5
      this.reconnectDelay = 3000
      this.callbacks = {
        onConnect: null,
        onDisconnect: null,
        onPositionClosed: null,
        onPriceUpdate: null
      }
      
      // Всегда используем VPS backend
      this.wsUrl = 'ws://104.248.245.135:3001'
      this.apiUrl = 'http://104.248.245.135:3001'
    }
  
    // Подключение к backend
    connect() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('⚠️ Уже подключено к backend')
        return
      }
  
      console.log('🔌 Подключение к backend...')
  
      try {
        this.ws = new WebSocket(this.wsUrl)
  
        this.ws.onopen = () => {
          console.log('✅ Подключено к backend')
          this.isConnected = true
          this.reconnectAttempts = 0
          
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect()
          }
        }
  
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (err) {
            console.error('❌ Ошибка парсинга сообщения:', err)
          }
        }
  
        this.ws.onerror = (error) => {
          console.error('❌ WebSocket ошибка:', error)
        }
  
        this.ws.onclose = () => {
          console.log('🔴 Отключено от backend')
          this.isConnected = false
          
          if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect()
          }
  
          // Попытка переподключения
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`🔄 Переподключение... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
            setTimeout(() => this.connect(), this.reconnectDelay)
          } else {
            console.log('❌ Не удалось подключиться к backend')
          }
        }
      } catch (err) {
        console.error('❌ Ошибка создания WebSocket:', err)
      }
    }
  
    // Обработка сообщений от backend
    handleMessage(message) {
      const { type, data } = message
  
      switch (type) {
        case 'INIT':
          console.log('📦 Получены позиции с backend:', data.length)
          break
  
          case 'POSITION_CLOSED':
            console.log('🎯 Backend закрыл позицию:', data)
            if (this.callbacks.onPositionClosed) {
              this.callbacks.onPositionClosed(data)
            }
            break
  
          case 'POSITION_ALREADY_CLOSED':
            console.log('🚫 Позиция уже закрыта backend:', data)
            if (this.callbacks.onPositionAlreadyClosed) {
              this.callbacks.onPositionAlreadyClosed(data)
            }
            break
    
          case 'PRICE_UPDATE':
          if (this.callbacks.onPriceUpdate) {
            this.callbacks.onPriceUpdate(data)
          }
          break
  
        case 'PONG':
          // Ответ на ping
          break
  
        default:
          console.log('⚠️ Неизвестный тип сообщения:', type)
      }
    }
  
    // Отправка сообщения в backend
    send(type, payload) {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ Backend не подключен, используем REST API fallback')
        this.fallbackToREST(type, payload)
        return
      }
  
      this.ws.send(JSON.stringify({ type, payload }))
    }
  
    // Fallback на REST API если WebSocket не работает
    async fallbackToREST(type, payload) {
      try {
        switch (type) {
          case 'ADD_POSITION':
            await fetch(`${this.apiUrl}/api/positions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            break
  
          case 'REMOVE_POSITION':
            await fetch(`${this.apiUrl}/api/positions/${payload.id}`, {
              method: 'DELETE'
            })
            break
  
          case 'SYNC_POSITIONS':
            await fetch(`${this.apiUrl}/api/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ positions: payload })
            })
            break
        }
      } catch (err) {
        console.error('❌ REST API error:', err)
      }
    }
  
    // Добавить позицию в мониторинг
    addPosition(position) {
      console.log('➕ Отправляем позицию в backend:', position.pair)
      this.send('ADD_POSITION', position)
    }
  
    // Удалить позицию из мониторинга
    removePosition(id) {
      console.log('➖ Удаляем позицию из backend:', id)
      this.send('REMOVE_POSITION', { id })
    }
  
    // Синхронизация всех позиций
    syncPositions(positions) {
      console.log('🔄 Синхронизация позиций с backend:', positions.length)
      this.send('SYNC_POSITIONS', positions)
    }
  
    // Ping для проверки соединения
    ping() {
      this.send('PING', {})
    }
  
    // Установка callbacks
    onConnect(callback) {
      this.callbacks.onConnect = callback
    }
  
    onDisconnect(callback) {
      this.callbacks.onDisconnect = callback
    }
  
    onPositionClosed(callback) {
      this.callbacks.onPositionClosed = callback
    }
  
    onPriceUpdate(callback) {
      this.callbacks.onPriceUpdate = callback
    }

    onPositionAlreadyClosed(callback) {
      this.callbacks.onPositionAlreadyClosed = callback
    }
  
    // Отключение
    disconnect() {
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
    }
  
    // Проверка здоровья сервера
    async healthCheck() {
      try {
        const res = await fetch(`${this.apiUrl}/health`)
        const data = await res.json()
        return data
      } catch (err) {
        return null
      }
    }
  }