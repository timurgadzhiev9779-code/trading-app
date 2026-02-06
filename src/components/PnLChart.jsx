import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function PnLChart({ tradeHistory, initialBalance = 10000 }) {
  // Построение equity curve
  const equityCurve = []
  let balance = initialBalance
  
  const sortedHistory = [...tradeHistory].sort((a, b) => a.closeTime - b.closeTime)
  
  equityCurve.push({ date: 'Start', balance: initialBalance })
  
  sortedHistory.forEach(trade => {
    balance += parseFloat(trade.profit || 0)
    equityCurve.push({
      date: new Date(trade.closeTime).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
      balance: balance
    })
  })

  const data = {
    labels: equityCurve.map(e => e.date),
    datasets: [
      {
        label: 'Баланс',
        data: equityCurve.map(e => e.balance),
        borderColor: '#00E5FF',
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#00E5FF'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1A1A1A',
        titleColor: '#fff',
        bodyColor: '#00E5FF',
        borderColor: '#00E5FF',
        borderWidth: 1,
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#2A2A2A',
          drawBorder: false
        },
        ticks: {
          color: '#666'
        }
      },
      y: {
        grid: {
          color: '#2A2A2A',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          callback: (value) => `$${value}`
        }
      }
    }
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  )
}