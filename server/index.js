import express from 'express'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import dotenv from 'dotenv'
import { PositionMonitor } from './services/positionMonitor.js'
import { TelegramNotifier } from './services/telegramBot.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// WebSocket сервер
const wss = new WebSocketServer({ noServer: true })
const clients = new Set()

// Broadcast функция для отправки всем клиентам
const wsBroadcast = (message) => {
  const data = JSON.stringify(message)
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(data)
    }
  })
}

// Position Monitor
const monitor = new PositionMonitor(wsBroadcast)
const telegram = new TelegramNotifier()

// WebSocket соединения
wss.on('connection', (ws) => {
  console.log('✅ Frontend подключен')
  clients.add(ws)

  // Отправляем текущие позиции
  ws.send(JSON.stringify({
    type: 'INIT',
    data: monitor.getAllPositions()
  }))

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      handleWebSocketMessage(data, ws)
    } catch (err) {
      console.error('❌ Ошибка парсинга сообщения:', err)
    }
  })

  ws.on('close', () => {
    console.log('🔴 Frontend отключен')
    clients.delete(ws)
  })
})

// Обработка сообщений от frontend
function handleWebSocketMessage(data, ws) {
  const { type, payload } = data

  switch (type) {
    case 'ADD_POSITION':
      monitor.addPosition(payload)
      break

    case 'REMOVE_POSITION':
      monitor.removePosition(payload.id)
      break

    case 'SYNC_POSITIONS':
      monitor.syncPositions(payload)
      break

    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG' }))
      break

    default:
      console.log('⚠️ Неизвестный тип сообщения:', type)
  }
}

// REST API endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    positions: monitor.getAllPositions().length,
    timestamp: Date.now()
  })
})

// Получить все позиции
app.get('/api/positions', (req, res) => {
  res.json({
    positions: monitor.getAllPositions()
  })
})

// Добавить позицию
app.post('/api/positions', (req, res) => {
  const position = req.body
  
  if (!position.id || !position.pair || !position.entry || !position.tp || !position.sl) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  monitor.addPosition(position)
  res.json({ success: true, position })
})

// Удалить позицию
app.delete('/api/positions/:id', (req, res) => {
  const id = parseInt(req.params.id)
  monitor.removePosition(id)
  res.json({ success: true })
})

// Синхронизация позиций
app.post('/api/sync', (req, res) => {
  const { positions } = req.body
  
  if (!Array.isArray(positions)) {
    return res.status(400).json({ error: 'positions must be an array' })
  }

  monitor.syncPositions(positions)
  res.json({ 
    success: true, 
    monitoring: monitor.getAllPositions().length 
  })
})

// Тестовое уведомление
app.post('/api/test-notification', async (req, res) => {
  await telegram.send('🧪 Тест уведомления из backend')
  res.json({ success: true })
})

// Получить историю закрытых позиций
app.get('/api/closed-history', (req, res) => {
  const since = req.query.since ? parseInt(req.query.since) : null
  const history = monitor.getClosedHistory(since)

  res.json({
    history,
    count: history.length
  })
})

// Очистить старую историю (старше 7 дней)
app.post('/api/clean-history', (req, res) => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  monitor.clearOldHistory(weekAgo)
  res.json({ success: true })
})

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 TRADING BACKEND SERVER            ║
║   📡 Port: ${PORT}                      ║
║   🤖 WebSocket: READY                  ║
║   📱 Telegram: READY                   ║
╚════════════════════════════════════════╝
  `)
  
  telegram.notifyServerStart()
})

// WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка сервера...')
  monitor.stopAll()
  server.close(() => {
    console.log('✅ Сервер остановлен')
    process.exit(0)
  })
})

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err)
})