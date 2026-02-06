import { useState } from 'react'
import { TrendingUp, Zap, Shield, ArrowRight } from 'lucide-react'

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0)

  const screens = [
    {
      icon: <TrendingUp size={64} className="text-[#00E5FF] mx-auto mb-6" />,
      title: 'AI Трейдинг',
      description: 'Умный AI анализирует рынок 24/7 используя ML модели, паттерны и sentiment analysis',
      features: ['15+ индикаторов', 'Machine Learning', 'Автоматические сделки']
    },
    {
      icon: <Zap size={64} className="text-orange-400 mx-auto mb-6" />,
      title: 'Ручной Мониторинг',
      description: 'Получай качественные сигналы для ручной торговли',
      features: ['Умные алерты', 'Копирование AI', 'Журнал трейдера']
    },
    {
      icon: <Shield size={64} className="text-green-500 mx-auto mb-6" />,
      title: 'Risk Management',
      description: 'Профессиональное управление капиталом',
      features: ['Kelly Criterion', 'Trailing Stop', 'Portfolio Heat Control']
    }
  ]

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    onComplete()
  }

  const currentScreen = screens[step]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between p-6">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {currentScreen.icon}
        
        <h1 className="text-3xl font-bold text-center mb-4 animate-fade-in">
          {currentScreen.title}
        </h1>
        
        <p className="text-gray-400 text-center mb-8 animate-fade-in">
          {currentScreen.description}
        </p>

        <div className="space-y-3 mb-8">
          {currentScreen.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-lg border border-gray-800 animate-scale-in">
              <div className="w-2 h-2 bg-[#00E5FF] rounded-full"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {screens.map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-[#00E5FF]' : 'w-2 bg-gray-700'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-md mx-auto w-full">
        {step < screens.length - 1 ? (
          <div className="flex gap-3">
            <button 
              onClick={handleComplete}
              className="flex-1 bg-gray-800 py-4 rounded-xl font-medium"
            >
              Пропустить
            </button>
            <button 
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-[#00E5FF] text-black py-4 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              Далее <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleComplete}
            className="w-full bg-[#00E5FF] text-black py-4 rounded-xl font-medium text-lg"
          >
            Начать торговлю
          </button>
        )}
      </div>
    </div>
  )
}