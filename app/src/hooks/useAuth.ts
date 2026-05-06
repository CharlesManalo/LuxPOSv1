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
      setLoading(true);
      try {
        const userData = await getUserByAuthId(session.user.id);
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    } else if (event === "SIGNED_OUT") {
      setUser(null);
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
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
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

  // Hardcoded admin for development
  const ADMIN_EMAIL = "charlesaustinmanalo@gmail.com";
  const ADMIN_PASSWORD = "admin123@lux";

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setLoading(true);
      try {
        // Hardcoded admin bypass
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const { setUser } = useStore.getState();
          setUser({
            id: "admin-001",
            tenant_id: "admin-tenant",
            email: ADMIN_EMAIL,
            full_name: "Admin User",
            role: "super_admin",
            avatar_url: null,
            created_at: new Date().toISOString(),
          });
          return true;
        }

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
          } else {
            setError(authError.message);
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
