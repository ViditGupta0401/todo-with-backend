import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { usePopup } from '../../context/PopupContext';
import { EventColor, UpcomingEvent } from '../UpcomingEventsWidget';

interface AddEventPopupProps {
  onAdd: (event: Omit<UpcomingEvent, 'id'>) => void;
}

const AddEventPopup: React.FC<AddEventPopupProps> = ({ onAdd }) => {
  const { closePopup, popupData } = usePopup();
  const eventData = popupData.addEvent || {};  
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
  });
  
  // Set default date and time when popup opens
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setForm({
      title: '',
      date: eventData.initialDate || format(tomorrow, 'yyyy-MM-dd'),
      time: eventData.initialTime || '12:00',
      description: '',
    });
  }, [eventData.initialDate, eventData.initialTime]);
    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) return;
    
    // Import and use the getEventsForDate function to check for existing events
    import('../../utils/eventUtils').then(({ getEventsForDate }) => {
      // Check if there are other events on the same day
      const eventsForDate = getEventsForDate(form.date);
      
      // Default color is blue, but if there are other events on the same day, use different colors
      let color: EventColor = 'blue';
      
      // If there are already events on this day, use a different color for each event to distinguish them
      if (eventsForDate.length > 0) {
        const colors: EventColor[] = ['red', 'purple', 'green', 'orange'];
        // Select color based on the number of existing events, cycling through the options
        color = colors[eventsForDate.length % colors.length];
      }
      
      onAdd({
        id: Date.now().toString(),
        title: form.title,
        date: form.date,
        time: form.time,
        description: form.description,
        color: color,
      });
      
      closePopup();
    }).catch(error => {
      console.error('Error loading event utilities:', error);
      // Fallback - use blue as default color
      onAdd({
        id: Date.now().toString(),
        title: form.title,
        date: form.date,
        time: form.time,
        description: form.description,
        color: 'blue',
      });
      
      closePopup();
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Title</label>
        <input
          className="w-full rounded-lg bg-[#18171b] text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4101]"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
          maxLength={32}
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded-lg bg-[#18171b] text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4101]"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Time</label>
          <input
            type="time"
            className="w-full rounded-lg bg-[#18171b] text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4101]"
            value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            required
          />
        </div>
      </div>      <div>
        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <input
          className="w-full rounded-lg bg-[#18171b] text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4101]"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          maxLength={64}
        />
      </div>
      {/* Color is now automatically determined based on other events on the same date */}
      <button
        type="submit"
        className="w-full bg-[#ff4101] hover:bg-[#e63a00] text-white rounded-lg py-2 mt-2 font-semibold text-sm shadow"
      >
        Add Event
      </button>
    </form>
  );
};

export default AddEventPopup;