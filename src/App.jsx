import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import Layout from './Layout'
import HomePage from './pages/HomePage'
import AIPage from './pages/AIPage'
import AIMonitoringPage from './pages/AIMonitoringPage'
import ManualMonitoringPage from './pages/ManualMonitoringPage'
import MarketPage from './pages/MarketPage'
import CoinDetailPage from './pages/CoinDetailPage'
import TradePage from './pages/TradePage'
import HistoryPage from './pages/HistoryPage'
import SignalsPage from './pages/SignalsPage'
import SignalDetailPage from './pages/SignalDetailPage'
import StatisticsPage from './pages/StatisticsPage'
import SettingsPage from './pages/SettingsPage'
import TradeReasonPage from './pages/TradeReasonPage'
import BacktestPage from './pages/BacktestPage'
import SignalHistoryPage from './pages/SignalHistoryPage'
import MLTrainingPage from './pages/MLTrainingPage'
import OptimizationPage from './pages/OptimizationPage'
import LiveTestingPage from './pages/LiveTestingPage'
import BackendStatusPage from './pages/BackendStatusPage'
import PositionsPage from './pages/PositionsPage'

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed) {
      setShowOnboarding(true)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A]"></div>
  }

  if (showOnboarding) {
    return <OnboardingPage onComplete={() => setShowOnboarding(false)} />
  }

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
        <Route path="history" element={<HistoryPage />} />
        <Route path="signals" element={<SignalsPage />} />
        <Route path="signal-detail" element={<SignalDetailPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="trade-reason" element={<TradeReasonPage />} />
        <Route path="backtest" element={<BacktestPage />} />
        <Route path="signal-history" element={<SignalHistoryPage />} />
        <Route path="ml-training" element={<MLTrainingPage />} />
        <Route path="optimization" element={<OptimizationPage />} />
        <Route path="live-testing" element={<LiveTestingPage />} />
        <Route path="backend-status" element={<BackendStatusPage />} />
        <Route path="positions" element={<PositionsPage />} />
      </Route>
    </Routes>
  )
}