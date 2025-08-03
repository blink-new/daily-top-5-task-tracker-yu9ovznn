import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { GripVertical, Edit2, Trash2, Check, X } from 'lucide-react'

interface Task {
  id: string
  title: string
  priority: number
  completed: boolean
  date: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface TaskCardProps {
  task: Task
  onToggle: (taskId: string) => void
  onDelete: (taskId: string) => void
  onUpdateTitle: (taskId: string, newTitle: string) => void
}

export default function TaskCard({ task, onToggle, onDelete, onUpdateTitle }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

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
      onUpdateTitle(task.id, editTitle)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setIsEditing(false)
  }

  const isCompleted = Number(task.completed) > 0

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isCompleted ? 'bg-accent/10 border-accent/30' : ''}`}
    >
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
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isCompleted 
              ? 'bg-accent text-accent-foreground' 
              : 'bg-primary text-primary-foreground'
          }`}>
            {task.priority}
          </div>

          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(task.id)}
            className="flex-shrink-0"
          />

          {/* Task Title */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
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
              <p className={`truncate ${
                isCompleted 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground'
              }`}>
                {task.title}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1 flex-shrink-0">
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
  )
}