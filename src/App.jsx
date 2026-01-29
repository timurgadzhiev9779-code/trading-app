import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import HomePage from './pages/HomePage'
import AIPage from './pages/AIPage'
import AIMonitoringPage from './pages/AIMonitoringPage'
import ManualMonitoringPage from './pages/ManualMonitoringPage'
import MarketPage from './pages/MarketPage'
import CoinDetailPage from './pages/CoinDetailPage'
import TradePage from './pages/TradePage'
import HistoryPage from './pages/HistoryPage'   // ✅ добавлено
import SignalsPage from './pages/SignalsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="ai/monitoring" element={<AIMonitoringPage />} />
        <Route path="ai/manual-monitoring" element={<ManualMonitoringPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="market/:symbol" element={<CoinDetailPage />} />
        <Route path="trade" element={<TradePage />} />
        <Route path="history" element={<HistoryPage />} />   {/* ✅ добавлено */}
        <Route path="signals" element={<SignalsPage />} />
      </Route>
    </Routes>
  )
}
