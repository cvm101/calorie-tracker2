import { createClient } from '@supabase/supabase-js';

// We pull these securely from the .env.local file you created earlier
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check to make sure the environment variables are actually there
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables! Check your .env.local file.");
}

// Create and export the Supabase client so you can use it anywhere in your app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);