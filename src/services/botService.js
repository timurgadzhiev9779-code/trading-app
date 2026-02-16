// Сервис для управления AI ботами

const BACKEND_URL = ''

export class BotService {
  
  // Получить статус всех ботов
  async getBotsStatus() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/status`)
      return await response.json()
    } catch (err) {
      console.error('Ошибка получения статуса ботов:', err)
      return null
    }
  }

  // Запустить все боты
  async startAll() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/start-all`, {
        method: 'POST'
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка запуска ботов:', err)
      return { success: false }
    }
  }

  // Остановить все боты
  async stopAll() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/stop-all`, {
        method: 'POST'
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка остановки ботов:', err)
      return { success: false }
    }
  }

  // Запустить конкретный бот
  async startBot(botId) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/start/${botId}`, {
        method: 'POST'
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка запуска бота:', err)
      return { success: false }
    }
  }

  // Остановить конкретный бот
  async stopBot(botId) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bots/stop/${botId}`, {
        method: 'POST'
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка остановки бота:', err)
      return { success: false }
    }
  }
}