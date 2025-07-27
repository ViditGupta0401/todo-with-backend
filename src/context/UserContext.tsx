import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import {
  migrateLocalDataToSupabase,
  downloadAllDataFromSupabase,
  downloadTasksFromSupabase,
  setLocalTasks,
  setLocalEvents,
  setLocalActiveWidgets,
  setLocalTheme,
  setLocalQuickLinks,
  setLocalPomodoroSettings
} from '../utils/supabaseSync';

interface UserContextType {
  user: any;
  isGuest: boolean;
  setGuest: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isGuest: false,
  setGuest: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        // Get user data
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (error) {
          console.error('Auth error:', error);
          setUser(null);
          setIsGuest(!!localStorage.getItem('guest-mode'));
          return;
        }

        // Update user state
        if (user) {
          setUser(user);
          setIsGuest(false);
        } else {
          setUser(null);
          setIsGuest(!!localStorage.getItem('guest-mode'));
          return;
        }

        // Only proceed with data loading if we have a user
        if (user && isMounted) {
        // One-time migration for legacy users (optional, can be removed if not needed)
        // const supaTasks = await downloadTasksFromSupabase(user.id);
        // if (!supaTasks || supaTasks.length === 0) {
        //   await migrateLocalDataToSupabase(user.id);
        // }
          // Load user data from Supabase
          const all = await downloadAllDataFromSupabase(user.id);
          
          if (all.tasks && Array.isArray(all.tasks)) {
            setLocalTasks(all.tasks);
            console.log('Tasks loaded successfully:', all.tasks.length);
          }

          if (all.events) setLocalEvents(all.events);
          if (all.widgets) setLocalActiveWidgets(all.widgets);
          if (all.theme) setLocalTheme(all.theme);
          if (all.quickLinks) setLocalQuickLinks(all.quickLinks);
          if (all.pomodoroSettings) setLocalPomodoroSettings(all.pomodoroSettings);

          // Check and create profile if needed
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (!profile) {
            const pendingProfile = localStorage.getItem('pending-profile');
            if (pendingProfile) {
              const { name, email, dob } = JSON.parse(pendingProfile);
              if (name && email && dob) {
                await supabase.from('profiles').insert([{ id: user.id, name, email, dob }]);
                localStorage.removeItem('pending-profile');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in checkUser:', error);
        setUser(null);
        setIsGuest(!!localStorage.getItem('guest-mode'));
      }
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        setIsGuest(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsGuest(false);
      }
    });
    // Listen for guest-mode changes in other tabs
    const handleStorage = () => {
      setIsGuest(!user && !!localStorage.getItem('guest-mode'));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setGuest = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem('guest-mode', '1');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('guest-mode');
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setIsGuest(!user && !!localStorage.getItem('guest-mode'));
  };

  return (
    <UserContext.Provider value={{ user, isGuest, setGuest, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}; 