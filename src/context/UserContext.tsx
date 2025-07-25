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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsGuest(!user && !!localStorage.getItem('guest-mode'));
      // If user just logged in, check for migration
      if (user) {
        // One-time migration for legacy users (optional, can be removed if not needed)
        // const supaTasks = await downloadTasksFromSupabase(user.id);
        // if (!supaTasks || supaTasks.length === 0) {
        //   await migrateLocalDataToSupabase(user.id);
        // }
        // Always restore all data from Supabase
        const all = await downloadAllDataFromSupabase(user.id);
        setLocalTasks(all.tasks);
        setLocalEvents(all.events);
        setLocalActiveWidgets(all.widgets);
        setLocalTheme(all.theme);
        setLocalQuickLinks(all.quickLinks);
        setLocalPomodoroSettings(all.pomodoroSettings);
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!profile) {
          // Try to get profile data from localStorage (set at sign up)
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
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    // Listen for guest-mode changes in other tabs
    const handleStorage = () => {
      setIsGuest(!user && !!localStorage.getItem('guest-mode'));
    };
    window.addEventListener('storage', handleStorage);
    return () => {
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