export default function TradingHeatmap({ tradeHistory }) {
    // Группировка по часам и дням недели
    const heatmapData = Array(7).fill(null).map(() => Array(24).fill(0))
    const counts = Array(7).fill(null).map(() => Array(24).fill(0))
    
    tradeHistory.forEach(trade => {
      const date = new Date(trade.closeTime)
      const day = date.getDay()
      const hour = date.getHours()
      
      heatmapData[day][hour] += parseFloat(trade.profit || 0)
      counts[day][hour] += 1
    })
  
    // Средняя прибыль на сделку
    const avgProfit = heatmapData.map((day, i) => 
      day.map((hour, j) => counts[i][j] > 0 ? hour / counts[i][j] : 0)
    )
  
    // Нормализация для цвета
    const flat = avgProfit.flat()
    const max = Math.max(...flat)
    const min = Math.min(...flat)
  
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex gap-1 mb-2">
            <div className="w-8"></div>
            {Array(24).fill(0).map((_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-gray-400">
                {i}
              </div>
            ))}
          </div>
          
          {avgProfit.map((day, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <div className="w-8 text-xs text-gray-400 flex items-center">
                {days[i]}
              </div>
              {day.map((hour, j) => {
                const normalized = max !== min ? (hour - min) / (max - min) : 0
                const color = hour > 0 
                  ? `rgba(16, 185, 129, ${0.2 + normalized * 0.8})` // green
                  : hour < 0
                  ? `rgba(239, 68, 68, ${0.2 + Math.abs(normalized) * 0.8})` // red
                  : 'rgba(55, 65, 81, 0.3)' // gray
                
                return (
                  <div 
                    key={j} 
                    className="flex-1 h-6 rounded"
                    style={{ backgroundColor: color }}
                    title={`${days[i]} ${j}:00 - ${counts[i][j]} trades, avg $${hour.toFixed(2)}`}
                  ></div>
                )
              })}
            </div>
          ))}
          
          <div className="flex gap-4 mt-4 text-xs justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-400">Убыток</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
              <span className="text-gray-400">Нет данных</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-400">Прибыль</span>
            </div>
          </div>
        </div>
      </div>
    )
  }