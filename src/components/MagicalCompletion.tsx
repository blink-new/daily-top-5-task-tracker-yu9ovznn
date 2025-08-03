import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface MagicalCompletionProps {
  isVisible: boolean
  onComplete: () => void
  streak: number
}

export default function MagicalCompletion({ isVisible, onComplete, streak }: MagicalCompletionProps) {
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowParticles(true)
      
      // Trigger confetti based on streak
      const confettiConfig = {
        particleCount: Math.min(100 + (streak * 10), 300),
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      }

      // Multiple bursts for higher streaks
      const burstCount = Math.min(Math.floor(streak / 5) + 1, 3)
      
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          confetti(confettiConfig)
        }, i * 200)
      }

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowParticles(false)
        onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, streak, onComplete])

  const getStreakMessage = () => {
    if (streak >= 30) return "🏆 LEGENDARY! 30+ day streak!"
    if (streak >= 21) return "🔥 ON FIRE! 21+ day streak!"
    if (streak >= 14) return "⚡ UNSTOPPABLE! 2+ week streak!"
    if (streak >= 7) return "🌟 AMAZING! 1+ week streak!"
    if (streak >= 3) return "💪 BUILDING MOMENTUM!"
    return "🎉 GREAT JOB!"
  }

  const getStreakEmoji = () => {
    if (streak >= 30) return "🏆"
    if (streak >= 21) return "🔥"
    if (streak >= 14) return "⚡"
    if (streak >= 7) return "🌟"
    if (streak >= 3) return "💪"
    return "🎉"
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background border rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {getStreakEmoji()}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-2xl font-bold mb-2"
            >
              All Tasks Complete!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg text-primary font-medium mb-4"
            >
              {getStreakMessage()}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-2"
            >
              <p className="text-muted-foreground">
                You've cut through the noise and focused on what matters most.
              </p>
              {streak > 1 && (
                <p className="text-sm text-accent font-medium">
                  Current streak: {streak} days
                </p>
              )}
            </motion.div>

            {/* Floating particles */}
            {showParticles && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: Math.random() * 400 - 200,
                      y: Math.random() * 300 - 150
                    }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0],
                      y: [0, -100],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: Math.random() * 0.5,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 bg-primary rounded-full"
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}