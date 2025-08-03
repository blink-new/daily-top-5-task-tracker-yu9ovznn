import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'

interface IdleDetectionProps {
  user: any
  isEnabled?: boolean
}

export default function IdleDetection({ user, isEnabled = true }: IdleDetectionProps) {
  const [isIdle, setIsIdle] = useState(false)
  const [idleTime, setIdleTime] = useState(0)
  const [showIdleMessage, setShowIdleMessage] = useState(false)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const idleStartRef = useRef<Date | null>(null)
  const lastActivityRef = useRef<Date>(new Date())

  const IDLE_THRESHOLD = 5 * 60 * 1000 // 5 minutes in milliseconds

  const logIdleSession = useCallback(async () => {
    if (!user?.id || !idleStartRef.current) return
    
    const endTime = new Date()
    const durationMinutes = Math.round((endTime.getTime() - idleStartRef.current.getTime()) / (1000 * 60))
    
    if (durationMinutes > 0) {
      try {
        await blink.db.idleSessions.create({
          id: `idle_${Date.now()}`,
          userId: user.id,
          startTime: idleStartRef.current.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          date: new Date().toISOString().split('T')[0]
        })
        
        console.log(`Logged idle session: ${durationMinutes} minutes`)
      } catch (error) {
        console.error('Error logging idle session:', error)
      }
    }
  }, [user?.id])

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = new Date()
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    
    if (isIdle) {
      // Log idle session if we were idle
      logIdleSession()
      setIsIdle(false)
      setShowIdleMessage(false)
      setIdleTime(0)
      idleStartRef.current = null
    }
    
    if (isEnabled) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true)
        setShowIdleMessage(true)
        idleStartRef.current = new Date()
      }, IDLE_THRESHOLD)
    }
  }, [IDLE_THRESHOLD, isEnabled, isIdle, logIdleSession])

  const dismissIdleMessage = () => {
    setShowIdleMessage(false)
    resetIdleTimer()
  }

  // Track idle time while idle
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isIdle && idleStartRef.current) {
      interval = setInterval(() => {
        const now = new Date()
        const minutes = Math.round((now.getTime() - idleStartRef.current!.getTime()) / (1000 * 60))
        setIdleTime(minutes)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isIdle])

  // Set up activity listeners
  useEffect(() => {
    if (!isEnabled) return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetIdleTimer()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Start the initial timer
    resetIdleTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      
      // Log final idle session if component unmounts while idle
      if (isIdle) {
        logIdleSession()
      }
    }
  }, [isEnabled, isIdle, logIdleSession, resetIdleTimer, user?.id])

  if (!showIdleMessage) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Still working on your top 5?
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  You've been idle for {idleTime} minute{idleTime !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={dismissIdleMessage}
                  className="border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                >
                  I'm back!
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismissIdleMessage}
                  className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}