import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const prevUserRef = { current: null as User | null };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Log auth events for debugging (can be removed later)
      // eslint-disable-next-line no-console
      console.debug('[useAuth] auth event:', event);

      // If we had a previously authenticated user and now session is null,
      // it often means the refresh token failed (invalid/expired). Sign out
      // cleanly to avoid repeated failed refresh attempts.
      if (prevUserRef.current && !session) {
        // eslint-disable-next-line no-console
        console.warn('[useAuth] previous session lost — clearing local session');
        // Attempt to clear session state and supabase client storage
        supabase.auth.signOut().catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[useAuth] signOut failed:', err);
        });
      }

      setSession(session);
      setUser(session?.user ?? null);
      prevUserRef.current = session?.user ?? null;
      setLoading(false);
    });

    // THEN check for existing session (catch errors gracefully)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        // set prevUser so we can detect sudden session loss later
        // (useful for refresh token failures)
        // @ts-ignore
        if (session?.user) prevUserRef.current = session.user;
        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[useAuth] getSession failed:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session
  };
}
