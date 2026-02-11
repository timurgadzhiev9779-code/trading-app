// src/services/coingecko.js
const BLOCKED_COINS = [
  'HYPE', 'ASTR', 'DOGE2', 'SHIB2', 'LUNA2', 'LUNC', 'UST', 'USTC'
]

export class CoinGeckoAPI {
  constructor() {
    this.baseURL = 'https://api.coingecko.com/api/v3'
    this.cache = null
    this.lastUpdate = 0
    this.updateInterval = 5 * 60 * 1000 // 5 минут
  }

  async getTopCoins(limit = 1000) {
    const now = Date.now()
    
    // Кеш на 5 минут
    if (this.cache && (now - this.lastUpdate) < this.updateInterval) {
      console.log('📦 CoinGecko: Кеш')
      return this.cache.slice(0, limit)
    }

    try {
      const perPage = 250 // Максимум за запрос
      const pages = Math.ceil(limit / perPage) // Сколько страниц нужно
      
      const promises = []
      
      // Делаем несколько запросов параллельно
      for (let page = 1; page <= pages; page++) {
        promises.push(
          fetch(
            `${this.baseURL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`
          ).then(r => r.json())
        )
      }
      
      // Ждём все запросы
      const results = await Promise.all(promises)
      
      // Объединяем результаты
      const allCoins = results.flat()
      
      this.cache = allCoins
        .filter(coin => !BLOCKED_COINS.includes(coin.symbol.toUpperCase()))
        .map(coin => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          image: coin.image,
          rank: coin.market_cap_rank
        }))
      
      this.lastUpdate = now
      console.log(`✅ CoinGecko: Обновлено ${this.cache.length} монет`)
      
      return this.cache.slice(0, limit)
    } catch (err) {
      console.error('❌ CoinGecko error:', err)
      return this.cache?.slice(0, limit) || []
    }
  }
}

// Старые функции для совместимости
export async function getTopCoins(limit = 100) {
  const api = new CoinGeckoAPI()
  return api.getTopCoins(limit)
}

export function isBlocked(symbol) {
  return BLOCKED_COINS.includes(symbol.toUpperCase())
}

export function addToBlocklist(symbol) {
  if (!BLOCKED_COINS.includes(symbol.toUpperCase())) {
    BLOCKED_COINS.push(symbol.toUpperCase())
  }
}