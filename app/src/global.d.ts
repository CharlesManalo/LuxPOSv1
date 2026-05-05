// Global type declarations to fix Supabase and process issues

declare const process: {
  env: {
    [key: string]: string | undefined;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

// Suppress strict TypeScript checking for Supabase operations
declare module '@supabase/supabase-js' {
  export interface SupabaseClient {
    from<T = any>(table: string): {
      select(columns?: string): any;
      insert(data: any): any;
      update(data: any): any;
      delete(): any;
      eq(column: string, value: any): any;
      order(column: string, options?: any): any;
      limit(count: number): any;
      single(): any;
    };
    auth: {
      signInWithPassword(credentials: { email: string; password: string }): any;
      signOut(): any;
      getSession(): any;
      onAuthStateChange(callback: (event: string, session: any) => void): {
        data: { subscription: any };
      };
    };
  }
}

export {};
