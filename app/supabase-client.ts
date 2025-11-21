import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://arnavklciucorcjmmkpc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmF2a2xjaXVjb3Jjam1ta3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjc0NDAsImV4cCI6MjA3ODcwMzQ0MH0.qf0PU_IcvPv0Qv7dqBKt1U73E-8hV_Zn3hjcrNfo-DQ",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);