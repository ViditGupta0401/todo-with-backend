import React from 'react';
import { format } from 'date-fns';
import { usePopup } from '../../context/PopupContext';
import Popup from '../Popup';
import AddEventPopup from './AddEventPopup';
import AddQuickLinkPopup from './AddQuickLinkPopup';
import UserGuidePopup from './UserGuidePopup';
import DayDetailsPopup from './DayDetailsPopup';
import EventDetailsPopup from './EventDetailsPopup';
import PomodoroSettingsPopup from './PomodoroSettingsPopup';

interface PopupManagerProps {
  onAddEvent: (event: { title: string; date: string; time: string; description?: string; color: string }) => void;
  onAddQuickLink: (link: { title: string; url: string; icon?: string }) => void;
}

const PopupManager: React.FC<PopupManagerProps> = ({ onAddEvent, onAddQuickLink }) => {
  const { activePopup, closePopup, popupData } = usePopup();
  
  return (
    <>
      {/* Add Event Popup */}
      <Popup 
        isOpen={activePopup === 'addEvent'} 
        onClose={closePopup}
        title="Add Event"
        maxWidth="max-w-sm"
      >
        <AddEventPopup onAdd={onAddEvent} />
      </Popup>
      
      {/* Add Quick Link Popup */}
      <Popup 
        isOpen={activePopup === 'addQuickLink'} 
        onClose={closePopup}
        title="Add Quick Link"
        maxWidth="max-w-md"
      >
        <AddQuickLinkPopup onAdd={onAddQuickLink} />
      </Popup>
      
      {/* User Guide Popup */}
      <Popup 
        isOpen={activePopup === 'userGuide'} 
        onClose={closePopup}
        showCloseButton={false}
        maxWidth="max-w-2xl"
      >
        <UserGuidePopup />
      </Popup>
        {/* Daily Info Popup */}
      {activePopup === 'dailyInfo' && (
        <Popup 
          isOpen={true} 
          onClose={closePopup}
          title="Daily Information"
          maxWidth="max-w-2xl"
        >
          <div className="text-center p-4">
            <h3 className="text-xl mb-2">Daily Information</h3>
            <p>This is a placeholder for daily information content.</p>
          </div>
        </Popup>
      )}
      
      {/* Day Details Popup */}
      <Popup 
        isOpen={activePopup === 'dayDetails'} 
        onClose={closePopup}
        title={popupData.dayDetails?.date ? format(new Date(popupData.dayDetails.date), 'MMMM d, yyyy') : 'Day Details'}
        maxWidth="max-w-md"
      >
        <DayDetailsPopup />
      </Popup>
        {/* Event Details Popup */}
      <Popup 
        isOpen={activePopup === 'eventDetails'} 
        onClose={closePopup}
        title={popupData.eventDetails?.date ? `Events: ${format(new Date(popupData.eventDetails.date), 'MMMM d, yyyy')}` : 'Events'}
        maxWidth="max-w-md"
      >
        <EventDetailsPopup />
      </Popup>

      {/* Pomodoro Settings Popup */}
      <Popup 
        isOpen={activePopup === 'pomodoroSettings'} 
        onClose={closePopup}
        title="Pomodoro Settings"
        maxWidth="max-w-[300px]"
      >
        {popupData.pomodoroSettings && (
          <PomodoroSettingsPopup 
            settings={popupData.pomodoroSettings.settings} 
            onUpdateSetting={popupData.pomodoroSettings.onUpdateSetting} 
          />
        )}
      </Popup>
    </>
  );
};

export default PopupManager;
