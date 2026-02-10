import { BinanceWebSocket } from './binanceWS.js'
import { TelegramNotifier } from './telegramBot.js'
import fs from 'fs'

export class PositionMonitor {
  constructor(wsBroadcast) {
    this.positions = new Map() // id -> position
    this.binanceWS = new BinanceWebSocket()
    this.telegram = new TelegramNotifier()
    this.wsBroadcast = wsBroadcast // Функция для отправки в frontend
    this.priceCallbacks = new Map() // pair -> callback
    this.recentlyClosed = [] // 🔥 Недавно закрытые позиции
    //    ИСТОРИЯ ЗАКРЫТЫХ ПОЗИЦИЙ (последние 50)
    this.closedHistory = this.loadClosedHistory()
  }

  loadClosedHistory() {
    try {
      const saved = JSON.parse(fs.readFileSync('./closed_history.json', 'utf8'))
      return saved || []
    } catch {
      return []
    }
  }

  saveClosedHistory() {
    try {
      fs.writeFileSync('./closed_history.json', JSON.stringify(this.closedHistory.slice(-50), null, 2))
    } catch (err) {
      console.error('Ошибка сохранения истории:', err)
    }
  }

  // Добавить позицию в мониторинг
  addPosition(position) {
    console.log(`➕ Добавлена позиция: ${position.pair} (ID: ${position.id})`)
    
    this.positions.set(position.id, {
      ...position,
      currentPrice: position.entry,
      lastCheck: Date.now()
    })

    // Подписываемся на цену если ещё не подписаны
    if (!this.priceCallbacks.has(position.pair)) {
      const callback = (price) => this.onPriceUpdate(position.pair, price)
      this.priceCallbacks.set(position.pair, callback)
      this.binanceWS.subscribe(position.pair, callback)
    }

    // Уведомляем в Telegram
    this.telegram.notifyPositionOpen(position)

    // Уведомляем frontend
    this.wsBroadcast({
      type: 'POSITION_ADDED',
      data: position
    })
  }

  // Обновление цены
  onPriceUpdate(pair, price) {
    // Обновляем цену для всех позиций этой пары
    const positionsForPair = []
    
    for (const [id, position] of this.positions.entries()) {
      if (position.pair === pair) {
        position.currentPrice = price
        positionsForPair.push(position)
      }
    }

    if (positionsForPair.length > 0) {
      // Проверяем TP/SL для каждой позиции
      positionsForPair.forEach(position => {
        this.checkTPSL(position)
      })
    }

    // Отправляем цену во frontend
    this.wsBroadcast({
      type: 'PRICE_UPDATE',
      data: { pair, price }
    })
  }

  // Проверка TP/SL
  checkTPSL(position) {
    const { id, pair, entry, tp, sl, currentPrice, amount } = position

    // 🔥 ПРОВЕРЯЕМ ЧТО ПОЗИЦИЯ ЕЩЁ В МОНИТОРИНГЕ
    if (!this.positions.has(id)) {
      return // Уже закрыта
    }

    // Проверка Take Profit
    if (currentPrice >= tp) {
      console.log(`🎯 TP HIT: ${pair} (${currentPrice.toFixed(2)} >= ${tp.toFixed(2)})`)
      
      const profit = ((currentPrice - entry) / entry) * amount
      const profitPercent = ((currentPrice - entry) / entry) * 100

      // Закрываем позицию
      this.closePosition(id, 'TP', profit, profitPercent)
      return // Важно! Прерываем дальнейшую проверку
    }
    
    // Проверка Stop Loss
    if (currentPrice <= sl) {
      console.log(`🛡️ SL HIT: ${pair} (${currentPrice.toFixed(2)} <= ${sl.toFixed(2)})`)
      
      const loss = ((currentPrice - entry) / entry) * amount
      const lossPercent = ((currentPrice - entry) / entry) * 100

      // Закрываем позицию
      this.closePosition(id, 'SL', loss, lossPercent)
      return // Важно!
    }
  }

