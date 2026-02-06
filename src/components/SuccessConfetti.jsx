import { useEffect, useState } from 'react'

export default function SuccessConfetti({ show, onComplete }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (show) {
      const newParticles = Array(30).fill(0).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ['#00E5FF', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 4)]
      }))
      setParticles(newParticles)

      setTimeout(() => {
        setParticles([])
        if (onComplete) onComplete()
      }, 3000)
    }
  }, [show])

  if (!show || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${p.left}%`,
            top: '50%',
            backgroundColor: p.color,
            animation: `confetti 2s ease-out ${p.delay}s`
          }}
        ></div>
      ))}
    </div>
  )
}