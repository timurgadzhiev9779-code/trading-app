// Сервис для работы с AI трейдингом

const BACKEND_URL = 'http://104.248.245.135:3001'

export class AITradingService {
  
  // Получить текущий режим AI
  async getCurrentMode() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-mode/current`)
      return await response.json()
    } catch (err) {
      console.error('Ошибка получения AI режима:', err)
      return null
    }
  }
  
  // Установить режим AI
  async setMode(mode) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-mode/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка установки AI режима:', err)
      return null
    }
  }
  
  // Получить все доступные режимы
  async getAllModes() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-modes`)
      return await response.json()
    } catch (err) {
      console.error('Ошибка получения режимов:', err)
      return []
    }
  }
  
  // Валидация сигнала
  async validateSignal(signal, mode) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/validate-ai-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal, mode })
      })
      return await response.json()
    } catch (err) {
      console.error('Ошибка валидации сигнала:', err)
      return { valid: false, reason: 'Ошибка связи с сервером' }
    }
  }
}