  // Закрытие позиции
  closePosition(id, reason, profit, profitPercent) {
    const position = this.positions.get(id)
    if (!position) {
      console.log(`⚠️ Позиция ID=${id} не найдена`)
      return
    }

    console.log(`✅ Закрываем позицию ${position.pair}: ${reason}, Profit: $${profit.toFixed(2)}`)

    //    ДОБАВЛЯЕМ В ИСТОРИЮ ЗАКРЫТЫХ
    const closedRecord = {
      id: position.id,
      pair: position.pair,
      type: position.type,
      entry: position.entry,
      exit: position.currentPrice,
      amount: position.amount,
      profit: parseFloat(profit.toFixed(2)),
      profitPercent: parseFloat(profitPercent.toFixed(2)),
      openTime: position.openTime,
      closeTime: Date.now(),
      reason,
      isAI: position.isAI
    }

    this.closedHistory.push(closedRecord)
    this.saveClosedHistory()

    // Уведомления
    if (reason === 'TP') {
      this.telegram.notifyTP(position, profit, profitPercent)
    } else if (reason === 'SL') {
      this.telegram.notifySL(position, profit, profitPercent)
    }

    // Удаляем из мониторинга
    this.positions.delete(id)
    console.log(`🗑️ Позиция удалена из мониторинга. Осталось: ${this.positions.size}`)

    // Отписка от WebSocket
    const hasPair = Array.from(this.positions.values()).some(p => p.pair === position.pair)
    if (!hasPair) {
      const callback = this.priceCallbacks.get(position.pair)
      if (callback) {
        this.binanceWS.unsubscribe(position.pair, callback)
        this.priceCallbacks.delete(position.pair)
        console.log(`📡 Отписка от ${position.pair}`)
      }
    }

    // Уведомляем frontend
    this.wsBroadcast({
      type: 'POSITION_CLOSED',
      data: closedRecord
    })
  }

  // Удалить позицию вручную (юзер закрыл)
  removePosition(id) {
    const position = this.positions.get(id)
    if (!position) return

    console.log(`➖ Удалена позиция: ${position.pair} (ID: ${id})`)
    
    this.positions.delete(id)

    // Проверяем - есть ли ещё позиции по этой паре
    const hasPair = Array.from(this.positions.values()).some(p => p.pair === position.pair)
    
    if (!hasPair) {
      const callback = this.priceCallbacks.get(position.pair)
      if (callback) {
        this.binanceWS.unsubscribe(position.pair, callback)
        this.priceCallbacks.delete(position.pair)
      }
    }
  }

  // Получить все позиции
  getAllPositions() {
    return Array.from(this.positions.values())
  }

  // Синхронизация позиций с frontend
  syncPositions(frontendPositions) {
    console.log(`🔄 Синхронизация: получено ${frontendPositions.length} позиций`)

    // 🔥 ФИЛЬТРУЕМ НЕДАВНО ЗАКРЫТЫЕ (5 минут)
    const now = Date.now()
    const validClosed = this.recentlyClosed.filter(c => now - c.time < 300000)

    // Удаляем позиции которых нет во frontend
    const frontendIds = new Set(frontendPositions.map(p => p.id))
    for (const id of this.positions.keys()) {
      if (!frontendIds.has(id)) {
        this.removePosition(id)
      }
    }

    // Добавляем новые позиции
    for (const pos of frontendPositions) {
      // 🔥 НЕ ДОБАВЛЯЕМ ЕСЛИ НЕДАВНО ЗАКРЫЛИ
      const wasClosedRecently = validClosed.some(c => c.id === pos.id || c.pair === pos.pair)
      
      if (wasClosedRecently) {
        console.log(`🚫 Позиция ${pos.pair} была закрыта недавно, не добавляем`)
        this.wsBroadcast({
          type: 'POSITION_ALREADY_CLOSED',
          data: { id: pos.id, pair: pos.pair }
        })
        continue
      }

      if (!this.positions.has(pos.id)) {
        this.addPosition(pos)
      }
    }

    console.log(`✅ Мониторится ${this.positions.size} позиций`)
  }

  //    ПОЛУЧИТЬ ИСТОРИЮ ЗАКРЫТЫХ
  getClosedHistory(since = null) {
    if (since) {
      return this.closedHistory.filter(h => h.closeTime > since)
    }
    return this.closedHistory
  }

  //    ОЧИСТИТЬ СТАРУЮ ИСТОРИЮ
  clearOldHistory(olderThan) {
    this.closedHistory = this.closedHistory.filter(h => h.closeTime > olderThan)
    this.saveClosedHistory()
  }

  // Остановить весь мониторинг
  stopAll() {
    console.log('🛑 Остановка мониторинга...')
    this.positions.clear()
    this.priceCallbacks.clear()
    this.binanceWS.closeAll()
  }
}