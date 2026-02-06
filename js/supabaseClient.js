import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://btvhnttpeuudhdwkyfnr.supabase.co";

const SUPABASE_KEY = "sb_publishable_oWBA70wNyQe0hNbNpoodnA_YLVMApj1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.supabase = supabase;

