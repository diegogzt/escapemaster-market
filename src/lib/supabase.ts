
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase Environment Variables missing! Connection will fail.');
}

// Create a safe client or a mock to prevent crash on initialization
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.resolve({ data: [], error: { message: 'Supabase Not Configured (Missing Env Vars)' } }),
            insert: () => Promise.resolve({ data: null, error: { message: 'Supabase Not Configured' } }),
            upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase Not Configured' } })
        })
      } as any;
