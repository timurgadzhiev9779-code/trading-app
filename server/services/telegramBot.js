import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

export class TelegramNotifier {
  constructor() {
    this.bot = null
    this.chatId = process.env.TELEGRAM_CHAT_ID
    this.init()
  }

  init() {
    try {
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.log('⚠️ TELEGRAM_BOT_TOKEN не указан в .env')
        return
      }

      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
      console.log('✅ Telegram Bot инициализирован')
    } catch (err) {
      console.error('❌ Ошибка инициализации Telegram:', err.message)
    }
  }

  // Отправка уведомления о Take Profit
  async notifyTP(position, profit, profitPercent) {
    const message = `
🎯 <b>Take Profit</b>

💰 ${position.pair}
📈 Entry: $${position.entry.toFixed(2)}
🎯 TP: $${position.tp.toFixed(2)}
💵 Profit: <b>+$${profit.toFixed(2)}</b> (+${profitPercent.toFixed(2)}%)
⏱ Duration: ${this.getDuration(position.openTime)}
🤖 Type: ${position.isAI ? 'AI' : 'Manual'}
    `.trim()

    await this.send(message)
  }

  // Отправка уведомления о Stop Loss
  async notifySL(position, loss, lossPercent) {
    const message = `
🛡️ <b>Stop Loss</b>

💰 ${position.pair}
📈 Entry: $${position.entry.toFixed(2)}
🛑 SL: $${position.sl.toFixed(2)}
📉 Loss: <b>$${loss.toFixed(2)}</b> (${lossPercent.toFixed(2)}%)
⏱ Duration: ${this.getDuration(position.openTime)}
🤖 Type: ${position.isAI ? 'AI' : 'Manual'}
    `.trim()

    await this.send(message)
  }

  // Уведомление об открытии позиции
  async notifyPositionOpen(position) {
    const message = `
🚀 <b>Позиция открыта</b>

💰 ${position.pair} ${position.type}
📍 Entry: $${position.entry.toFixed(2)}
🎯 TP: $${position.tp.toFixed(2)}
🛑 SL: $${position.sl.toFixed(2)}
💵 Amount: $${position.amount.toFixed(2)}
🤖 Type: ${position.isAI ? 'AI' : 'Manual'}
    `.trim()

    await this.send(message)
  }

  // Ежедневный отчёт
  async sendDailyReport(stats) {
    const message = `
📊 <b>Ежедневный отчёт</b>

📅 ${new Date().toLocaleDateString('ru-RU')}

📈 Сделок: ${stats.totalTrades}
✅ Wins: ${stats.wins} (${stats.winRate}%)
❌ Losses: ${stats.losses}
💰 P&L: ${stats.profit >= 0 ? '+' : ''}$${stats.profit}
📊 Win Rate: ${stats.winRate}%
💎 Balance: $${stats.balance}
    `.trim()

    await this.send(message)
  }

  // Алерт о серии убытков
  async alertLosingStreak(count) {
    const message = `
⚠️ <b>ВНИМАНИЕ!</b>

🔴 Серия убытков: ${count} сделок подряд
💡 Рекомендуется остановить AI и проверить настройки
    `.trim()

    await this.send(message)
  }

  // Алерт о просадке
  async alertDrawdown(percent) {
    const message = `
⚠️ <b>ПРОСАДКА</b>

📉 Текущая просадка: ${percent.toFixed(2)}%
💡 Рекомендуется пересмотреть risk management
    `.trim()

    await this.send(message)
  }

  // Уведомление о запуске сервера
  async notifyServerStart() {
    const message = `
✅ <b>Сервер запущен</b>

🤖 Backend мониторинг 24/7 активен
📡 WebSocket подключения готовы
🎯 TP/SL мониторинг работает
    `.trim()

    await this.send(message)
  }

  // Базовая отправка сообщения
  async send(message) {
    if (!this.bot || !this.chatId) {
      console.log('📱 Telegram:', message.replace(/<[^>]*>/g, ''))
      return
    }

    try {
      await this.bot.sendMessage(this.chatId, message, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    } catch (err) {
      console.error('❌ Ошибка отправки в Telegram:', err.message)
    }
  }

  // Вычисление длительности позиции
  getDuration(openTime) {
    const duration = Date.now() - openTime
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }
}