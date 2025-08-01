import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Sparkles, Plus, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  date: string
  userId: string
}

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')

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
      const today = new Date().toISOString().split('T')[0]
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
      setTasks([])
    }
  }, [user?.id])

  // Load tasks when user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
  }, [user?.id, loadTasks])

  const addTask = async () => {
    if (!user?.id || !newTaskTitle.trim()) return
    
    if (tasks.length >= 5) {
      toast.error('You can only have 5 tasks per day!')
      return
    }
    
    try {
      const newTask = {
        id: `task_${Date.now()}`,
        userId: user.id,
        title: newTaskTitle.trim(),
        priority: tasks.length + 1,
        completed: false,
        date: new Date().toISOString().split('T')[0]
      }
      
      await blink.db.tasks.create(newTask)
      setTasks([...tasks, newTask])
      setNewTaskTitle('')
      toast.success('Task added! 🎯')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      
      const isCompleting = !task.completed
      
      await blink.db.tasks.update(taskId, { 
        completed: isCompleting
      })
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: isCompleting } : t))
      
      if (isCompleting) {
        toast.success('Task completed! 🎉')
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      toast.error('Failed to update task')
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

  const completedCount = tasks.filter(task => task.completed).length
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
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6">
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
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="What's your next priority?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                disabled={tasks.length >= 5}
                className="flex-1"
              />
              <Button 
                onClick={addTask} 
                disabled={tasks.length >= 5 || !newTaskTitle.trim()}
              >
                <Plus className="h-4 w-4" />
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
          {tasks.map((task, index) => (
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
                        task.completed 
                          ? 'text-green-500 fill-green-500' 
                          : 'text-muted-foreground hover:text-green-500'
                      }`} 
                    />
                  </button>
                  <p className={`flex-1 ${
                    task.completed 
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