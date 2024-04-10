import { REACT_NATIVE_SUPABASE_ANON_KEY, REACT_NATIVE_SUPABASE_URL } from '@env'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(REACT_NATIVE_SUPABASE_URL, REACT_NATIVE_SUPABASE_ANON_KEY)
