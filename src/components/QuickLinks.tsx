import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePopup } from '../context/PopupContext';
import { useUser } from '../context/UserContext';
import { uploadQuickLinksToSupabase } from '../utils/supabaseSync';

interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export const QuickLinks: React.FC = () => {
  const [links, setLinks] = useState<QuickLink[]>(() => {
    const savedLinks = localStorage.getItem('quick-links');
    return savedLinks ? JSON.parse(savedLinks) : [];
  });
  
  const { openPopup } = usePopup();
  const { user, isGuest } = useUser();

  // Update links when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLinks = localStorage.getItem('quick-links');
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (user && !isGuest) uploadQuickLinksToSupabase(user.id, links);
  }, [links, user, isGuest]);

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  const handleRemoveLink = (id: string) => {
    setLinks(prev => {
      const updated = prev.filter(link => link.id !== id);
      localStorage.setItem('quick-links', JSON.stringify(updated));
      if (user && !isGuest) uploadQuickLinksToSupabase(user.id, updated);
      return updated;
    });
  };
  
  const handleAddLinkClick = () => {
    openPopup('addQuickLink');
  };

  return (
    <div className="relative bg-white dark:bg-[#222126] p-2 rounded-3xl shadow-xl mb-6">
      <div className="flex gap-2 items-center flex-wrap">
        <AnimatePresence initial={false}>
          {links.map(link => (
            <motion.div
              key={link.id}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, duration: 0.25 }}
              className="flex flex-col items-center"
              layout
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-16 h-16 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={link.title}
              >
                <img 
                  src={getFaviconUrl(link.url)} 
                  alt={link.title} 
                  className="w-full h-full p-2 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const span = document.createElement('span');
                      span.className = 'text-sm font-bold text-gray-700 dark:text-white';
                      span.textContent = link.title[0];
                      parent.appendChild(span);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveLink(link.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-transparent rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Remove link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="#f47373"></path><path d="m13.06 12 2.3-2.3c.29-.29.29-.77 0-1.06a.754.754 0 0 0-1.06 0l-2.3 2.3-2.3-2.3a.754.754 0 0 0-1.06 0c-.29.29-.29.77 0 1.06l2.3 2.3-2.3 2.3c-.29.29-.29.77 0 1.06.15.15.34.22.53.22s.38-.07.53-.22l2.3-2.3 2.3 2.3c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77 0-1.06l-2.3-2.3Z" fill="#f47373"></path></svg>
                </button>
              </a>
              <span className="text-xs text-gray-500 dark:text-zinc-500 text-center w-20 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                {link.title}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={handleAddLinkClick}
          className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          title="Add new link"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
