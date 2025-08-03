import React, { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Calendar } from './components/ui/calendar'
import { Switch } from './components/ui/switch'
import { Slider } from './components/ui/slider'
import { Badge } from './components/ui/badge'
import { Progress } from './components/ui/progress'
import { 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Target, 
  ArrowUp, 
  ArrowDown,
  Brain,
  BarChart3,
  Settings,
  Trophy,
  Share2,
  Moon,
  Sun,
  Users,
  TrendingUp,
  Clock,
  Flame,
  Star
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// Import components
import OnboardingWizard from './components/OnboardingWizard'
import AIInsights from './components/AIInsights'
import Gamification from './components/Gamification'
import Sharing from './components/Sharing'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  date: string
  user_id: string
  category?: string
  estimated_minutes?: number
  actual_minutes?: number
  energy_level?: string
}

interface AdditionalTask {
  id: string
  title: string
  completed: boolean
  date: string
  user_id: string
}

interface UserSettings {
  darkMode: boolean
  dailyTaskLimit: number
  showOnboarding: boolean
  notifications: boolean
  resetTime: string
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [additionalTasks, setAdditionalTasks] = useState<AdditionalTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newAdditionalTaskTitle, setNewAdditionalTaskTitle] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('tasks')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [completedTasksHistory, setCompletedTasksHistory] = useState<Task[]>([])
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    dailyTaskLimit: 5,
    showOnboarding: true,
    notifications: true,
    resetTime: '00:00'
  })

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load user settings
  const loadUserSettings = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const settingsData = await blink.db.userSettings.list({
        where: { user_id: user.id }
      })
      
      if (settingsData && settingsData.length > 0) {
        const userSettingsRecord = settingsData[0]
        
        setSettings(prev => ({
          ...prev,
          darkMode: Number(userSettingsRecord.dark_mode) > 0,
          dailyTaskLimit: userSettingsRecord.daily_goal || 5,
          showOnboarding: false, // If record exists, onboarding was completed
          notifications: Number(userSettingsRecord.sound_enabled) > 0,
          resetTime: userSettingsRecord.reset_time || '00:00'
        }))
      } else {
        // First time user - show onboarding and create default settings
        setShowOnboarding(true)
        
        // Create default settings record
        const defaultSettings = {
          id: `settings_${user.id}`,
          user_id: user.id,
          dark_mode: 0,
          sound_enabled: 1,
          daily_goal: 5,
          sound_effects: 1,
          adaptive_capacity: 0,
          weekly_reflection: '',
          reset_time: '00:00',
          timezone: 'UTC'
        }
        
        await blink.db.userSettings.create(defaultSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Don't show onboarding if there's an error - use defaults
      setSettings(prev => ({
        ...prev,
        darkMode: false,
        dailyTaskLimit: 5,
        showOnboarding: false,
        notifications: true,
        resetTime: '00:00'
      }))
    }
  }, [user?.id])

  // Save user setting
  const saveSetting = async (key: string, value: any) => {
    if (!user?.id) return
    
    try {
      const settingsId = `settings_${user.id}`
      
      // Map our setting keys to database columns
      const updateData: any = {}
      
      switch (key) {
        case 'darkMode':
          updateData.dark_mode = value ? 1 : 0
          break
        case 'dailyTaskLimit':
          updateData.daily_goal = Number(value)
          break
        case 'notifications':
          updateData.sound_enabled = value ? 1 : 0
          break
        case 'resetTime':
          updateData.reset_time = value
          break
        case 'showOnboarding':
          // This doesn't need to be saved to DB - it's implicit
          break
        default:
          console.warn(`Unknown setting key: ${key}`)
          return
      }
      
      if (Object.keys(updateData).length > 0) {
        await blink.db.userSettings.update(settingsId, updateData)
      }
      
      setSettings(prev => ({ ...prev, [key]: value }))
    } catch (error) {
      console.error('Error saving setting:', error)
      toast.error('Failed to save setting')
    }
  }

  // Helper function for retry logic
  const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        if (error?.status === 429 && i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000
          console.log(`Rate limited, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
  }

  const loadTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const tasksData = await retryWithBackoff(() => 
        blink.db.tasks.list({
          where: { 
            user_id: user.id,
            date: dateStr
          },
          orderBy: { priority: 'asc' }
        })
      )
      
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    }
  }, [user?.id, selectedDate])

  const loadAdditionalTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const additionalTasksData = await retryWithBackoff(() =>
        blink.db.additionalTasks.list({
          where: { 
            user_id: user.id,
            date: dateStr
          },
          orderBy: { created_at: 'desc' }
        })
      )
      
      setAdditionalTasks(additionalTasksData || [])
    } catch (error) {
      console.error('Error loading additional tasks:', error)
      setAdditionalTasks([])
    }
  }, [user?.id, selectedDate])

  const calculateStreak = (completedTasks: Task[]) => {
    if (completedTasks.length === 0) {
      setCurrentStreak(0)
      return
    }
    
    // Group tasks by date
    const tasksByDate = completedTasks.reduce((acc, task) => {
      const date = task.date
      if (!acc[date]) acc[date] = []
      acc[date].push(task)
      return acc
    }, {} as Record<string, Task[]>)
    
    // Calculate consecutive days
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
        streak++
      } else {
        break
      }
    }
    
    setCurrentStreak(streak)
  }

  const loadCompletedTasksHistory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const historyData = await retryWithBackoff(() =>
        blink.db.tasks.list({
          where: { 
            user_id: user.id,
            completed: "1"
          },
          orderBy: { date: 'desc' },
          limit: 100
        })
      )
      
      setCompletedTasksHistory(historyData || [])
      
      // Calculate streak
      calculateStreak(historyData || [])
    } catch (error) {
      console.error('Error loading task history:', error)
      setCompletedTasksHistory([])
      setCurrentStreak(0)
    }
  }, [user?.id])

  // Load data when user is authenticated or date changes
  useEffect(() => {
    if (user?.id) {
      // Load settings first, then other data with delays to avoid rate limiting
      const loadAllData = async () => {
        await loadUserSettings()
        
        // Add small delays between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        await loadTasks()
        
        await new Promise(resolve => setTimeout(resolve, 200))
        await loadAdditionalTasks()
        
        await new Promise(resolve => setTimeout(resolve, 200))
        await loadCompletedTasksHistory()
      }
      
      loadAllData()
    }
  }, [user?.id, selectedDate, loadUserSettings, loadTasks, loadAdditionalTasks, loadCompletedTasksHistory])

  const addTask = async () => {
    if (!user?.id || !newTaskTitle.trim() || isCreatingTask) return
    
    if (tasks.length >= settings.dailyTaskLimit) {
      toast.error(`You can only have ${settings.dailyTaskLimit} tasks per day!`)
      return
    }
    
    setIsCreatingTask(true)
    
    try {
      const newTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        title: newTaskTitle.trim(),
        priority: tasks.length + 1,
        completed: false,
        date: selectedDate.toISOString().split('T')[0],
        category: 'general',
        estimated_minutes: 30,
        energy_level: 'medium'
      }
      
      await blink.db.tasks.create(newTask)
      
      setTasks(prev => [...prev, newTask])
      setNewTaskTitle('')
      toast.success('Task added! 🎯')
      
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task. Please try again.')
    } finally {
      setIsCreatingTask(false)
    }
  }

  const addAdditionalTask = async () => {
    if (!user?.id || !newAdditionalTaskTitle.trim()) return
    
    try {
      const newTask = {
        id: `additional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        title: newAdditionalTaskTitle.trim(),
        completed: false,
        date: selectedDate.toISOString().split('T')[0]
      }
      
      await blink.db.additionalTasks.create(newTask)
      
      setAdditionalTasks(prev => [newTask, ...prev])
      setNewAdditionalTaskTitle('')
      toast.success('Additional task added! ✨')
      
    } catch (error) {
      console.error('Error adding additional task:', error)
      toast.error('Failed to add additional task.')
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      
      const isCompleting = !task.completed
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: isCompleting } : t
      ))
      
      await blink.db.tasks.update(taskId, { 
        completed: isCompleting
      })
      
      if (isCompleting) {
        toast.success('Task completed! 🎉')
        loadCompletedTasksHistory() // Refresh streak
      }
      
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Failed to update task')
      loadTasks()
    }
  }

  const toggleAdditionalTask = async (taskId: string) => {
    try {
      const task = additionalTasks.find(t => t.id === taskId)
      if (!task) return
      
      const isCompleting = !task.completed
      
      setAdditionalTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: isCompleting } : t
      ))
      
      await blink.db.additionalTasks.update(taskId, { 
        completed: isCompleting
      })
      
      if (isCompleting) {
        toast.success('Additional task completed! ✨')
      }
      
    } catch (error) {
      console.error('Error toggling additional task:', error)
      toast.error('Failed to update additional task')
      loadAdditionalTasks()
    }
  }

  const movePriority = async (taskId: string, direction: 'up' | 'down') => {
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) return
    
    const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1
    if (newIndex < 0 || newIndex >= tasks.length) return
    
    try {
      const newTasks = [...tasks]
      const [movedTask] = newTasks.splice(taskIndex, 1)
      newTasks.splice(newIndex, 0, movedTask)
      
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        priority: index + 1
      }))
      
      setTasks(updatedTasks)
      
      for (const task of updatedTasks) {
        await blink.db.tasks.update(task.id, { priority: task.priority })
      }
      
      toast.success('Priority updated!')
      
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
      loadTasks()
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setActiveTab('tasks')
    }
  }

  const handleOnboardingComplete = async (data: any) => {
    setShowOnboarding(false)
    
    // Save onboarding data as settings
    await saveSetting('dailyTaskLimit', data.dailyCapacity)
    
    // Create initial tasks from priorities
    if (data.priorities && data.priorities.length > 0) {
      for (let i = 0; i < Math.min(data.priorities.length, data.dailyCapacity); i++) {
        const priority = data.priorities[i]
        if (priority && priority.trim()) {
          const newTask = {
            id: `task_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: user.id,
            title: priority.trim(),
            priority: i + 1,
            completed: false,
            date: new Date().toISOString().split('T')[0],
            category: 'priority',
            estimated_minutes: 45,
            energy_level: 'high'
          }
          
          try {
            await blink.db.tasks.create(newTask)
            // Add delay between task creation to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.error('Error creating initial task:', error)
          }
        }
      }
      
      // Reload tasks after a short delay
      setTimeout(() => loadTasks(), 500)
    }
    
    toast.success(`Welcome to No Noise, ${data.name}! 🎉`)
  }

  const handleOnboardingSkip = async () => {
    setShowOnboarding(false)
    // No need to save showOnboarding setting - it's implicit when settings record exists
  }

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">No Noise</CardTitle>
            <p className="text-muted-foreground">
              Focus on what truly matters. Track your top 5 daily priorities.
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
      </div>
    )
  }

  const completedCount = tasks.filter(task => Number(task.completed) > 0).length
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0
  const completedAdditionalCount = additionalTasks.filter(task => Number(task.completed) > 0).length
  const completedTasksThisWeek = completedTasksHistory.filter(task => {
    const taskDate = new Date(task.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return taskDate >= weekAgo
  }).length

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">No Noise</h1>
            {currentStreak > 0 && (
              <Badge className="bg-orange-500 text-white">
                <Flame className="h-3 w-3 mr-1" />
                {currentStreak} day streak
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Cut through the noise. Focus on what truly matters.
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="priorities" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
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

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Progress */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Daily Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedCount} of {tasks.length} completed
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Goal: {settings.dailyTaskLimit} tasks</span>
                  <span>{Math.round(progressPercentage)}% complete</span>
                </div>
              </CardContent>
            </Card>

            {/* Add Task */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="What's your next priority?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    disabled={tasks.length >= settings.dailyTaskLimit || isCreatingTask}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addTask} 
                    disabled={tasks.length >= settings.dailyTaskLimit || !newTaskTitle.trim() || isCreatingTask}
                  >
                    {isCreatingTask ? (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {tasks.length >= settings.dailyTaskLimit && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You've reached your daily capacity of {settings.dailyTaskLimit} tasks. Focus on completing these first!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {task.priority}
                      </div>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="flex-shrink-0"
                      >
                        <CheckCircle2 
                          className={`h-5 w-5 ${
                            Number(task.completed) > 0
                              ? 'text-green-500 fill-green-500' 
                              : 'text-muted-foreground hover:text-green-500'
                          }`} 
                        />
                      </button>
                      <p className={`flex-1 ${
                        Number(task.completed) > 0
                          ? 'line-through text-muted-foreground' 
                          : 'text-foreground'
                      }`}>
                        {task.title}
                      </p>
                      {task.category && (
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Tasks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Tasks Completed</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track extra tasks you completed beyond your main priorities
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="What else did you accomplish?"
                    value={newAdditionalTaskTitle}
                    onChange={(e) => setNewAdditionalTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAdditionalTask()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addAdditionalTask} 
                    disabled={!newAdditionalTaskTitle.trim()}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {additionalTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Additional completed: {completedAdditionalCount}/{additionalTasks.length}
                    </p>
                    {additionalTasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded border">
                        <button
                          onClick={() => toggleAdditionalTask(task.id)}
                          className="flex-shrink-0"
                        >
                          <CheckCircle2 
                            className={`h-4 w-4 ${
                              Number(task.completed) > 0
                                ? 'text-green-500 fill-green-500' 
                                : 'text-muted-foreground hover:text-green-500'
                            }`} 
                          />
                        </button>
                        <p className={`flex-1 text-sm ${
                          Number(task.completed) > 0
                            ? 'line-through text-muted-foreground' 
                            : 'text-foreground'
                        }`}>
                          {task.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {tasks.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to focus?</h3>
                  <p className="text-muted-foreground">
                    Add your first priority to cut through the noise and get started!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Priorities Tab */}
          <TabsContent value="priorities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prioritize Your Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use the arrows to reorder tasks by priority
                </p>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No tasks for {selectedDate.toLocaleDateString()}. Add some tasks first!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task, index) => (
                      <Card key={task.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                              {task.priority}
                            </div>
                            <p className={`flex-1 ${
                              Number(task.completed) > 0
                                ? 'line-through text-muted-foreground' 
                                : 'text-foreground'
                            }`}>
                              {task.title}
                            </p>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => movePriority(task.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => movePriority(task.id, 'down')}
                                disabled={index === tasks.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <AIInsights 
              tasks={tasks}
              completedTasksHistory={completedTasksHistory}
              currentStreak={currentStreak}
            />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select a Date</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any date to view and manage tasks for that day
                </p>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border w-full"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {user ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Gamification 
                    user={user}
                    currentStreak={currentStreak}
                    completedTasksThisWeek={completedTasksThisWeek}
                    totalTasksThisWeek={35}
                  />
                </div>
                <div className="space-y-6">
                  <Sharing 
                    user={user}
                    tasks={tasks}
                    currentStreak={currentStreak}
                  />
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Loading analytics...</h3>
                  <p className="text-muted-foreground">
                    Please wait while we load your analytics data.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customize your No Noise experience
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span className="font-medium">Dark Mode</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => saveSetting('darkMode', checked)}
                  />
                </div>

                {/* Daily Task Limit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-medium">Daily Task Limit</span>
                      <p className="text-sm text-muted-foreground">
                        Maximum number of daily priorities
                      </p>
                    </div>
                    <Badge variant="secondary">{settings.dailyTaskLimit}</Badge>
                  </div>
                  <Slider
                    value={[settings.dailyTaskLimit]}
                    onValueChange={([value]) => saveSetting('dailyTaskLimit', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 task</span>
                    <span>10 tasks</span>
                  </div>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-medium">Notifications</span>
                    <p className="text-sm text-muted-foreground">
                      Get reminders and achievement notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => saveSetting('notifications', checked)}
                  />
                </div>

                {/* Task Reset Time */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Daily Reset Time</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        When should your tasks reset each day?
                      </p>
                    </div>
                    <Badge variant="secondary">{settings.resetTime}</Badge>
                  </div>
                  <Input
                    type="time"
                    value={settings.resetTime}
                    onChange={(e) => saveSetting('resetTime', e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tasks will automatically reset at this time each day. Set to 00:00 for midnight reset.
                  </p>
                </div>

                {/* Reset Onboarding */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowOnboarding(true)}
                    className="w-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Restart Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => blink.auth.logout()}
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App