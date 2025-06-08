import React, { useState, useEffect } from 'react';
import { usePopup } from '../../context/PopupContext';

interface AddQuickLinkPopupProps {
  onAdd: (link: { title: string; url: string }) => void;
}

const AddQuickLinkPopup: React.FC<AddQuickLinkPopupProps> = ({ onAdd }) => {
  const { closePopup, popupData } = usePopup();
  const linkData = popupData.addQuickLink || {};
  
  const [form, setForm] = useState({
    title: '',
    url: '',
  });
  
  // Initialize form with provided data if any
  useEffect(() => {
    setForm({
      title: linkData.initialTitle || '',
      url: linkData.initialUrl || '',
    });
  }, [linkData.initialTitle, linkData.initialUrl]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    
    onAdd({
      title: form.title,
      url: form.url
    });
    
    closePopup();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">Link Title</p>
        <input
          type="text"
          placeholder="e.g. GitHub"
          value={form.title}
          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff4101] border border-zinc-200 dark:border-zinc-600"
          autoFocus
          required
        />
      </div>
      <div className="bg-white dark:bg-zinc-700 p-3 rounded-2xl shadow-md">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mb-2">URL</p>
        <input
          type="text"
          placeholder="e.g. https://github.com"
          value={form.url}
          onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
          className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white rounded-xl text-xs sm:text-sm p-3 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff4101] border border-zinc-200 dark:border-zinc-600"
          required
        />
      </div>
      <div className="flex gap-2 justify-end mt-5">
        <button
          type="button"
          onClick={closePopup}
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
  );
};

export default AddQuickLinkPopup;