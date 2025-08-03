import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Slider } from './ui/slider'
import { 
  Sparkles, 
  Target, 
  Clock, 
  Brain, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Lightbulb,
  Zap,
  Heart
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ReactNode
}

interface OnboardingData {
  name: string
  primaryGoals: string[]
  dailyCapacity: number
  workStyle: string
  motivation: string
  priorities: string[]
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    name: '',
    primaryGoals: [],
    dailyCapacity: 5,
    workStyle: '',
    motivation: '',
    priorities: []
  })

  const goalOptions = [
    { id: 'productivity', label: 'Boost Productivity', icon: Zap, color: 'bg-blue-500' },
    { id: 'focus', label: 'Improve Focus', icon: Target, color: 'bg-green-500' },
    { id: 'balance', label: 'Work-Life Balance', icon: Heart, color: 'bg-pink-500' },
    { id: 'habits', label: 'Build Better Habits', icon: CheckCircle2, color: 'bg-purple-500' },
    { id: 'stress', label: 'Reduce Stress', icon: Brain, color: 'bg-orange-500' },
    { id: 'achievement', label: 'Achieve Goals', icon: Lightbulb, color: 'bg-yellow-500' }
  ]

  const workStyleOptions = [
    { id: 'morning', label: 'Morning Person', desc: 'Peak energy in the morning' },
    { id: 'evening', label: 'Night Owl', desc: 'More productive in the evening' },
    { id: 'flexible', label: 'Flexible', desc: 'Energy varies throughout the day' },
    { id: 'structured', label: 'Structured', desc: 'Prefer consistent schedules' }
  ]

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to No Noise! ✨',
      description: 'Let\'s personalize your productivity journey in just a few steps.',
      component: (
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Cut Through the Noise</h3>
            <p className="text-muted-foreground">
              Focus on what truly matters. We'll help you identify your most important daily priorities 
              and build a sustainable productivity system that works for you.
            </p>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="What should we call you?"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="text-center text-lg"
            />
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'What are your main goals?',
      description: 'Select all that apply. This helps us tailor your experience.',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {goalOptions.map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={data.primaryGoals.includes(goal.id) ? "default" : "outline"}
                  className="w-full h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => {
                    const newGoals = data.primaryGoals.includes(goal.id)
                      ? data.primaryGoals.filter(g => g !== goal.id)
                      : [...data.primaryGoals, goal.id]
                    setData({ ...data, primaryGoals: newGoals })
                  }}
                >
                  <div className={`p-2 rounded-full ${goal.color} text-white`}>
                    <goal.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{goal.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
          {data.primaryGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                Great choice! Selected {data.primaryGoals.length} goal{data.primaryGoals.length !== 1 ? 's' : ''}.
              </p>
            </motion.div>
          )}
        </div>
      )
    },
    {
      id: 'capacity',
      title: 'What\'s your ideal daily capacity?',
      description: 'How many important tasks can you realistically handle per day?',
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">{data.dailyCapacity}</div>
            <p className="text-muted-foreground">tasks per day</p>
          </div>
          <div className="px-4">
            <Slider
              value={[data.dailyCapacity]}
              onValueChange={([value]) => setData({ ...data, dailyCapacity: value })}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>1</span>
              <span>5 (recommended)</span>
              <span>10</span>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {data.dailyCapacity <= 3 && "Perfect for focused, deep work days."}
              {data.dailyCapacity >= 4 && data.dailyCapacity <= 6 && "Great balance of productivity and sustainability."}
              {data.dailyCapacity >= 7 && "Ambitious! Make sure to prioritize ruthlessly."}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'workstyle',
      title: 'What\'s your work style?',
      description: 'This helps us suggest the best times for your most important tasks.',
      component: (
        <div className="space-y-3">
          {workStyleOptions.map((style) => (
            <motion.div
              key={style.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                variant={data.workStyle === style.id ? "default" : "outline"}
                className="w-full p-4 h-auto justify-start"
                onClick={() => setData({ ...data, workStyle: style.id })}
              >
                <div className="text-left">
                  <div className="font-medium">{style.label}</div>
                  <div className="text-sm text-muted-foreground">{style.desc}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: 'priorities',
      title: 'What are your top 3 priorities right now?',
      description: 'These will become your first tasks. Be specific!',
      component: (
        <div className="space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium">Priority #{index + 1}</label>
              <Input
                placeholder={`e.g., ${
                  index === 0 ? 'Finish project proposal' : 
                  index === 1 ? 'Exercise for 30 minutes' : 
                  'Call mom'
                }`}
                value={data.priorities[index] || ''}
                onChange={(e) => {
                  const newPriorities = [...data.priorities]
                  newPriorities[index] = e.target.value
                  setData({ ...data, priorities: newPriorities })
                }}
              />
            </div>
          ))}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Pro tip:</strong> Make these specific and actionable. Instead of "work on project," 
              try "write introduction section for project proposal."
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'motivation',
      title: 'What motivates you most?',
      description: 'We\'ll use this to personalize your experience and keep you inspired.',
      component: (
        <div className="space-y-4">
          <Textarea
            placeholder="e.g., Making progress on my goals, helping my team succeed, having more time for family..."
            value={data.motivation}
            onChange={(e) => setData({ ...data, motivation: e.target.value })}
            className="min-h-[120px]"
          />
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              🌟 This helps us show you personalized insights and celebrate your wins in meaningful ways.
            </p>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.name.trim().length > 0
      case 1: return data.primaryGoals.length > 0
      case 2: return true
      case 3: return data.workStyle.length > 0
      case 4: return data.priorities.filter(p => p.trim()).length >= 1
      case 5: return data.motivation.trim().length > 0
      default: return true
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex space-x-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip Setup
              </Button>
            </div>
            <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStepData.component}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {isLastStep ? 'Complete Setup' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}