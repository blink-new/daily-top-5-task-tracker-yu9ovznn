import { useState, useEffect, useCallback, useRef } from 'react'
import { blink } from './blink/client'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Progress } from './components/ui/progress'
import { Calendar } from './components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Badge } from './components/ui/badge'
import { Switch } from './components/ui/switch'
import { Textarea } from './components/ui/textarea'
import { Slider } from './components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'
import { 
  Settings, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Moon, 
  Sun, 
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  BarChart3,
  Flame,
  BookOpen,
  Share2,
  Download,
  Bell,
  Trophy,
  Users,
  Zap,
  Coffee,
  AlertCircle,
  Smartphone,
  Gift,
  Camera,
  Twitter,
  Facebook,
  Copy,
  Lightbulb,
  Trash2
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isSameDay, differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { TwitterShareButton, FacebookShareButton } from 'react-share'

// Enhanced Components
import EnhancedTaskCard from './components/EnhancedTaskCard'
import MagicalCompletion from './components/MagicalCompletion'
import AIInsights from './components/AIInsights'
import OnboardingWizard from './components/OnboardingWizard'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  date: string
  userId: string
  category: string
  estimatedMinutes: number
  actualMinutes: number
  energyLevel: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  idleTime?: number
}

interface UserSettings {
  id: string
  userId: string
  resetTime: string
  timezone: string
  darkMode?: boolean
  soundEffects?: boolean
  dailyGoal?: number
  adaptiveCapacity?: boolean
  weeklyReflection?: string
}

interface UserStreak {
  id: string
  userId: string
  currentStreak: number
  longestStreak: number
  lastCompletionDate: string
}

interface StreakBadge {
  id: string
  userId: string
  badgeType: string
  earnedAt: string
  streakLength?: number
  taskTitle?: string
}

interface UserReferral {
  id: string
  userId: string
  referralCode: string
  referredUsers: string[]
  totalReferrals: number
}

const motivationalQuotes = [
  "Cut through the noise. Focus on what truly matters. 🎯",
  "Five priorities, zero distractions. Make today count! ✨",
  "Progress over perfection. Every step forward matters! 🚀",
  "Your future self will thank you for today's focus! 💪",
  "Small daily improvements lead to stunning results! 🌟",
  "Champions are made in the daily grind. Stay focused! 🏆",
  "Today's priorities become tomorrow's achievements! 🎉",
  "Excellence is a habit. Make it yours today! 💎",
  "Eliminate the noise. Amplify what matters. 🔥",
  "Clarity is power. Focus is freedom. ⚡"
]

