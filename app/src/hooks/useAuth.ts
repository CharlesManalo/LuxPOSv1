import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { supabase } from "@/lib/supabase";
import { getUserByAuthId } from "@/lib/supabaseDb";

export function useAuth() {
  const { currentUser, setUser, setLoading, isLoading } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    // Check for existing session
    const initializeAuth = async () => {
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

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
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
