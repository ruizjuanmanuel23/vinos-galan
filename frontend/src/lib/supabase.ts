import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aktgawwxtfionhortmyu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_v38ANgPeV5KqtF0E5gWfhg_97PQGHfM'

/**
 * Cliente Supabase compartido para toda la app.
 * Usa la "publishable key" — pensada para frontend, sin permisos administrativos.
 * Las policies RLS limitan qué puede hacer (definidas en supabase-schema.sql).
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 5 } },
})
