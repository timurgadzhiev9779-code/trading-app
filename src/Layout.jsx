import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, Zap, Bot } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Home, label: 'Обзор' },
    { path: '/market', icon: TrendingUp, label: 'Рынки' },
    { path: '/trade', icon: Zap, label: 'Торговля' },
    { path: '/ai', icon: Bot, label: 'AI' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Outlet />
      
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-gray-800">
        <div className="max-w-md mx-auto flex justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-[#00E5FF]' : 'text-gray-400'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}