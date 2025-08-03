// Simple test to verify task creation works
import { blink } from './blink/client'

export async function testTaskCreation() {
  try {
    console.log('🧪 Testing task creation...')
    
    // Get current user
    const user = await blink.auth.me()
    console.log('👤 User:', user.id)
    
    // Create a test task
    const testTask = {
      id: `test_${Date.now()}`,
      userId: user.id,
      title: 'SDK Test Task',
      priority: 1,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    }
    
    console.log('📝 Creating task with data:', testTask)
    
    const result = await blink.db.tasks.create(testTask)
    console.log('✅ Task creation result:', result)
    
    // Try to list tasks
    const tasks = await blink.db.tasks.list({
      where: { userId: user.id }
    })
    console.log('📋 All tasks for user:', tasks)
    
    return { success: true, result, tasks }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { success: false, error: error.message }
  }
}

// Make it available globally for testing
window.testTaskCreation = testTaskCreation