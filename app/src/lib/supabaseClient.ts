import { createClient } from "@supabase/supabase-js";

// Declare process for build environment
declare const process: any;

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use fallback values for build environment
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || "https://cnycpwqkxytzinejlhkk.supabase.co";
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    console.error("VITE_SUPABASE_ANON_KEY is not configured");
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
    );
    throw new Error(
      "Supabase anonymous key is required. Please check environment variables.",
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

export default getSupabaseClient;
