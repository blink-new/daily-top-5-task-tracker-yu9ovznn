import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Calendar } from './components/ui/calendar'
import { Sparkles, Plus, CheckCircle2, Calendar as CalendarIcon, Target, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  date: string
  user_id: string
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('tasks')

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadTasks = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      const tasksData = await blink.db.tasks.list({
        where: { 
          user_id: user.id,
          date: dateStr
        },
        orderBy: { priority: 'asc' }
      })
      
      setTasks(tasksData || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    }
  }, [user?.id, selectedDate])

  // Load tasks when user is authenticated or date changes
  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
  }, [user?.id, loadTasks])

  const addTask = async () => {
    if (!user?.id || !newTaskTitle.trim() || isCreatingTask) return
    
    if (tasks.length >= 5) {
      toast.error('You can only have 5 tasks per day!')
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
        date: selectedDate.toISOString().split('T')[0]
      }
      
      await blink.db.tasks.create(newTask)
      
      // Update local state
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

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      
      const isCompleting = !task.completed
      
      // Update local state immediately
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: isCompleting } : t
      ))
      
      await blink.db.tasks.update(taskId, { 
        completed: isCompleting
      })
      
      if (isCompleting) {
        toast.success('Task completed! 🎉')
      }
      
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Failed to update task')
      loadTasks() // Reload on error
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
      
      // Update priorities
      const updatedTasks = newTasks.map((task, index) => ({
        ...task,
        priority: index + 1
      }))
      
      setTasks(updatedTasks)
      
      // Update database
      for (const task of updatedTasks) {
        await blink.db.tasks.update(task.id, { priority: task.priority })
      }
      
      toast.success('Priority updated!')
      
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
      loadTasks() // Reload on error
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setActiveTab('tasks') // Switch back to tasks when date is selected
    }
  }

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">No Noise</h1>
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

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="prioritize" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Prioritize
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
                <div className="w-full bg-secondary rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>Goal: 5 tasks</span>
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
                    disabled={tasks.length >= 5 || isCreatingTask}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addTask} 
                    disabled={tasks.length >= 5 || !newTaskTitle.trim() || isCreatingTask}
                  >
                    {isCreatingTask ? (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {tasks.length >= 5 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You've reached your daily capacity of 5 tasks. Focus on completing these first!
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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

          {/* Prioritization Tab */}
          <TabsContent value="prioritize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prioritize Your Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag tasks up or down to reorder them by priority
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
        </Tabs>

        {/* Sign Out */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => blink.auth.logout()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App