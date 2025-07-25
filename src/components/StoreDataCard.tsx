import React from 'react';
import { usePopup } from '../context/PopupContext';

const StoreDataCard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { openPopup } = usePopup();

  const handleSignUp = () => {
    onClose();
    setTimeout(() => {
      openPopup('auth');
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-card-popin">
      <div
        className="p-4 rounded-2xl shadow-xl bg-gradient-to-br from-white/30 via-white/10 to-cyan-200/10 dark:from-zinc-800/60 dark:via-zinc-900/40 dark:to-cyan-900/10 backdrop-blur-lg border border-white/20 dark:border-zinc-700 flex flex-col items-center text-center transition-all duration-300 group-hover:from-cyan-100/60 group-hover:via-cyan-200/40 group-hover:to-cyan-400/20 dark:group-hover:from-cyan-800/60 dark:group-hover:via-cyan-900/40 dark:group-hover:to-cyan-900/30 group-hover:scale-105 group-hover:shadow-2xl group-focus:scale-105 group-focus:shadow-2xl relative max-w-sm w-full mx-2">
        <button
          className="absolute top-3 right-3 z-60 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-colors shadow-[0_2px_8px_0_rgba(255,255,255,0.25)]"
          style={{ zIndex: 60 }}
          onClick={onClose}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 drop-shadow">Want to Store your Precious Data forever?</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">Sign up for an account and never lose your tasks, events, and customizations!</p>
        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-tr from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white font-semibold shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm relative overflow-hidden group animate-signup-btn-popin premium-btn-glow"
          onClick={handleSignUp}
        >
          <span className="relative z-10">Sign Up</span>
          <span className="absolute left-0 top-0 w-full h-full bg-white/20 opacity-0 group-hover:opacity-100 group-active:opacity-70 transition-opacity duration-300 rounded-lg pointer-events-none animate-shine" />
        </button>
      </div>
      <style>{`
        @keyframes card-popin {
          0% { opacity: 0; transform: scale(0.95) translateY(40px); }
          80% { opacity: 1; transform: scale(1.03) translateY(-8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-card-popin {
          animation: card-popin 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes signup-btn-popin {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-signup-btn-popin {
          animation: signup-btn-popin 0.5s 0.3s cubic-bezier(0.22, 1, 0.36, 1) backwards;
        }
        @keyframes shine {
          0% { left: -100%; }
          60% { left: 100%; opacity: 0.5; }
          100% { left: 100%; opacity: 0; }
        }
        .group:hover .animate-shine {
          animation: shine 0.8s linear;
        }
        /* Premium button glow on hover */
        .premium-btn-glow:hover, .premium-btn-glow:focus {
          box-shadow: 0 0 0 4px #22d3ee55, 0 4px 24px #06b6d455;
          transition: box-shadow 0.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
};

export default StoreDataCard; 