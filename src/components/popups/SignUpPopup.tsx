import React, { useState } from 'react';
import Popup from '../Popup';
import { supabase } from '../../utils/supabaseClient';

interface SignUpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignUpPopup: React.FC<SignUpPopupProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    console.log('Google button clicked');
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) {
        setError(error.message || 'Google sign-in failed.');
      } else {
        // If the popup is blocked, show a user-friendly error
        setTimeout(() => {
          if (!window.opener && !window.closed) {
            setError('Popup was blocked. Please allow popups and try again.');
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
    setLoading(false);
  };
  const handleGitHub = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) setError(error.message);
    setLoading(false);
  };
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Sign up user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw new Error(signUpError.message);
      // 2. Store profile data for later (after login)
      localStorage.setItem('pending-profile', JSON.stringify({ name, email, dob }));
      setLoading(false);
      setError('Check your email to confirm your account. After confirming, log in to complete your profile.');
    } catch (err: any) {
      setError(err.message || 'Sign up failed.');
      setLoading(false);
    }
  };

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={null} maxWidth="max-w-sm">
      <div className="relative flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl bg-gradient-to-br from-white/30 via-white/10 to-cyan-200/10 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-cyan-900/10 backdrop-blur-2xl border border-white/30 min-w-[340px] animate-auth-popin group focus-within:scale-105 focus-within:shadow-2xl transition-all duration-300" style={{ boxShadow: '0 8px 40px 0 rgba(6,182,212,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)' }}>
        <h2 className="text-3xl font-extrabold text-white mb-1 mt-2 drop-shadow-lg tracking-tight animate-auth-title-popin" style={{fontFamily:'inherit'}}>Create your account</h2>
        <p className="text-gray-200 text-base mb-7 font-medium animate-auth-subtitle-popin">Sign up to get started</p>
        <button className="w-full py-3 rounded-2xl bg-gradient-to-tr from-white/30 to-cyan-300/20 hover:from-white/40 hover:to-cyan-400/30 text-white font-semibold shadow-lg transition-all duration-200 mb-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow flex items-center justify-center gap-2" onClick={handleGoogle} disabled={loading}>
          {loading ? <span className="loader mr-2" /> : null}
          Continue with Google
        </button>
        <button className="w-full py-3 rounded-2xl bg-gradient-to-tr from-white/30 to-gray-700/20 hover:from-white/40 hover:to-gray-800/30 text-white font-semibold shadow-lg transition-all duration-200 mb-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow" onClick={handleGitHub} disabled={loading}>
          Continue with GitHub
        </button>
        <div className="flex items-center w-full my-4 animate-auth-divider-popin">
          <div className="flex-1 h-px bg-white/30" />
          <span className="mx-3 text-gray-200 text-sm font-semibold tracking-wide">or</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>
        <form className="w-full flex flex-col gap-3 animate-auth-input-popin" onSubmit={handleEmailSignUp}>
          <input className="w-full py-3 px-4 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
          <input className="w-full py-3 px-4 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
          <input className="w-full py-3 px-4 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl" type="date" placeholder="Date of Birth" value={dob} onChange={e => setDob(e.target.value)} required disabled={loading} />
          <input className="w-full py-3 px-4 rounded-2xl bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/40 shadow-inner transition-all duration-200 focus:bg-white/40 focus:backdrop-blur-lg group-hover:scale-105 group-hover:shadow-xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          <button className="w-full py-3 rounded-2xl bg-cyan-400 text-white font-semibold shadow-lg mt-2 transition-all duration-200 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 animate-auth-btn-popin premium-btn-glow" type="submit" disabled={loading}>Sign Up</button>
        </form>
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
        .loader {
          border: 2px solid #e0e0e0;
          border-top: 2px solid #06b6d4;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Popup>
  );
};

export default SignUpPopup; 