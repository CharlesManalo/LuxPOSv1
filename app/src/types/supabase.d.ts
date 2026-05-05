// Supabase type declarations to bypass TypeScript issues
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    from<T = any>(table: string): any;
    auth: any;
  }
}

declare global {
  interface Window {
    process: any;
  }
}

export {};
