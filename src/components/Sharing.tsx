import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Share2, Download, Twitter, Link, Copy, Gift } from 'lucide-react'
import { motion } from 'framer-motion'
import { blink } from '../blink/client'
import { toast } from 'react-hot-toast'
import html2canvas from 'html2canvas'

interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  priority: number
}

interface SharingProps {
  user: any
  tasks: Task[]
  currentStreak: number
}

export default function Sharing({ user, tasks, currentStreak }: SharingProps) {
  const [referralCode, setReferralCode] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  const generateReferralCode = async () => {
    if (!user?.id) return
    
    try {
      // Check if user already has a referral code
      const existingReferrals = await blink.db.userReferrals.list({
        where: { userId: user.id },
        limit: 1
      })
      
      if (existingReferrals && existingReferrals.length > 0) {
        setReferralCode(existingReferrals[0].referralCode)
        
        // Count completed referrals
        const completedReferrals = await blink.db.userReferrals.list({
          where: { 
            userId: user.id
          }
        })
        setReferralCount(completedReferrals?.length || 0)
      } else {
        // Generate new referral code
        const code = `NONOISE${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        await blink.db.userReferrals.create({
          id: `referral_${Date.now()}`,
          userId: user.id,
          referralCode: code,
          referredUsers: '[]',
          totalReferrals: 0
        })
        
        setReferralCode(code)
        setReferralCount(0)
        toast.success('Referral code generated! 🎁')
      }
    } catch (error) {
      console.error('Error generating referral code:', error)
      toast.error('Failed to generate referral code')
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success('Referral code copied! 📋')
  }

  const generateShareImage = async () => {
    if (!shareCardRef.current) return
    
    setIsGeneratingImage(true)
    
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#F8FAFC',
        scale: 2,
        width: 600,
        height: 400
      })
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `no-noise-tasks-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success('Image downloaded! 📸')
          
          // Log share activity
          blink.db.taskShares.create({
            id: `share_${Date.now()}`,
            user_id: user.id,
            share_type: 'image',
            task_ids: JSON.stringify(tasks.map(t => t.id)),
            share_data: JSON.stringify({
              completedCount: tasks.filter(t => t.completed).length,
              totalCount: tasks.length,
              streak: currentStreak
            })
          })
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const shareToTwitter = () => {
    const completedCount = tasks.filter(t => t.completed).length
    const text = `🎯 Just completed ${completedCount}/${tasks.length} of my daily priorities on No Noise! ${currentStreak > 0 ? `🔥 ${currentStreak} day streak!` : ''} Cut through the noise and focus on what matters. #NoNoise #Productivity`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    
    // Log share activity
    blink.db.taskShares.create({
      id: `share_${Date.now()}`,
      user_id: user.id,
      share_type: 'tweet',
      task_ids: JSON.stringify(tasks.map(t => t.id)),
      share_data: JSON.stringify({ text, completedCount, streak: currentStreak })
    })
    
    toast.success('Shared to Twitter! 🐦')
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    toast.success('Share link copied! 🔗')
  }

  const completedTasks = tasks.filter(t => t.completed)
  const completedCount = completedTasks.length

  return (
    <div className="space-y-6">
      {/* Share Card Preview */}
      <div className="flex justify-center">
        <div
          ref={shareCardRef}
          className="w-[600px] h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-8 shadow-lg"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">✨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">No Noise</h1>
                  <p className="text-gray-600 dark:text-gray-400">Daily Productivity Tracker</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Today's Progress: {completedCount}/{tasks.length} completed
                </h2>
                
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        task.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {task.completed ? '✓' : index + 1}
                      </div>
                      <span className={`text-sm ${
                        task.completed 
                          ? 'text-gray-600 dark:text-gray-400 line-through' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentStreak > 0 && (
                  <Badge className="bg-orange-500 text-white">
                    🔥 {currentStreak} day streak
                  </Badge>
                )}
                <Badge variant="secondary">
                  Cut through the noise
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              onClick={generateShareImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingImage ? 'Generating...' : 'Download Image'}
            </Button>
            
            <Button
              onClick={shareToTwitter}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4" />
              Share to Twitter
            </Button>
            
            <Button
              onClick={copyShareLink}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Copy Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share No Noise with friends and help them cut through the noise too! 
              Get recognition for every person you help discover focused productivity.
            </p>
            
            {referralCode ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    onClick={copyReferralCode}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    People you've helped get started:
                  </span>
                  <Badge variant="secondary">
                    {referralCount} referrals
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Share this code with friends or use the share link above. 
                  When they sign up with your code, you'll both be part of the No Noise community!
                </p>
              </div>
            ) : (
              <Button onClick={generateReferralCode} className="w-full">
                Generate My Referral Code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}