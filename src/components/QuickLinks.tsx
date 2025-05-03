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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleAddLink} className="bg-white dark:bg-gray-800 p-6 rounded-lg flex flex-col gap-4 min-w-[400px]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Quick Link</h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Title"
              value={newLink.title}
              onChange={e => setNewLink(prev => ({ ...prev, title: e.target.value }))}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
            />
            <input
              type="text"
              placeholder="URL"
              value={newLink.url}
              onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};