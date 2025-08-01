import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Smartphone, Bell, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'

interface PWAInstallProps {
  user: any
}

export default function PWAInstall({ user }: PWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === 'granted')
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      toast.success('App installed successfully! 📱')
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        setNotificationsEnabled(true)
        toast.success('Notifications enabled! 🔔')
        
        // Save notification settings
        if (user?.id) {
          await blink.db.notificationSettings.create({
            id: `notification_${Date.now()}`,
            userId: user.id,
            dailyReminderEnabled: true,
            reminderTime: '09:00'
          })
        }
        
        // Show test notification
        new Notification('No Noise', {
          body: 'Daily task reminders are now enabled!',
          icon: '/favicon.svg'
        })
      } else {
        setNotificationsEnabled(false)
        toast.error('Notifications permission denied')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Failed to enable notifications')
    }
  }

  const scheduleNotification = useCallback(() => {
    if (!notificationsEnabled) return

    // Schedule daily reminder (this would typically be done server-side)
    const now = new Date()
    const tomorrow9AM = new Date(now)
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1)
    tomorrow9AM.setHours(9, 0, 0, 0)
    
    const timeUntilNotification = tomorrow9AM.getTime() - now.getTime()
    
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('No Noise - Daily Reminder', {
          body: 'Time to focus on your top 5 tasks for today! 🎯',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'daily-reminder'
        })
      }
    }, timeUntilNotification)
  }, [notificationsEnabled])

  useEffect(() => {
    if (notificationsEnabled) {
      scheduleNotification()
    }
  }, [notificationsEnabled, scheduleNotification])

  return (
    <div className="space-y-4">
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Install No Noise App
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Add to your home screen for quick access and offline use
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstallClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowInstallPrompt(false)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Features Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {isInstalled ? 'App Installed' : 'Install App'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isInstalled 
                      ? 'No Noise is installed on your device' 
                      : 'Add to home screen for better experience'
                    }
                  </p>
                </div>
              </div>
              {isInstalled && (
                <div className="text-green-500">✓</div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Daily Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified to focus on your daily tasks
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  if (checked && notificationPermission !== 'granted') {
                    requestNotificationPermission()
                  } else {
                    setNotificationsEnabled(checked)
                  }
                }}
              />
            </div>

            {notificationPermission === 'denied' && (
              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                Notifications are blocked. Enable them in your browser settings to receive daily reminders.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PWA Benefits */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3">App Benefits</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Works offline - access your tasks anywhere</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Fast loading and smooth performance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Daily reminder notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <span>Home screen icon for quick access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}