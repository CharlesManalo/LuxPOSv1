import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getUserByAuthId } from "@/lib/supabaseDb";

let authInitStarted = false;

function initializeAuth() {
  if (authInitStarted) return;
  authInitStarted = true;

  const supabase = getSupabaseClient();
  const { setUser, setLoading } = useStore.getState();

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      // DON'T setLoading(true) here — login() already handles loading
      try {
        const userData = await getUserByAuthId(session.user.id);
        if (userData) {
          setUser(userData);
        } else {
          console.warn("User not found in database, signing out");
          setUser(null);
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
        // Don't sign out here to avoid infinite loops, just clear the user state
      }
    } else if (event === "SIGNED_OUT") {
      setUser(null);
    }
  });

  // Session check on mount with timeout safety
  const initTimeout = setTimeout(() => {
    console.warn("Auth initialization timeout - forcing unblock");
    setLoading(false); // Force unblock if something hangs
  }, 5000);

  (async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const userData = await getUserByAuthId(session.user.id);
          if (userData) {
            setUser(userData);
          } else {
            console.warn("User not found in database during init");
            setUser(null);
          }
        } catch (userErr) {
          console.error("Failed to get user data during init:", userErr);
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      setUser(null);
    } finally {
      clearTimeout(initTimeout);
      setLoading(false); // Always unblock
    }
  })();
}

export function useAuth() {
  const { currentUser, setLoading, isLoading } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) {
          if (authError.message.includes("Invalid login credentials")) {
            setError("Incorrect email or password. Please try again.");
          } else if (authError.message.includes("Email not confirmed")) {
            setError("Please confirm your email before logging in.");
          } else if (authError.status === 400) {
            setError(
              "Invalid email or password. Please check your credentials.",
            );
          } else if (
            authError.message.includes("User not found") ||
            authError.message.includes("no account")
          ) {
            setError(
              "No account found with this email. Please contact your administrator.",
            );
          } else {
            setError(
              authError.message ||
                "Login failed. Please try again or contact your administrator.",
            );
          }
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
      const supabase = getSupabaseClient();
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
