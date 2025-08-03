import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Brain, TrendingUp, Clock, Target, Lightbulb, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Task {
  id: string
  title: string
  category: string
  completed: boolean
  date: string
  estimatedMinutes: number
  actualMinutes: number
  energyLevel: string
}

interface Insight {
  id: string
  type: 'pattern' | 'recommendation' | 'achievement' | 'optimization'
  title: string
  description: string
  confidence: number
  actionable: boolean
  icon: any
}

interface AIInsightsProps {
  tasks: Task[]
  completedTasksHistory: Task[]
  currentStreak: number
}

export default function AIInsights({ tasks, completedTasksHistory, currentStreak }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateInsights = useCallback(() => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const newInsights: Insight[] = []

      // Analyze completion patterns
      if (completedTasksHistory.length >= 7) {
        const recentTasks = completedTasksHistory.slice(-14)
        const categoryStats = recentTasks.reduce((acc, task) => {
          acc[task.category] = (acc[task.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const topCategory = Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0]
        if (topCategory) {
          newInsights.push({
            id: 'category-pattern',
            type: 'pattern',
            title: 'Category Focus Detected',
            description: `You complete ${Math.round((topCategory[1] / recentTasks.length) * 100)}% more ${topCategory[0]} tasks. Consider balancing other areas.`,
            confidence: 0.85,
            actionable: true,
            icon: Target
          })
        }
      }

      // Time estimation accuracy
      const tasksWithTime = completedTasksHistory.filter(t => t.estimatedMinutes && t.actualMinutes)
      if (tasksWithTime.length >= 5) {
        const avgAccuracy = tasksWithTime.reduce((acc, task) => {
          const accuracy = 1 - Math.abs(task.estimatedMinutes - task.actualMinutes) / task.estimatedMinutes
          return acc + Math.max(0, accuracy)
        }, 0) / tasksWithTime.length

        if (avgAccuracy < 0.7) {
          newInsights.push({
            id: 'time-estimation',
            type: 'recommendation',
            title: 'Improve Time Estimation',
            description: `Your time estimates are ${Math.round(avgAccuracy * 100)}% accurate. Try tracking actual time more carefully.`,
            confidence: 0.9,
            actionable: true,
            icon: Clock
          })
        }
      }

      // Streak achievements
      if (currentStreak >= 7) {
        newInsights.push({
          id: 'streak-achievement',
          type: 'achievement',
          title: 'Consistency Champion',
          description: `${currentStreak} days of focused productivity! You're building an incredible habit.`,
          confidence: 1.0,
          actionable: false,
          icon: TrendingUp
        })
      }

      // Productivity recommendations
      const todayCompleted = tasks.filter(t => Number(t.completed) > 0).length
      if (todayCompleted >= 3 && tasks.length === 5) {
        newInsights.push({
          id: 'daily-momentum',
          type: 'recommendation',
          title: 'Strong Daily Momentum',
          description: 'You\'re on track for another successful day. Keep the momentum going!',
          confidence: 0.8,
          actionable: false,
          icon: TrendingUp
        })
      }

      setInsights(newInsights)
      setIsGenerating(false)
    }, 1500) // Simulate AI processing time
  }, [completedTasksHistory, currentStreak, tasks])

  useEffect(() => {
    if (completedTasksHistory.length > 0) {
      generateInsights()
    }
  }, [generateInsights, completedTasksHistory.length])

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
      case 'recommendation': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
      case 'achievement': return 'bg-green-500/10 text-green-700 dark:text-green-300'
      case 'optimization': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateInsights}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <div className="text-center">
                <Brain className="h-8 w-8 text-primary animate-pulse mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing your productivity patterns...</p>
              </div>
            </motion.div>
          ) : insights.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
                    <insight.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(insight.confidence * 100)}% confident
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.actionable && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Actionable
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Complete more tasks to unlock AI insights about your productivity patterns.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}