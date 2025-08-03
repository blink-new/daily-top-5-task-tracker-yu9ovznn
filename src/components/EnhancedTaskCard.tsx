import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Briefcase, 
  Home, 
  Dumbbell, 
  BookOpen, 
  Palette,
  Play,
  Pause,
  Square
} from 'lucide-react'

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
}

interface EnhancedTaskCardProps {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  soundEnabled: boolean
}

const categoryConfig = {
  work: { icon: Briefcase, color: 'bg-blue-500', label: 'Work' },
  personal: { icon: Home, color: 'bg-green-500', label: 'Personal' },
  health: { icon: Dumbbell, color: 'bg-red-500', label: 'Health' },
  learning: { icon: BookOpen, color: 'bg-purple-500', label: 'Learning' },
  creative: { icon: Palette, color: 'bg-orange-500', label: 'Creative' }
}

const energyLevels = {
  low: { label: 'Low Energy', color: 'bg-gray-500' },
  medium: { label: 'Medium Energy', color: 'bg-yellow-500' },
  high: { label: 'High Energy', color: 'bg-green-500' }
}

export default function EnhancedTaskCard({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdateTask, 
  soundEnabled 
}: EnhancedTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(task.actualMinutes || 0)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTask(task.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setIsEditing(false)
  }

  const handleToggleComplete = () => {
    onToggle(task.id)
    
    // Play completion sound if enabled
    if (soundEnabled && !Number(task.completed)) {
      // Create a simple completion sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }

  const handleTimerToggle = () => {
    if (isTimerRunning) {
      // Stop timer and save actual time
      setIsTimerRunning(false)
      onUpdateTask(task.id, { actualMinutes: currentTime })
    } else {
      // Start timer
      setIsTimerRunning(true)
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 60000) // Update every minute
      
      // Store interval ID for cleanup
      ;(window as any).taskTimer = interval
    }
  }

  const isCompleted = Number(task.completed) > 0
  const categoryInfo = categoryConfig[task.category as keyof typeof categoryConfig] || categoryConfig.work
  const energyInfo = energyLevels[task.energyLevel as keyof typeof energyLevels] || energyLevels.medium

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.01 }}
      className={`transition-all duration-200 ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg rotate-2' : ''
      } ${isCompleted ? 'bg-accent/10 border-accent/30' : ''} ${
        isTimerRunning ? 'ring-2 ring-primary/50' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Priority Number */}
            <motion.div 
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-primary text-primary-foreground'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              {task.priority}
            </motion.div>

            {/* Checkbox */}
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
              className="flex-shrink-0"
            />

            {/* Task Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title and Category */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className={`flex-1 truncate ${
                      isCompleted 
                        ? 'line-through text-muted-foreground' 
                        : 'text-foreground'
                    }`}>
                      {task.title}
                    </p>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <categoryInfo.icon className="h-3 w-3" />
                      <span className="text-xs">{categoryInfo.label}</span>
                    </Badge>
                  </>
                )}
              </div>

              {/* Time and Energy Info */}
              {!isEditing && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {task.actualMinutes > 0 ? `${task.actualMinutes}` : task.estimatedMinutes}m
                      {task.actualMinutes > 0 && task.estimatedMinutes > 0 && (
                        <span className="text-muted-foreground/70">
                          /{task.estimatedMinutes}m
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-white text-xs ${energyInfo.color}`}>
                    {energyInfo.label}
                  </div>
                  {isTimerRunning && (
                    <Badge variant="default" className="animate-pulse">
                      Timer: {currentTime}m
                    </Badge>
                  )}
                </div>
              )}

              {/* Edit Mode - Category and Time */}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Select
                    value={task.category}
                    onValueChange={(value) => onUpdateTask(task.id, { category: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="Est. minutes"
                    value={task.estimatedMinutes || ''}
                    onChange={(e) => onUpdateTask(task.id, { estimatedMinutes: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                  
                  <Select
                    value={task.energyLevel}
                    onValueChange={(value) => onUpdateTask(task.id, { energyLevel: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(energyLevels).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {!isCompleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTimerToggle}
                    className="h-8 w-8 p-0"
                  >
                    {isTimerRunning ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(task.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}