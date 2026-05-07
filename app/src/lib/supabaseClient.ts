import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use Vite environment variables
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    "https://cnycpwqkxytzinejlhkk.supabase.co";
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    console.error("VITE_SUPABASE_ANON_KEY is not configured");
    console.error(
      "Available env vars:",
      Object.keys(import.meta.env).filter((k) => k.includes("SUPABASE")),
    );
    throw new Error(
      "Supabase anonymous key is required. Please check environment variables.",
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "luxpos-auth-token", // prevents lock conflicts
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return supabaseInstance;
}

export default getSupabaseClient;
