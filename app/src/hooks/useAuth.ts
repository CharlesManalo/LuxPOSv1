import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/stores/useStore";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getUserByAuthId } from "@/lib/supabaseDb";

// Global singleton instance to prevent multiple Supabase clients
let globalSupabaseClient: ReturnType<typeof getSupabaseClient> | null = null;

function getSupabaseSingleton() {
  if (!globalSupabaseClient) {
    globalSupabaseClient = getSupabaseClient();
  }
  return globalSupabaseClient;
}

export function useAuth() {
  const { currentUser, setUser, setLoading, isLoading } = useStore();
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener only once
    const supabase = getSupabaseSingleton();

    // Only set up listener if we don't already have one
    if (!subscriptionRef.current) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return; // Prevent memory leaks

        if (event === "SIGNED_IN" && session?.user) {
          setLoading(true);
          try {
            // Get user data from our users table
            const userData = await getUserByAuthId(session.user.id);
            if (userData) {
              setUser(userData);
            } else {
              setError("User profile not found. Please contact administrator.");
              await supabase.auth.signOut();
            }
          } catch (err) {
            console.error("Auth initialization error:", err);
            setError("Failed to load user profile");
            await supabase.auth.signOut();
          } finally {
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setError(null);
        }
      });

      subscriptionRef.current = subscription;
    }

    // Check for existing session
    const initializeAuth = async () => {
      if (!mounted) return; // Prevent memory leaks
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const userData = await getUserByAuthId(session.user.id);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false; // Cleanup
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [setUser, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const supabase = getSupabaseSingleton();
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) {
          setError(authError.message);
          return false;
        }

        if (data.user) {
          // The auth state change listener will handle setting the user
          return true;
        }

        setError("Login failed");
        return false;
      } catch (err) {
        setError("An unexpected error occurred");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      const supabase = getSupabaseSingleton();
      await supabase.auth.signOut();
      // The auth state change listener will handle clearing the user
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  return {
    currentUser,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };
}
