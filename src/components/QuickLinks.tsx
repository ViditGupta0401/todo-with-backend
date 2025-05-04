import React, { useState } from 'react';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '';
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLink.title && newLink.url) {
      const link: QuickLink = {
        id: Date.now().toString(),
        title: newLink.title,
        url: newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`
      };
      setLinks(prev => {
        const updated = [...prev, link];
        localStorage.setItem('quick-links', JSON.stringify(updated));
        return updated;
      });
      setNewLink({ title: '', url: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveLink = (id: string) => {
    setLinks(prev => {
      const updated = prev.filter(link => link.id !== id);
      localStorage.setItem('quick-links', JSON.stringify(updated));
      return updated;
    });
  };

  return (
  <div className="bg-white dark:bg-[#222126] p-2 rounded-3xl shadow-xl mb-6">
      <div className="flex gap-2 items-center flex-wrap">
        {links.map(link => (
          <div key={link.id} className="flex flex-col items-center">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-16 h-16 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Remove link"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </a>
            <span className="text-xs text-gray-500 dark:text-zinc-500 text-center w-20 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
              {link.title}
            </span>
          </div>
        ))}
        <button
          onClick={() => setShowAddForm(true)}
          className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          title="Add new link"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <form onSubmit={handleAddLink} className="bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-4 sm:p-5 md:p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                Add Quick Link
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Link Title</p>
                <input
                  type="text"
                  placeholder="e.g. GitHub"
                  value={newLink.title}
                  onChange={e => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff4101] border border-zinc-200 dark:border-zinc-600"
                />
              </div>
              
              <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">URL</p>
                <input
                  type="text"
                  placeholder="e.g. https://github.com"
                  value={newLink.url}
                  onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff4101] border border-zinc-200 dark:border-zinc-600"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs sm:text-sm bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs sm:text-sm bg-[#ff4101] hover:bg-[#ee3d00] text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};