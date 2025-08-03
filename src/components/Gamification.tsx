import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { Trophy, Flame, Star, Target, Award, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'

interface Badge {
  id: string
  user_id: string
  badge_type: string
  earned_at: string
  badge_data: string
}

interface GamificationProps {
  user: any
  currentStreak: number
  completedTasksThisWeek: number
  totalTasksThisWeek: number
}

const BADGE_DEFINITIONS = {
  streak_3: {
    name: '3-Day Streak',
    description: 'Completed tasks for 3 consecutive days',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20'
  },
  streak_7: {
    name: '7-Day Streak',
    description: 'Completed tasks for a full week',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  streak_14: {
    name: '2-Week Streak',
    description: 'Two weeks of consistent productivity',
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  streak_30: {
    name: '30-Day Streak',
    description: 'A full month of daily excellence',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  },
  mvp_task: {
    name: 'MVP Task',
    description: 'Completed the most important task this week',
    icon: Award,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  weekly_goal: {
    name: 'Weekly Goal',
    description: 'Achieved weekly productivity target',
    icon: Target,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
  }
}

export default function Gamification({ user, currentStreak, completedTasksThisWeek, totalTasksThisWeek }: GamificationProps) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState(35) // Default: 5 tasks × 7 days
  const [showNewBadge, setShowNewBadge] = useState<string | null>(null)

  const loadBadges = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const badgesData = await blink.db.userBadges.list({
        where: { user_id: user.id },
        orderBy: { earned_at: 'desc' }
      })
      setBadges(badgesData || [])
    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }, [user?.id])

  const checkAndAwardBadges = useCallback(async () => {
    if (!user?.id) return
    
    const existingBadgeTypes = badges.map(b => b.badge_type)
    const newBadges: string[] = []

    // Check streak badges
    if (currentStreak >= 3 && !existingBadgeTypes.includes('streak_3')) {
      newBadges.push('streak_3')
    }
    if (currentStreak >= 7 && !existingBadgeTypes.includes('streak_7')) {
      newBadges.push('streak_7')
    }
    if (currentStreak >= 14 && !existingBadgeTypes.includes('streak_14')) {
      newBadges.push('streak_14')
    }
    if (currentStreak >= 30 && !existingBadgeTypes.includes('streak_30')) {
      newBadges.push('streak_30')
    }

    // Check weekly goal badge
    const weeklyProgress = (completedTasksThisWeek / weeklyGoal) * 100
    if (weeklyProgress >= 100 && !existingBadgeTypes.includes('weekly_goal')) {
      newBadges.push('weekly_goal')
    }

    // Award new badges
    for (const badgeType of newBadges) {
      try {
        const newBadge = {
          id: `badge_${Date.now()}_${badgeType}`,
          user_id: user.id,
          badge_type: badgeType,
          earned_at: new Date().toISOString(),
          badge_data: JSON.stringify({
            streak: currentStreak,
            weeklyProgress: Math.round(weeklyProgress)
          })
        }
        
        await blink.db.userBadges.create(newBadge)
        setBadges(prev => [newBadge, ...prev])
        
        // Show celebration
        setShowNewBadge(badgeType)
        toast.success(`🏆 New badge earned: ${BADGE_DEFINITIONS[badgeType as keyof typeof BADGE_DEFINITIONS].name}!`)
        
        setTimeout(() => setShowNewBadge(null), 3000)
      } catch (error) {
        console.error('Error awarding badge:', error)
      }
    }
  }, [user?.id, badges, currentStreak, completedTasksThisWeek, weeklyGoal])

  useEffect(() => {
    if (user?.id) {
      loadBadges()
    }
  }, [user?.id, loadBadges])

  useEffect(() => {
    if (badges.length > 0) {
      checkAndAwardBadges()
    }
  }, [currentStreak, completedTasksThisWeek, weeklyGoal, badges.length, checkAndAwardBadges])

  const weeklyProgress = Math.min((completedTasksThisWeek / weeklyGoal) * 100, 100)

  return (
    <div className="space-y-6">
      {/* New Badge Celebration */}
      <AnimatePresence>
        {showNewBadge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 shadow-2xl">
              <CardContent className="pt-6 text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="mb-4"
                >
                  <div className={`inline-flex p-4 rounded-full ${BADGE_DEFINITIONS[showNewBadge as keyof typeof BADGE_DEFINITIONS].bgColor}`}>
                    {React.createElement(BADGE_DEFINITIONS[showNewBadge as keyof typeof BADGE_DEFINITIONS].icon, {
                      className: `h-8 w-8 ${BADGE_DEFINITIONS[showNewBadge as keyof typeof BADGE_DEFINITIONS].color}`
                    })}
                  </div>
                </motion.div>
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  🎉 New Badge Earned!
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                  {BADGE_DEFINITIONS[showNewBadge as keyof typeof BADGE_DEFINITIONS].name}
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {BADGE_DEFINITIONS[showNewBadge as keyof typeof BADGE_DEFINITIONS].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Progress Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Progress Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">This Week's Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedTasksThisWeek} / {weeklyGoal} tasks
              </span>
            </div>
            <Progress value={weeklyProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium">{Math.round(weeklyProgress)}% complete</span>
              <span>100%</span>
            </div>
            
            {weeklyProgress >= 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
              >
                <p className="text-green-700 dark:text-green-300 font-medium">
                  🎯 Weekly goal achieved! Outstanding consistency!
                </p>
              </motion.div>
            )}
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeeklyGoal(Math.max(7, weeklyGoal - 7))}
              >
                Lower Goal
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWeeklyGoal(weeklyGoal + 7)}
              >
                Raise Goal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(BADGE_DEFINITIONS).map(([badgeType, definition]) => {
              const earned = badges.find(b => b.badge_type === badgeType)
              const isEarned = !!earned
              
              return (
                <motion.div
                  key={badgeType}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    isEarned 
                      ? `${definition.bgColor} border-current` 
                      : 'bg-muted/20 border-muted-foreground/20 opacity-50'
                  }`}
                >
                  <div className={`inline-flex p-3 rounded-full mb-2 ${
                    isEarned ? definition.bgColor : 'bg-muted'
                  }`}>
                    {React.createElement(definition.icon, {
                      className: `h-6 w-6 ${isEarned ? definition.color : 'text-muted-foreground'}`
                    })}
                  </div>
                  <h4 className={`font-medium text-sm mb-1 ${
                    isEarned ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {definition.name}
                  </h4>
                  <p className={`text-xs ${
                    isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  }`}>
                    {definition.description}
                  </p>
                  {earned && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {new Date(earned.earned_at).toLocaleDateString()}
                    </Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
          
          {badges.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Complete tasks consistently to earn your first badge!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}