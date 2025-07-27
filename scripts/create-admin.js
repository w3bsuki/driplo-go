import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    // First, try to delete existing user
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      filter: `email=eq.w3bsuki@gmail.com`
    })
    
    if (existingUsers?.users?.length > 0) {
      console.log('Deleting existing user...')
      await supabase.auth.admin.deleteUser(existingUsers.users[0].id)
    }
    
    // Create new user
    console.log('Creating new user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'w3bsuki@gmail.com',
      password: '12345678',
      email_confirm: true,
      user_metadata: {
        username: 'w3bsuki',
        full_name: 'Admin User'
      }
    })
    
    if (authError) {
      throw authError
    }
    
    console.log('User created:', authData.user.id)
    
    // Update profile to admin
    console.log('Updating profile to admin...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_admin: true,
        setup_completed: true
      })
      .eq('id', authData.user.id)
    
    if (profileError) {
      throw profileError
    }
    
    console.log('✅ Admin user created successfully!')
    console.log('Email: w3bsuki@gmail.com')
    console.log('Password: 12345678')
    console.log('User ID:', authData.user.id)
    
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

createAdminUser()