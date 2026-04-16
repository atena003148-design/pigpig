import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isMockMode = !supabaseUrl || !supabaseAnonKey;

export const supabase = isMockMode
    ? null
    : createClient(supabaseUrl, supabaseAnonKey);

export { isMockMode };
