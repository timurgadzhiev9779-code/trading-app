export function formatPrice(price) {
  if (!price || price === 0) return '$0.00'
  
  const num = parseFloat(price)
  
  if (num >= 1000) {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
  if (num >= 1) {
    return '$' + num.toFixed(2)
  }
  if (num >= 0.01) {
    return '$' + num.toFixed(4)
  }
  if (num >= 0.0001) {
    return '$' + num.toFixed(6)
  }
  return '$' + num.toFixed(8)
}