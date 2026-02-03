// src/services/coingecko.js
const BLOCKED_COINS = [
    'HYPE', 'ASTR', 'DOGE2', 'SHIB2', 'LUNA2', 'LUNC', 'UST', 'USTC'
  ]
  
  export async function getTopCoins(limit = 100) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d`
      )
      const data = await res.json()
      
      return data
        .filter(coin => !BLOCKED_COINS.includes(coin.symbol.toUpperCase()))
        .map((coin, index) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          slug: coin.id,
          rank: index + 1,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          change7d: coin.price_change_percentage_7d_in_currency || 0,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          circulatingSupply: coin.circulating_supply,
          image: coin.image,
          isBlocked: false
        }))
    } catch (err) {
      console.error('CoinGecko API error:', err)
      return []
    }
  }
  
  export function isBlocked(symbol) {
    return BLOCKED_COINS.includes(symbol.toUpperCase())
  }
  
  export function addToBlocklist(symbol) {
    if (!BLOCKED_COINS.includes(symbol.toUpperCase())) {
      BLOCKED_COINS.push(symbol.toUpperCase())
    }
  }