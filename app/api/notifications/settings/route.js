import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

const supabase = createClient(supabaseUrl, supabaseKey)

// GET — load current preferences for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_email', session.user.email)
    .single()

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Return defaults if no row yet — new users get sensible defaults
  return Response.json(data || {
    renewal_reminders:     true,
    trial_expiry_alerts:   true,
    weekly_summary:        false,
    unused_service_alerts: false,
  })
}

// POST — save preferences
export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    renewal_reminders,
    trial_expiry_alerts,
    weekly_summary,
    unused_service_alerts,
  } = body

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_email:            session.user.email,
      renewal_reminders:     renewal_reminders     ?? true,
      trial_expiry_alerts:   trial_expiry_alerts   ?? true,
      weekly_summary:        weekly_summary        ?? false,
      unused_service_alerts: unused_service_alerts ?? false,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'user_email' })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
