const STORAGE_KEYS = {
    PORTFOLIO: 'portfolio',
    POSITIONS: 'positions',
    HISTORY: 'tradeHistory',
    AI_ENABLED: 'aiEnabled',
    MONITORING: 'aiMonitoring'
  }
  
  export const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (err) {
      console.error('Storage save error:', err)
    }
  }
  
  export const loadFromStorage = (key, defaultValue) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (err) {
      console.error('Storage load error:', err)
      return defaultValue
    }
  }
  
  export const clearStorage = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  }
  
  export default STORAGE_KEYS