export const portfolio = {
  balance: 10000,
  available: 10000,
  pnl: 0,
  pnlPercent: 0
}
  
  export const coins = [
    { symbol: 'BTC', name: 'Bitcoin', price: 95180, change: 2.52, volume: '42.50B', cap: '1.87T' },
    { symbol: 'ETH', name: 'Ethereum', price: 3425, change: 2.54, volume: '18.30B', cap: '411.2B' },
    { symbol: 'SOL', name: 'Solana', price: 195.20, change: -2.15, volume: '4.20B', cap: '89.5B' },
    { symbol: 'AVAX', name: 'Avalanche', price: 38.45, change: 3.22, volume: '1.80B', cap: '15.2B' },
    { symbol: 'LINK', name: 'Chainlink', price: 14.92, change: 3.11, volume: '890M', cap: '8.9B' },
  ]
  
  export const aiSignals = [
    { pair: 'BTC/USDT', confidence: 78, direction: 'LONG', entry: 95200, tp: 98450, sl: 93100, profit: 104.27, profitPercent: 0.74 },
    { pair: 'ETH/USDT', confidence: 76, direction: 'LONG', entry: 3420, tp: 3600, sl: 3280, profit: 168.46, profitPercent: 1.99 },
  ]
  
  export const positions = {
    ai: [
      { pair: 'BTC/USDT', type: 'LONG', entry: 92500, tp: 98000, sl: 91500, profit: 80.76, profitPercent: 0.57, time: '2h' },
      { pair: 'ETH/USDT', type: 'LONG', entry: 3280, tp: 3600, sl: 3150, profit: 153.72, profitPercent: 1.82, time: '5h' },
    ],
    manual: [
      { pair: 'SOL/USDT', type: 'LONG', entry: 185, tp: 198, sl: 180, profit: -60, profitPercent: -2.15, time: '1h' },
    ]
  }