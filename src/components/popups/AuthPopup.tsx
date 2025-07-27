import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Popup from '../Popup';
import { useUser } from '../../context/UserContext';
import SignUpPopup from './SignUpPopup';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthPopup: React.FC<AuthPopupProps> = ({ isOpen, onClose }) => {
  // Listen for show-signin event
  React.useEffect(() => {
    const handleShowSignIn = () => setIsSignUp(false);
    document.addEventListener('show-signin', handleShowSignIn);
    return () => document.removeEventListener('show-signin', handleShowSignIn);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true); // Default to Sign Up for new users
  const { setGuest, refreshUser } = useUser();
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  const handleProviderLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Provider login error:', error);
        setError(error.message);
        setLoading(false);
      } else {
        // Don't close or refresh here - let the redirect happen
        console.log('Provider login initiated:', data);
      }
    } catch (err) {
      console.error('Provider login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.error) {
        console.error('Email auth error:', result.error);
        setError(result.error.message);
      } else {
        console.log('Email auth successful:', result.data);
        await refreshUser();
        onClose();
      }
    } catch (err) {
      console.error('Email auth error:', err);
      setError('An error occurred during authentication. Please try again.');
    }
    setLoading(false);
  };

  const handleGuest = () => {
    setGuest();
    onClose();
  };

  if (showSignUpPopup) {
    return <SignUpPopup isOpen={true} onClose={() => setShowSignUpPopup(false)} />;
  }
  return (
    <Popup isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl bg-gradient-to-br from-white/30 via-white/10 to-cyan-200/10 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-cyan-900/10 backdrop-blur-2xl border border-white/30 min-w-[340px] animate-auth-popin group focus-within:scale-105 focus-within:shadow-2xl transition-all duration-300" style={{ boxShadow: '0 8px 40px 0 rgba(6,182,212,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)' }}>
        <h2 className="text-3xl font-extrabold text-white mb-1 mt-2 drop-shadow-lg tracking-tight animate-auth-title-popin" style={{fontFamily:'inherit'}}> {isSignUp ? 'Create your account' : 'Welcome back'} </h2>
        <p className="text-gray-200 text-base mb-7 font-medium animate-auth-subtitle-popin">{isSignUp ? 'Sign up to get started' : 'Sign in to your account'}</p>
        <div className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <input
              className="w-full py-3 pl-4 pr-12 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl animate-auth-input-popin"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-tr from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow"
              onClick={handleEmailLogin}
              disabled={loading || !email || (isSignUp && !password)}
              tabIndex={-1}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0-5-5m5 5-5 5"/></svg>
            </button>
          </div>
          <div className="relative w-full transition-all duration-200">
            <input
              className="w-full py-3 pl-4 pr-12 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl animate-auth-input-popin"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={loading}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:bg-cyan-100/20 focus:bg-cyan-100/30 rounded-full transition-all duration-200 focus:outline-none animate-auth-btn-popin"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              type="button"
            >
              {showPassword ? (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M1 1l22 22M17.94 17.94A10.05 10.05 0 0 1 12 19c-5.05 0-9.27-3.94-10-9a9.98 9.98 0 0 1 4.2-6.36M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/><path stroke="currentColor" strokeWidth="2" d="M9.88 9.88A3 3 0 0 1 12 9a3 3 0 0 1 2.12 5.12"/></svg>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="7" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center w-full my-6 animate-auth-divider-popin">
          <div className="flex-1 h-px bg-white/30" />
          <span className="mx-3 text-gray-200 text-sm font-semibold tracking-wide">OR</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-tr from-white/30 to-cyan-300/20 hover:from-white/40 hover:to-cyan-400/30 text-white font-semibold shadow-lg transition-all duration-200 mb-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow"
          onClick={() => handleProviderLogin('google')}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><g><circle fill="#fff" cx="24" cy="24" r="24"/><path fill="#4285F4" d="M35.6 24.1c0-.7-.1-1.4-.2-2H24v4.1h6.5c-.3 1.4-1.3 2.6-2.6 3.4v2.8h4.2c2.5-2.3 3.9-5.7 3.9-9.3z"/><path fill="#34A853" d="M24 36c3.2 0 5.8-1.1 7.7-2.9l-4.2-2.8c-1.2.8-2.7 1.3-4.3 1.3-3.3 0-6-2.2-7-5.1h-4.3v3.2C14.7 33.8 19 36 24 36z"/><path fill="#FBBC05" d="M17 26.5c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2v-3.2h-4.3C12.2 21.1 12 22.5 12 24s.2 2.9.7 4.1l4.3-3.2z"/><path fill="#EA4335" d="M24 18.9c1.7 0 3.2.6 4.3 1.7l3.2-3.2C29.8 15.1 27.2 14 24 14c-5 0-9.3 2.2-11.7 5.7l4.3 3.2c1-2.9 3.7-5.1 7-5.1z"/></g></svg>
          Continue with Google
        </button>
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-tr from-white/30 to-gray-700/20 hover:from-white/40 hover:to-gray-800/30 text-white font-semibold shadow-lg transition-all duration-200 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow"
          onClick={() => handleProviderLogin('github')}
          disabled={loading}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.186 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.652 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.38.202 2.399.1 2.652.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.578.688.48C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
          Continue with GitHub
        </button>
        <div className="flex items-center w-full my-5 animate-auth-divider-popin">
          <div className="flex-1 h-px bg-white/30" />
          <span className="mx-3 text-gray-200 text-sm font-semibold tracking-wide">or</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>
        <button
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold shadow border border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow"
          onClick={handleGuest}
          disabled={loading}
        >
          Continue as Guest
        </button>
        <div className="w-full flex justify-center mt-4 animate-auth-footer-popin">
          <span className="text-gray-200 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              className="ml-1 text-cyan-300 hover:underline focus:outline-none font-semibold"
              onClick={() => setIsSignUp(!isSignUp)}
              type="button"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </span>
        </div>
        {error && <div className="text-red-400 text-sm mt-3 text-center font-medium animate-auth-error-popin">{error}</div>}
      </div>
      <style>{`
        @keyframes auth-popin {
          0% { opacity: 0; transform: scale(0.92) translateY(40px); }
          80% { opacity: 1; transform: scale(1.04) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-auth-popin {
          animation: auth-popin 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes auth-title-popin {
          0% { opacity: 0; transform: translateY(-16px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-auth-title-popin {
          animation: auth-title-popin 0.6s 0.1s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-subtitle-popin {
          0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-auth-subtitle-popin {
          animation: auth-subtitle-popin 0.6s 0.18s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-input-popin {
          0% { opacity: 0; transform: scale(0.96) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-auth-input-popin {
          animation: auth-input-popin 0.6s 0.22s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-btn-popin {
          0% { opacity: 0; transform: scale(0.92) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-auth-btn-popin {
          animation: auth-btn-popin 0.6s 0.28s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-divider-popin {
          0% { opacity: 0; transform: scale(0.98) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-auth-divider-popin {
          animation: auth-divider-popin 0.6s 0.32s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-footer-popin {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-auth-footer-popin {
          animation: auth-footer-popin 0.6s 0.36s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes auth-error-popin {
          0% { opacity: 0; transform: scale(0.96) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-auth-error-popin {
          animation: auth-error-popin 0.5s 0.38s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        /* Premium button glow on hover */
        .premium-btn-glow:hover, .premium-btn-glow:focus {
          box-shadow: 0 0 0 4px #22d3ee55, 0 4px 24px #06b6d455;
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </Popup>
  );
};

export default AuthPopup; 