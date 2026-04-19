import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { signIn, signOut } from '@/lib/mockDb';
import type { AppUser } from '@/types';

export function useAuth() {
  const { currentUser, setUser, setLoading, isLoading } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('luxpos_user');
    if (stored) {
      try {
        const user = JSON.parse(stored) as AppUser;
        setUser(user);
      } catch {
        localStorage.removeItem('luxpos_user');
      }
    }
    setLoading(false);
  }, [setUser, setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { user, error: err } = await signIn(email, password);
      if (err) {
        setError(err);
        setLoading(false);
        return false;
      }
      if (user) {
        setUser(user);
        localStorage.setItem('luxpos_user', JSON.stringify(user));
        setLoading(false);
        return true;
      }
      setError('Unknown error');
      setLoading(false);
      return false;
    } catch {
      setError('Login failed');
      setLoading(false);
      return false;
    }
  }, [setUser, setLoading]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    localStorage.removeItem('luxpos_user');
  }, [setUser]);

  return { currentUser, isLoading, error, login, logout, isAuthenticated: !!currentUser };
}
