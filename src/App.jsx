import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import HomePage from './pages/HomePage'
import AIPage from './pages/AIPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="market" element={<div className="p-4 text-white">Market Page (скоро)</div>} />
        <Route path="trade" element={<div className="p-4 text-white">Trade Page (скоро)</div>} />
      </Route>
    </Routes>
  )
}