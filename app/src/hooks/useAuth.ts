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
    console.log("🚀 Starting auth initialization...");
    setLoading(true);

    // Check if Supabase client is working
    try {
      console.log("🔧 Testing Supabase client...");
      getSupabaseClient();
      console.log("✅ Supabase client created successfully");
    } catch (clientErr) {
      console.error("❌ Supabase client creation failed:", clientErr);
      setLoading(false);
      return;
    }

    // Immediate timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn(
        "⏰ Auth initialization timeout after 10 seconds - forcing loading to false",
      );
      console.warn(
        "⏰ This suggests Supabase client or database connectivity issues",
      );
      setLoading(false);
    }, 10000);

    try {
      console.log("🔐 Getting session with 3-second timeout...");

      // Wrap getSession in a timeout to prevent hanging on unconfigured domains
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getSession_timeout")), 3000),
        ),
      ]);

      const session = (sessionResult as any)?.data?.session;
      console.log("🔐 Session check:", {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      if (session?.user) {
        try {
          console.log("🔍 Getting user data for:", session.user.id);
          const userData = await getUserByAuthId(session.user.id);
          console.log("👤 User data:", userData);
          if (userData) {
            setUser(userData);
          } else {
            console.warn("⚠️ User not found in database, but session exists");
            setUser(null);
          }
        } catch (dbErr: any) {
          console.error("❌ Database error getting user:", dbErr);
          // Temporarily set user with basic info to bypass database issues
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            role: "owner", // Default role for testing
            tenant_id: "temp-tenant-id",
            full_name: session.user.user_metadata?.full_name || "User",
            avatar_url: null,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        console.log("🔐 No session found");
      }
    } catch (err: any) {
      if (err?.message === "getSession_timeout") {
        console.error("❌ CRITICAL: getSession() timed out after 3 seconds");
        console.error(
          "❌ This domain is likely NOT configured in Supabase auth settings:",
        );
        console.error(`❌   Current domain: ${window.location.origin}`);
        console.error("❌");
        console.error(
          "❌ FIX: Go to Supabase Dashboard → Authentication → URL Configuration",
        );
        console.error(
          `❌   Add '${window.location.origin}' to Site URL and Redirect URLs`,
        );
        console.error("❌   Also add pattern: '${window.location.origin}/**'");
      } else if (!err?.message?.includes("Lock")) {
        console.error("Auth initialization error:", err);
      }
    } finally {
      clearTimeout(timeout);
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

  // Add Supabase connection test for debugging
  const testSupabaseConnection = useCallback(async () => {
    try {
      console.log("🔍 Testing Supabase connection on:", window.location.origin);
      const supabase = getSupabaseClient();
      if (supabase) {
        console.log("✅ Supabase client available");

        // Test basic database connection
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name")
          .limit(1);
        console.log(
          "Database test:",
          error ? `❌ ${error.message}` : "✅ Connected",
        );

        if (data && data.length > 0) {
          console.log("Sample data:", data[0]);
        }
      } else {
        console.log("❌ Supabase client not available");
        console.log("Environment check:", {
          url: import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          availableVars: Object.keys(import.meta.env).filter((k) =>
            k.includes("SUPABASE"),
          ),
        });
      }
    } catch (err) {
      console.error("❌ Supabase connection test failed:", err);
    }
  }, []);

  return {
    currentUser,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!currentUser,
    testSupabaseConnection,
  };
}
