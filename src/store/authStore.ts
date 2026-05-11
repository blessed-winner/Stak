import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types';
import { slugify } from '../lib/utils';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (val: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (val) => set({ initialized: val }),
  signOut: async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      set({ user: null, profile: null, loading: false });
      // Clear any potential session data from localStorage as a fallback
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
    }
  },
}));

// Function to sync profile
async function syncProfile(user: User | null) {
  if (!user || !isSupabaseConfigured) {
    useAuthStore.setState({ profile: null, loading: false });
    return;
  }

  useAuthStore.setState({ loading: true });
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.warn("Could not fetch profile, attempting to create one:", error.message);
      
      // Try to create a minimal profile so they can at least use the app
      const email = user.email || '';
      const namePart = email.split('@')[0] || 'User';
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: namePart,
          display_name: namePart,
          slug: `${slugify(namePart)}-${Math.random().toString(36).substring(2, 5)}`,
          plan: 'free',
        })
        .select()
        .single();
        
      if (createError) {
        console.error("Failed to auto-create profile:", createError);
        useAuthStore.setState({ profile: null, loading: false });
      } else {
        useAuthStore.setState({ 
          profile: {
            id: newProfile.id,
            fullName: newProfile.full_name,
            displayName: newProfile.display_name,
            slug: newProfile.slug,
            avatarUrl: newProfile.avatar_url,
            plan: newProfile.plan,
            stripeCustomerId: newProfile.stripe_customer_id,
            createdAt: newProfile.created_at,
          } as UserProfile, 
          loading: false 
        });
      }
    } else {
      useAuthStore.setState({ 
        profile: {
          id: profile.id,
          fullName: profile.full_name,
          displayName: profile.display_name,
          slug: profile.slug,
          avatarUrl: profile.avatar_url,
          plan: profile.plan,
          stripeCustomerId: profile.stripe_customer_id,
          createdAt: profile.created_at,
        } as UserProfile, 
        loading: false 
      });
    }
  } catch (err) {
    console.error("Profile sync error:", err);
    useAuthStore.setState({ profile: null, loading: false });
  }
}

// Initial fetch and listener
(async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase is not configured. Authentication will not work.');
    useAuthStore.setState({ initialized: true, loading: false });
    return;
  }

  // Safety timeout: ensure initialized is set to true even if Supabase hangs
  const timeoutId = setTimeout(() => {
    if (!useAuthStore.getState().initialized) {
      useAuthStore.setState({ initialized: true, loading: false });
    }
  }, 5000);

  try {
    // 1. Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    useAuthStore.setState({ user });
    
    if (user) {
      await syncProfile(user);
    } else {
      useAuthStore.setState({ loading: false });
    }
  } catch (err) {
    console.error("Initial auth fetch error:", err);
    useAuthStore.setState({ loading: false });
  } finally {
    clearTimeout(timeoutId);
    useAuthStore.setState({ initialized: true });
  }

  // 2. Listen for changes
  if (isSupabaseConfigured) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      const currentUser = useAuthStore.getState().user;

      // Only update and sync if user actually changed
      // This avoids loops or unnecessary fetches
      if (user?.id !== currentUser?.id) {
        useAuthStore.setState({ user });
        await syncProfile(user);
      }

      if (!useAuthStore.getState().initialized) {
        useAuthStore.setState({ initialized: true });
      }
    });
  }
})();