const badgeConfig = {
  '3day': { icon: '🔥', title: '3-Day Streak', description: 'Consistency is building!' },
  '7day': { icon: '⚡', title: '1-Week Streak', description: 'You\'re on fire!' },
  '14day': { icon: '💎', title: '2-Week Streak', description: 'Diamond discipline!' },
  '30day': { icon: '👑', title: '30-Day Streak', description: 'Legendary focus!' },
  'mvp_task': { icon: '🏆', title: 'MVP Task', description: 'Most valuable task this week!' },
  'weekly_goal': { icon: '🎯', title: 'Weekly Goal', description: 'Crushed your weekly target!' }
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('work')
  const [newTaskEstimate, setNewTaskEstimate] = useState(30)
  const [newTaskEnergy, setNewTaskEnergy] = useState('medium')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarView, setCalendarView] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [completedTasksHistory, setCompletedTasksHistory] = useState<Task[]>([])
  const [dailyQuote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [weeklyReflection, setWeeklyReflection] = useState('')
  const [adaptiveCapacity, setAdaptiveCapacity] = useState(5)
  const [lifePriorities, setLifePriorities] = useState<any[]>([])
  const [newPriorityTitle, setNewPriorityTitle] = useState('')
  const [newPriorityDescription, setNewPriorityDescription] = useState('')
  const [additionalTasks, setAdditionalTasks] = useState('')
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  
  // New features state
  const [isIdle, setIsIdle] = useState(false)
  const [idleTime, setIdleTime] = useState(0)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [streakBadges, setStreakBadges] = useState<StreakBadge[]>([])
  const [userReferral, setUserReferral] = useState<UserReferral | null>(null)
  const [showIdleDialog, setShowIdleDialog] = useState(false)
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [weeklyGoalProgress, setWeeklyGoalProgress] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  
  const idleTimerRef = useRef<NodeJS.Timeout>()
  const activityTimerRef = useRef<NodeJS.Timeout>()
  const taskListRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Idle Detection System
  const resetIdleTimer = useCallback(() => {
    setLastActivity(Date.now())
    setIsIdle(false)
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    
    // Set 5-minute idle timer
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
      setShowIdleDialog(true)
      
      // Log idle time to analytics
      const idleStartTime = Date.now()
      setIdleTime(prev => prev + 5) // 5 minutes of idle time
      
      toast('Still working on your top 5? 🤔', {
        duration: 10000,
        icon: '⏰'
      })
    }, 5 * 60 * 1000) // 5 minutes
  }, [])

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetIdleTimer()
    }
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })
    
    resetIdleTimer()
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [resetIdleTimer])

  // PWA Installation Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setPwaInstallPrompt(e)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setPwaInstallPrompt(null)
      toast.success('No Noise installed successfully! 🎉')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  const loadTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const tasksData = await blink.db.tasks.list({
        where: { 
          userId: user.id,
          date: today
        },
        orderBy: { priority: 'asc' }
      })
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    }
  }, [user?.id])

  const loadSettings = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const settingsData = await blink.db.userSettings.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (settingsData && settingsData.length > 0) {
        const userSettings = settingsData[0]
        setSettings(userSettings)
        setIsDarkMode(Number(userSettings.darkMode) > 0)
        setAdaptiveCapacity(userSettings.dailyGoal || 5)
        setWeeklyReflection(userSettings.weeklyReflection || '')
      } else {
        const defaultSettings = {
          id: `settings_${Date.now()}`,
          userId: user.id,
          resetTime: '00:00',
          timezone: 'UTC',
          darkMode: false,
          soundEffects: true,
          dailyGoal: 5,
          adaptiveCapacity: false,
          weeklyReflection: ''
        }
        await blink.db.userSettings.create(defaultSettings)
        setSettings(defaultSettings)
        setIsDarkMode(false)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [user?.id])

  const loadStreak = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const streakData = await blink.db.userStreaks.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (streakData && streakData.length > 0) {
        setStreak(streakData[0])
      } else {
        const newStreak = {
          id: `streak_${Date.now()}`,
          userId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletionDate: ''
        }
        await blink.db.userStreaks.create(newStreak)
        setStreak(newStreak)
      }
    } catch (error) {
      console.error('Error loading streak:', error)
    }
  }, [user?.id])

  const loadCompletedTasksHistory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      // Load ALL completed tasks for the user (not filtered by date initially)
      const historyData = await blink.db.tasks.list({
        where: { 
          userId: user.id,
          completed: "1"
        },
        orderBy: { completedAt: 'desc' }
      })
      
      // Filter by calendar view after loading
      let filteredHistory = historyData || []
      
      if (calendarView !== 'monthly') {
        let startDate: Date
        let endDate: Date
        
        if (calendarView === 'daily') {
          startDate = selectedDate
          endDate = selectedDate
        } else {
          startDate = startOfWeek(selectedDate)
          endDate = endOfWeek(selectedDate)
        }
        
        filteredHistory = historyData?.filter(task => {
          const taskDate = parseISO(task.date)
          return taskDate >= startDate && taskDate <= endDate
        }) || []
      }
      
      setCompletedTasksHistory(filteredHistory)
    } catch (error) {
      console.error('Error loading completed tasks history:', error)
    }
  }, [user?.id, calendarView, selectedDate])

  const loadStreakBadges = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const badgesData = await blink.db.streakBadges.list({
        where: { userId: user.id },
        orderBy: { earnedAt: 'desc' }
      })
      setStreakBadges(badgesData || [])
    } catch (error) {
      console.error('Error loading streak badges:', error)
    }
  }, [user?.id])

  const loadUserReferral = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const referralData = await blink.db.userReferrals.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (referralData && referralData.length > 0) {
        const referral = referralData[0]
        setUserReferral({
          ...referral,
          referredUsers: JSON.parse(referral.referredUsers || '[]')
        })
      } else {
        // Generate unique referral code
        const referralCode = `NONOISE${user.id.slice(-6).toUpperCase()}`
        const newReferral = {
          id: `referral_${Date.now()}`,
          userId: user.id,
          referralCode,
          referredUsers: '[]',
          totalReferrals: 0
        }
        await blink.db.userReferrals.create(newReferral)
        setUserReferral({
          ...newReferral,
          referredUsers: []
        })
      }
    } catch (error) {
      console.error('Error loading user referral:', error)
    }
  }, [user?.id])

  const checkOnboardingStatus = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const onboardingData = await blink.db.onboardingProgress.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (!onboardingData || onboardingData.length === 0) {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
    }
  }, [user?.id])

  const loadLifePriorities = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const prioritiesData = await blink.db.lifePriorities.list({
        where: { userId: user.id },
        orderBy: { importanceLevel: 'desc' }
      })
      setLifePriorities(prioritiesData || [])
    } catch (error) {
      console.error('Error loading life priorities:', error)
    }
  }, [user?.id])

  // Generate AI Suggestions for task prioritization
  const generateAISuggestions = useCallback(async () => {
    if (!tasks.length) return
    
    const suggestions = [
      "Start with your highest energy task when you're most alert",
      "Group similar tasks together to maintain focus",
      "Tackle the most challenging task first (eat the frog!)",
      "Consider which task will have the biggest impact on your goals",
      "Balance different categories throughout your day"
    ]
    
    // Simple AI logic based on task patterns
    const categories = [...new Set(tasks.map(t => t.category))]
    const energyLevels = tasks.map(t => t.energyLevel)
    
    if (categories.length > 3) {
      suggestions.unshift("You have tasks across many categories - consider focusing on 2-3 areas today")
    }
    
    if (energyLevels.filter(e => e === 'high').length > 2) {
      suggestions.unshift("You have multiple high-energy tasks - schedule them for your peak hours")
    }
    
    setAiSuggestions(suggestions.slice(0, 3))
  }, [tasks])

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load user data when authenticated
  useEffect(() => {
    if (user?.id) {
      loadTasks()
      loadSettings()
      loadStreak()
      loadCompletedTasksHistory()
      checkOnboardingStatus()
      loadLifePriorities()
      loadStreakBadges()
      loadUserReferral()
      generateAISuggestions()
    }
  }, [user?.id, selectedDate, loadTasks, loadSettings, loadStreak, loadCompletedTasksHistory, checkOnboardingStatus, loadLifePriorities, loadStreakBadges, loadUserReferral, generateAISuggestions])

  // Daily Reset Functionality - FIXED to preserve completed tasks
  useEffect(() => {
    if (!user?.id || !settings?.resetTime) return

    const checkAndResetTasks = async () => {
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const resetTime = settings.resetTime
      const [hours, minutes] = resetTime.split(':').map(Number)
      
      const resetDateTime = new Date()
      resetDateTime.setHours(hours, minutes, 0, 0)
      
      const hasPassedResetTime = now >= resetDateTime
      const lastResetKey = `lastReset_${user.id}`
      const lastResetDate = localStorage.getItem(lastResetKey)
      
      if (hasPassedResetTime && lastResetDate !== today) {
        try {
          // IMPORTANT: Only delete incomplete tasks, preserve completed ones for history
          const incompleteTasks = tasks.filter(task => Number(task.completed) === 0)
          
          for (const task of incompleteTasks) {
            await blink.db.tasks.delete(task.id)
          }
          
          // Update completed tasks with completedAt timestamp if missing
          const completedTasks = tasks.filter(task => Number(task.completed) > 0)
          for (const task of completedTasks) {
            if (!task.completedAt) {
              await blink.db.tasks.update(task.id, { 
                completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
              })
            }
          }
          
          // Reload tasks to show only incomplete ones
          await loadTasks()
          
          localStorage.setItem(lastResetKey, today)
          toast.success(`🌅 Daily reset complete! Completed tasks saved to history.`)
          
          console.log(`Daily reset completed - preserved ${completedTasks.length} completed tasks`)
        } catch (error) {
          console.error('Error during daily reset:', error)
          toast.error('Failed to reset daily tasks')
        }
      }
    }

    checkAndResetTasks()
    const interval = setInterval(checkAndResetTasks, 60000)
    return () => clearInterval(interval)
  }, [user?.id, settings?.resetTime, tasks, loadTasks])

  const manualReset = async () => {
    if (!user?.id) return
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Only delete incomplete tasks
      const incompleteTasks = tasks.filter(task => Number(task.completed) === 0)
      for (const task of incompleteTasks) {
        await blink.db.tasks.delete(task.id)
      }
      
      // Update completed tasks with completedAt timestamp
      const completedTasks = tasks.filter(task => Number(task.completed) > 0)
      for (const task of completedTasks) {
        if (!task.completedAt) {
          await blink.db.tasks.update(task.id, { 
            completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
          })
        }
      }
      
      await loadTasks()
      
      const lastResetKey = `lastReset_${user.id}`
      localStorage.setItem(lastResetKey, today)
      
      toast.success(`🔄 Manual reset complete! ${completedTasks.length} completed tasks preserved.`)
    } catch (error) {
      console.error('Error during manual reset:', error)
      toast.error('Failed to reset tasks')
    }
  }

  const checkStreakBadges = async (currentStreak: number) => {
    if (!user?.id) return
    
    const badgeThresholds = [3, 7, 14, 30]
    const today = format(new Date(), 'yyyy-MM-dd')
    
    for (const threshold of badgeThresholds) {
      if (currentStreak >= threshold) {
        const badgeType = `${threshold}day`
        
        // Check if badge already exists
        const existingBadge = streakBadges.find(b => b.badgeType === badgeType)
        if (!existingBadge) {
          const newBadge = {
            id: `badge_${Date.now()}`,
            userId: user.id,
            badgeType,
            earnedAt: today,
            streakLength: currentStreak
          }
          
          await blink.db.streakBadges.create(newBadge)
          setStreakBadges(prev => [...prev, newBadge])
          
          const config = badgeConfig[badgeType as keyof typeof badgeConfig]
          toast.success(`${config.icon} Badge Earned: ${config.title}!`, {
            duration: 5000
          })
        }
      }
    }
  }

  const updateStreak = async (completed: boolean) => {
    if (!user?.id || !streak) return
    
    const today = format(new Date(), 'yyyy-MM-dd')
    const lastDate = streak.lastCompletionDate
    
    if (completed && lastDate !== today) {
      const daysSinceLastCompletion = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : 1
      
      let newCurrentStreak = streak.currentStreak
      if (daysSinceLastCompletion === 1) {
        newCurrentStreak += 1
      } else if (daysSinceLastCompletion > 1) {
        newCurrentStreak = 1
      }
      
      const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak)
      
      const updatedStreak = {
        ...streak,
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCompletionDate: today
      }
      
      await blink.db.userStreaks.update(streak.id, updatedStreak)
      setStreak(updatedStreak)
      
      // Check for streak badges
      await checkStreakBadges(newCurrentStreak)
    }
  }

  const addTask = async () => {
    if (!user?.id || !newTaskTitle.trim()) return
    
    const maxTasks = adaptiveCapacity || 5
    if (tasks.length >= maxTasks) {
      toast.error(`You can only have ${maxTasks} tasks per day! Focus on completing these first.`)
      return
    }
    
    try {
      const newTask = {
        id: `task_${Date.now()}`,
        userId: user.id,
        title: newTaskTitle.trim(),
        priority: tasks.length + 1,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd'),
        category: newTaskCategory,
        estimatedMinutes: newTaskEstimate,
        actualMinutes: 0,
        energyLevel: newTaskEnergy,
        idleTime: 0
      }
      
      await blink.db.tasks.create(newTask)
      setTasks([...tasks, newTask])
      setNewTaskTitle('')
      toast.success('Task added! 🎯')
      
      // Reset idle timer on task creation
      resetIdleTimer()
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      
      const isCompleting = !Number(task.completed)
      const completedAt = isCompleting ? format(new Date(), 'yyyy-MM-dd HH:mm:ss') : null
      
      const updatedTask = { 
        ...task, 
        completed: isCompleting,
        completedAt: completedAt || undefined
      }
      
      await blink.db.tasks.update(taskId, { 
        completed: isCompleting,
        completedAt: completedAt || undefined
      })
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
      
      if (isCompleting) {
        toast.success('Task completed! 🎉')
        
        const allCompleted = tasks.every(t => t.id === taskId || Number(t.completed) > 0)
        if (allCompleted && tasks.length === (settings?.dailyGoal || 5)) {
          setShowCompletion(true)
          await updateStreak(true)
        }
        
        // Reset idle timer on task completion
        resetIdleTimer()
      } else {
        toast.success('Task reopened')
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const taskToDelete = tasks.find(t => t.id === taskId)
      if (!taskToDelete) return
      
      const updatedTasks = tasks.filter(t => t.id !== taskId)
      const reorderedTasks = updatedTasks.map((task, index) => ({
        ...task,
        priority: index + 1
      }))
      
      setTasks(reorderedTasks)
      
      await blink.db.tasks.delete(taskId)
      
      for (const task of reorderedTasks) {
        await blink.db.tasks.update(task.id, { priority: task.priority })
      }
      
      toast.success('Task deleted')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      loadTasks()
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await blink.db.tasks.update(taskId, updates)
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t))
      toast.success('Task updated')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id)
      const newIndex = tasks.findIndex(task => task.id === over.id)
      
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        priority: index + 1
      }))
      
      setTasks(reorderedTasks)
      
      try {
        for (const task of reorderedTasks) {
          await blink.db.tasks.update(task.id, { priority: task.priority })
        }
        toast.success('Tasks reordered! ✨')
      } catch (error) {
        console.error('Error reordering tasks:', error)
        toast.error('Failed to reorder tasks')
        loadTasks()
      }
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.id || !settings) return
    
    try {
      await blink.db.userSettings.update(settings.id, updates)
      setSettings({ ...settings, ...updates })
      toast.success('Settings updated!')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    await updateSettings({ darkMode: newDarkMode })
  }

  // PWA Installation
  const handleInstallPWA = async () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt()
      const { outcome } = await pwaInstallPrompt.userChoice
      
      if (outcome === 'accepted') {
        toast.success('Installing No Noise... 📱')
      }
      
      setPwaInstallPrompt(null)
    }
  }

  // Notification Permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      
      if (permission === 'granted') {
        toast.success('Notifications enabled! 🔔')
        
        // Schedule daily reminder
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          if (registration.pushManager) {
            // In a real app, you'd subscribe to push notifications here
            toast.success('Daily reminders will be sent at your reset time!')
          }
        }
      } else {
        toast.error('Notifications denied')
      }
    }
  }

  // Share functionality
  const shareTasksAsImage = async () => {
    if (!taskListRef.current) return
    
    try {
      const canvas = await html2canvas(taskListRef.current, {
        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
        scale: 2
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `no-noise-tasks-${format(new Date(), 'yyyy-MM-dd')}.png`
          link.click()
          URL.revokeObjectURL(url)
          toast.success('Tasks image downloaded! 📸')
        }
      })
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Failed to generate image')
    }
  }

  const copyReferralCode = () => {
    if (userReferral?.referralCode) {
      navigator.clipboard.writeText(userReferral.referralCode)
      toast.success('Referral code copied! 📋')
    }
  }

  const addLifePriority = async () => {
    if (!user?.id || !newPriorityTitle.trim()) return
    
    try {
      const newPriority = {
        id: `priority_${Date.now()}`,
        userId: user.id,
        title: newPriorityTitle.trim(),
        description: newPriorityDescription.trim(),
        category: 'personal',
        importanceLevel: 5
      }
      
      await blink.db.lifePriorities.create(newPriority)
      setLifePriorities([...lifePriorities, newPriority])
      setNewPriorityTitle('')
      setNewPriorityDescription('')
      toast.success('Life priority added! 🎯')
    } catch (error) {
      console.error('Error adding life priority:', error)
      toast.error('Failed to add priority')
    }
  }

  const deleteLifePriority = async (priorityId: string) => {
    try {
      await blink.db.lifePriorities.delete(priorityId)
      setLifePriorities(lifePriorities.filter(p => p.id !== priorityId))
      toast.success('Priority deleted')
    } catch (error) {
      console.error('Error deleting life priority:', error)
      toast.error('Failed to delete priority')
    }
  }

  const createTaskFromPriority = async (priority: any) => {
    if (!user?.id || tasks.length >= adaptiveCapacity) return
    
    try {
      const newTask = {
        id: `task_${Date.now()}`,
        userId: user.id,
        title: priority.title,
        priority: tasks.length + 1,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd'),
        category: priority.category || 'personal',
        estimatedMinutes: 60,
        actualMinutes: 0,
        energyLevel: 'medium',
        idleTime: 0
      }
      
      await blink.db.tasks.create(newTask)
      setTasks([...tasks, newTask])
      toast.success('Priority added to today\'s tasks! 🚀')
    } catch (error) {
      console.error('Error creating task from priority:', error)
      toast.error('Failed to create task')
    }
  }

  // AI Task Prioritization
  const aiPrioritizeTasks = async () => {
    if (!tasks.length) return
    
    // Simple AI logic for task prioritization
    const prioritizedTasks = [...tasks].sort((a, b) => {
      // Priority factors: energy level, category importance, estimated time
      const energyWeight = { high: 3, medium: 2, low: 1 }
      const categoryWeight = { work: 3, learning: 2, health: 2, personal: 1, creative: 1 }
      
      const scoreA = (energyWeight[a.energyLevel as keyof typeof energyWeight] || 1) + 
                    (categoryWeight[a.category as keyof typeof categoryWeight] || 1) +
                    (a.estimatedMinutes < 30 ? 1 : 0) // Bonus for quick tasks
      
      const scoreB = (energyWeight[b.energyLevel as keyof typeof energyWeight] || 1) + 
                    (categoryWeight[b.category as keyof typeof categoryWeight] || 1) +
                    (b.estimatedMinutes < 30 ? 1 : 0)
      
      return scoreB - scoreA
    }).map((task, index) => ({
      ...task,
      priority: index + 1
    }))
    
    setTasks(prioritizedTasks)
    
    try {
      for (const task of prioritizedTasks) {
        await blink.db.tasks.update(task.id, { priority: task.priority })
      }
      toast.success('🤖 AI has optimized your task order!')
    } catch (error) {
      console.error('Error updating task priorities:', error)
      toast.error('Failed to update priorities')
    }
  }

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const completedCount = tasks.filter(task => Number(task.completed) > 0).length
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0
  const dailyGoal = settings?.dailyGoal || 5

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Sparkles className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your productivity workspace...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-12 w-12 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl">No Noise</CardTitle>
              <p className="text-muted-foreground">
                Cut through the noise. Focus on what truly matters. Track your most important daily priorities.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => blink.auth.login()} 
                className="w-full"
                size="lg"
              >
                Sign In to Get Started
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={async (data: any) => {
            try {
              await blink.db.onboardingProgress.create({
                id: `onboarding_${Date.now()}`,
                userId: user.id,
                stepCompleted: 'complete',
                data: JSON.stringify(data)
              })
              
              await updateSettings({
                dailyGoal: data.dailyCapacity,
                adaptiveCapacity: data.dailyCapacity !== 5
              })
              
              const lifePriorities = data.priorities.filter((p: string) => p.trim())
              for (let i = 0; i < lifePriorities.length; i++) {
                await blink.db.lifePriorities.create({
                  id: `priority_${Date.now()}_${i}`,
                  userId: user.id,
                  title: lifePriorities[i],
                  description: `Priority from onboarding - ${data.primaryGoals.join(', ')}`,
                  category: 'personal',
                  importanceLevel: 5 - i
                })
              }
              
              setAdaptiveCapacity(data.dailyCapacity)
              setShowOnboarding(false)
              loadTasks()
              toast.success(`Welcome ${data.name}! Your life priorities have been saved. Start adding your daily tasks! 🚀`)
            } catch (error) {
              console.error('Error completing onboarding:', error)
              toast.error('Failed to save onboarding data')
            }
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      <MagicalCompletion
        isVisible={showCompletion}
        onComplete={() => setShowCompletion(false)}
        streak={streak?.currentStreak || 0}
      />

      {/* Idle Detection Dialog */}
      <Dialog open={showIdleDialog} onOpenChange={setShowIdleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-orange-500" />
              Still working on your top 5?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              You've been idle for 5 minutes. Your focus is what makes the difference!
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowIdleDialog(false)
                  resetIdleTimer()
                }}
                className="flex-1"
              >
                <Zap className="h-4 w-4 mr-2" />
                Back to Work!
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowIdleDialog(false)}
              >
                Taking a Break
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={shareTasksAsImage} variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Save as Image
              </Button>
              <TwitterShareButton
                url={window.location.href}
                title={`Just completed ${completedCount}/${tasks.length} tasks on No Noise! Cut through the noise, focus on what matters. 🎯`}
              >
                <Button variant="outline" className="w-full">
                  <Twitter className="h-4 w-4 mr-2" />
                  Tweet Progress
                </Button>
              </TwitterShareButton>
            </div>
            
            {userReferral && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Invite Friends</h4>
                <p className="text-sm text-muted-foreground">
                  Share your referral code and help others focus on what matters!
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={userReferral.referralCode} 
                    readOnly 
                    className="font-mono"
                  />
                  <Button onClick={copyReferralCode} size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Referrals: {userReferral.totalReferrals}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Enhanced Header with PWA Install */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground">No Noise</h1>
              
              {/* Streak and Badges */}
              <div className="flex items-center gap-2">
                {streak && streak.currentStreak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    <Flame className="h-4 w-4" />
                    {streak.currentStreak} day streak!
                  </motion.div>
                )}
                
                {streakBadges.slice(0, 3).map((badge) => {
                  const config = badgeConfig[badge.badgeType as keyof typeof badgeConfig]
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lg"
                      title={`${config.title}: ${config.description}`}
                    >
                      {config.icon}
                    </motion.div>
                  )
                })}
              </div>
              
              {/* PWA Install Button */}
              {pwaInstallPrompt && !isInstalled && (
                <Button
                  onClick={handleInstallPWA}
                  size="sm"
                  variant="outline"
                  className="ml-2"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </div>
            
            <p className="text-lg text-muted-foreground mb-4">{dailyQuote}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM do, yyyy')}
            </p>
            
            {/* Quick Actions */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                onClick={() => setShowShareDialog(true)}
                size="sm"
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {!notificationsEnabled && (
                <Button
                  onClick={requestNotificationPermission}
                  size="sm"
                  variant="outline"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Reminders
                </Button>
              )}
            </div>
          </motion.div>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="priorities" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Priorities
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Tasks Tab */}
            <TabsContent value="tasks" className="space-y-6">
              {/* Enhanced Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Daily Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {completedCount} of {tasks.length} completed
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3 mb-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Goal: {dailyGoal} tasks</span>
                      <span>{Math.round(progressPercentage)}% complete</span>
                    </div>
                    {completedCount === tasks.length && tasks.length >= dailyGoal && (
                      <motion.p 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center text-accent font-medium mt-3"
                      >
                        🎉 Outstanding! You've completed all your tasks today!
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Suggestions Panel */}
              {aiSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4 text-primary" />
                        AI Productivity Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={aiPrioritizeTasks}
                        size="sm"
                        variant="outline"
                        disabled={tasks.length === 0}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Help me prioritize
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Enhanced Add Task */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="What's your next priority?"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTask()}
                          disabled={tasks.length >= adaptiveCapacity}
                          className="flex-1"
                        />
                        <Button 
                          onClick={addTask} 
                          disabled={tasks.length >= adaptiveCapacity || !newTaskTitle.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">💼 Work</SelectItem>
                            <SelectItem value="personal">🏠 Personal</SelectItem>
                            <SelectItem value="health">💪 Health</SelectItem>
                            <SelectItem value="learning">📚 Learning</SelectItem>
                            <SelectItem value="creative">🎨 Creative</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={newTaskEnergy} onValueChange={setNewTaskEnergy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🔋 Low Energy</SelectItem>
                            <SelectItem value="medium">⚡ Medium Energy</SelectItem>
                            <SelectItem value="high">🚀 High Energy</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={newTaskEstimate}
                            onChange={(e) => setNewTaskEstimate(parseInt(e.target.value) || 30)}
                            className="w-16"
                            min="5"
                            max="480"
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                        </div>
                      </div>
                      
                      {tasks.length >= adaptiveCapacity && (
                        <p className="text-sm text-muted-foreground">
                          You've reached your daily capacity of {adaptiveCapacity} tasks. Focus on completing these first!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enhanced Tasks List */}
              <div ref={taskListRef}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <AnimatePresence>
                        {tasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <EnhancedTaskCard
                              task={task}
                              onToggle={toggleTask}
                              onDelete={deleteTask}
                              onUpdateTask={updateTask}
                              soundEnabled={Number(settings?.soundEffects) > 0}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Additional Tasks Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Plus className="h-4 w-4" />
                      Additional Tasks Completed
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Did you complete any extra tasks beyond your main {adaptiveCapacity}? Track them here!
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="e.g., Organized desk, Called mom, Fixed bug in side project..."
                      value={additionalTasks}
                      onChange={(e) => setAdditionalTasks(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-muted-foreground">
                        {additionalTasks.length} characters
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (additionalTasks.trim()) {
                            toast.success('Additional tasks saved! 🎉')
                          }
                        }}
                        disabled={!additionalTasks.trim()}
                      >
                        Save Additional Tasks
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {tasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ready to focus?</h3>
                      <p className="text-muted-foreground">
                        Add your first priority to cut through the noise and get started!
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* Life Priorities Tab */}
            <TabsContent value="priorities" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Life Priorities
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Your long-term priorities and goals. Convert these into daily tasks when you're ready to work on them.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a new life priority..."
                          value={newPriorityTitle}
                          onChange={(e) => setNewPriorityTitle(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addLifePriority()}
                          className="flex-1"
                        />
                        <Button onClick={addLifePriority} disabled={!newPriorityTitle.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Textarea
                        placeholder="Description (optional)"
                        value={newPriorityDescription}
                        onChange={(e) => setNewPriorityDescription(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="space-y-3">
                <AnimatePresence>
                  {lifePriorities.map((priority, index) => (
                    <motion.div
                      key={priority.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{priority.title}</h4>
                              {priority.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {priority.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  Importance: {priority.importanceLevel}/5
                                </Badge>
                                <Badge variant="outline">
                                  {priority.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => createTaskFromPriority(priority)}
                                disabled={tasks.length >= adaptiveCapacity}
                              >
                                Add to Today
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteLifePriority(priority.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {lifePriorities.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No life priorities yet</h3>
                      <p className="text-muted-foreground">
                        Add your long-term goals and priorities. You can convert them into daily tasks when you're ready to work on them.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </TabsContent>
            
            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <AIInsights
                tasks={tasks}
                completedTasksHistory={completedTasksHistory}
                currentStreak={streak?.currentStreak || 0}
              />
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Completed Tasks History</CardTitle>
                    <Select value={calendarView} onValueChange={(value: any) => setCalendarView(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="rounded-md border"
                        modifiers={{
                          hasCompletedTasks: (date) => 
                            completedTasksHistory.some(task => 
                              isSameDay(parseISO(task.date), date)
                            )
                        }}
                        modifiersStyles={{
                          hasCompletedTasks: { 
                            backgroundColor: 'hsl(var(--accent))', 
                            color: 'hsl(var(--accent-foreground))' 
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">
                        {calendarView === 'daily' && format(selectedDate, 'MMMM do, yyyy')}
                        {calendarView === 'weekly' && `Week of ${format(startOfWeek(selectedDate), 'MMM do')}`}
                        {calendarView === 'monthly' && format(selectedDate, 'MMMM yyyy')}
                      </h4>
                      
                      <div className="space-y-2">
                        {completedTasksHistory.length > 0 ? (
                          completedTasksHistory.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                              <CheckCircle2 className="h-4 w-4 text-accent" />
                              <span className="flex-1">{task.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                {format(parseISO(task.date), 'MMM do')}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            No completed tasks in this period.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      Productivity Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-primary">
                        {streak?.currentStreak || 0}
                      </div>
                      <p className="text-muted-foreground">Current streak (days)</p>
                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="font-medium">{streak?.longestStreak || 0}</div>
                          <div className="text-muted-foreground">Longest</div>
                        </div>
                        <div>
                          <div className="font-medium">{completedTasksHistory.length}</div>
                          <div className="text-muted-foreground">Total completed</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Badges Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {streakBadges.slice(0, 4).map((badge) => {
                        const config = badgeConfig[badge.badgeType as keyof typeof badgeConfig]
                        return (
                          <div key={badge.id} className="text-center p-3 border rounded-lg">
                            <div className="text-2xl mb-1">{config.icon}</div>
                            <div className="text-xs font-medium">{config.title}</div>
                            <div className="text-xs text-muted-foreground">{config.description}</div>
                          </div>
                        )
                      })}
                    </div>
                    {streakBadges.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm">
                        Complete tasks consistently to earn badges!
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Weekly Reflection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="What did you learn this week? What would you do differently?"
                        value={weeklyReflection}
                        onChange={(e) => setWeeklyReflection(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <Button
                        onClick={() => updateSettings({ weeklyReflection })}
                        size="sm"
                      >
                        Save Reflection
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-purple-500" />
                      Referral Program
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userReferral && (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {userReferral.totalReferrals}
                          </div>
                          <p className="text-sm text-muted-foreground">Friends referred</p>
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            value={userReferral.referralCode} 
                            readOnly 
                            className="font-mono text-center"
                          />
                          <Button onClick={copyReferralCode} size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Share your code and help friends focus on what matters!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={toggleDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    PWA Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Install as App</p>
                      <p className="text-sm text-muted-foreground">
                        Add No Noise to your home screen for quick access
                      </p>
                    </div>
                    {pwaInstallPrompt && !isInstalled ? (
                      <Button onClick={handleInstallPWA} size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Install
                      </Button>
                    ) : (
                      <Badge variant={isInstalled ? "default" : "secondary"}>
                        {isInstalled ? "Installed" : "Available"}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Daily Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified to check your daily priorities
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={requestNotificationPermission}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Productivity Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sound Effects</p>
                      <p className="text-sm text-muted-foreground">
                        Play sounds when completing tasks
                      </p>
                    </div>
                    <Switch
                      checked={Number(settings?.soundEffects) > 0}
                      onCheckedChange={(checked) => updateSettings({ soundEffects: checked })}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Daily Task Capacity</p>
                        <p className="text-xs text-muted-foreground">Maximum tasks you can add per day</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{adaptiveCapacity} tasks</span>
                    </div>
                    <div className="px-2">
                      <Slider
                        value={[adaptiveCapacity]}
                        onValueChange={([value]) => {
                          setAdaptiveCapacity(value)
                          updateSettings({ dailyGoal: value, adaptiveCapacity: value !== 5 })
                          toast.success(`Daily capacity updated to ${value} tasks!`)
                        }}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 task</span>
                      <span>5 (recommended)</span>
                      <span>10 tasks</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        {adaptiveCapacity <= 3 && "🎯 Perfect for deep focus days"}
                        {adaptiveCapacity >= 4 && adaptiveCapacity <= 6 && "⚡ Great balance of productivity and sustainability"}
                        {adaptiveCapacity >= 7 && "🚀 Ambitious! Make sure to prioritize ruthlessly"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Daily Reset Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Reset Time (24-hour format)
                      </label>
                      <Input
                        type="time"
                        value={settings?.resetTime || '00:00'}
                        onChange={(e) => updateSettings({ resetTime: e.target.value })}
                        className="w-40"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Tasks will reset daily at this time. Completed tasks are preserved in history.
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Manual Reset (Testing)</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Clear incomplete tasks immediately. Completed tasks are preserved.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={manualReset}
                          className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                        >
                          🔄 Reset Tasks Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Signed in as: <span className="font-medium">{user.email}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowOnboarding(true)}
                      >
                        Restart Onboarding
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => blink.auth.logout()}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

export default App