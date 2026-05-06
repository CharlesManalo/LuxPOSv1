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

  // Flag to prevent sign-out from re-triggering the cycle
  let isSigningOut = false;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      try {
        const userData = await getUserByAuthId(session.user.id);
        if (userData) {
          setUser(userData);
        } else {
          // DON'T sign out here — just clear the user
          // Signing out triggers another SIGNED_IN cycle
          console.warn("User not found in public.users — clearing user state");
          setUser(null);
        }
      } catch (err: any) {
        if (err?.message?.includes("Lock") || err?.name === "AbortError")
          return;
        console.error("Auth state change error:", err);
        setUser(null);
      }
    } else if (event === "SIGNED_OUT") {
      if (!isSigningOut) {
        setUser(null);
      }
    }
  });

  (async () => {
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
        // Don't sign out here — let it just clear loading
      }
    } catch (err: any) {
      if (!err?.message?.includes("Lock")) {
        console.error("Auth initialization error:", err);
      }
    } finally {
      setLoading(false);
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
          if (
            authError.message.includes("Invalid login credentials") ||
            authError.status === 400
          ) {
            setError("Incorrect email or password. Please try again.");
          } else if (authError.message.includes("Email not confirmed")) {
            setError("Please confirm your email before logging in.");
          } else {
            setError(authError.message || "Login failed. Please try again.");
          }
          return false;
        }

        if (data.user) return true;

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
