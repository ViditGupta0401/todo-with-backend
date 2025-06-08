import React, { useState } from 'react';
import alarmAudioWakeUp from '../PomodoroTimer/alarm_wake_up.mp3';
import alarmAudioMorning from '../PomodoroTimer/morning_flower.mp3';
import { usePomodoroSettings } from '../../context/PomodoroSettingsContext';
import { usePopup } from '../../context/PopupContext';

const PomodoroSettingsPopup: React.FC = () => {
  const { settings, updateSetting } = usePomodoroSettings();
  const { closePopup } = usePopup();
  const [activeTab, setActiveTab] = useState<'duration' | 'notifications'>('duration');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl p-7 animate-fadeIn">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl font-bold rounded-full p-1 transition-colors"
          onClick={closePopup}
          aria-label="Close settings"
        >
          ×
        </button>
        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-4 text-center">Pomodoro Settings</h2>
      {/* Tab navigation */}
      <div className="tab-navigation flex mb-6">
        <button 
          className={`tab-button py-2 px-4 rounded-full flex-1 ${activeTab === 'duration' ? 'bg-[#333]' : ''}`}
          onClick={() => setActiveTab('duration')}
        >
          DURATION
        </button>
        <button 
          className={`tab-button py-2 px-4 rounded-full flex-1 ${activeTab === 'notifications' ? 'bg-[#333]' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          NOTIFICATIONS
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'duration' && (
          <div className="duration-settings">
            {/* Focus duration */}
            <div className="setting-item flex justify-between items-center mb-4">
              <span className="text-gray-300">Focus Session</span>
              <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    className="w-16 text-right bg-[#1a1a1a] rounded-md px-2 py-1 text-white"
                    value={settings.focusDuration}
                    onChange={e => updateSetting('focusDuration', Math.max(1, Number(e.target.value)))}
                    aria-label="Focus duration in minutes"
                  />
                <span className="text-gray-500 ml-1">min</span>
                </div>
              </div>
            {/* Short break duration */}
            <div className="setting-item flex justify-between items-center mb-4">
              <span className="text-gray-300">Short break</span>
              <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    className="w-16 text-right bg-[#1a1a1a] rounded-md px-2 py-1 text-white"
                    value={settings.shortBreakDuration}
                    onChange={e => updateSetting('shortBreakDuration', Math.max(1, Number(e.target.value)))}
                    aria-label="Short break duration in minutes"
                  />
                <span className="text-gray-500 ml-1">min</span>
                </div>
              </div>
            {/* Long break duration */}
            <div className="setting-item flex justify-between items-center mb-4">
              <span className="text-gray-300">Long break</span>
              <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    className="w-16 text-right bg-[#1a1a1a] rounded-md px-2 py-1 text-white"
                    value={settings.longBreakDuration}
                    onChange={e => updateSetting('longBreakDuration', Math.max(1, Number(e.target.value)))}
                    aria-label="Long break duration in minutes"
                  />
                <span className="text-gray-500 ml-1">min</span>
                </div>
              </div>
            {/* Long break after */}
            <div className="setting-item flex justify-between items-center">
              <span className="text-gray-300">Long break after</span>
              <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    className="w-16 text-right bg-[#1a1a1a] rounded-md px-2 py-1 text-white"
                    value={settings.longBreakAfter}
                    onChange={e => updateSetting('longBreakAfter', Math.max(1, Number(e.target.value)))}
                    aria-label="Number of sessions before long break"
                  />
                <span className="text-gray-500 ml-1">sess.</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'notifications' && (
            <div className="notification-settings">
              {/* Audio File Settings */}
              <div className="setting-item flex justify-between items-center mb-4">
                <span className="text-gray-300">Alarm Audio</span>
                <div className="flex items-center">
                  <select
                    className="bg-[#1a1a1a] rounded-md px-2 py-1"
                    onChange={e => updateSetting('alarmAudio', e.target.value)}
                    value={settings.alarmAudio || 'alarm_wake_up'}
                  >
                    <option value="alarm_wake_up">Alarm Wake Up</option>
                    <option value="morning_flower">Morning Flower</option>
                  </select>
                </div>
              </div>
              {/* Volume Settings */}
              <div className="setting-item flex justify-between items-center mb-4">
                <span className="text-gray-300">Volume</span>
                <div className="flex items-center">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-32"
                    value={Math.round((settings.alarmVolume ?? 0.3) * 100)}
                    onChange={(e) => updateSetting('alarmVolume', Number(e.target.value) / 100)}
                  />
                  <span className="text-gray-500 ml-2 w-8">
                    {Math.round((settings.alarmVolume ?? 0.3) * 100)}%
                  </span>
                </div>
              </div>
              {/* Push Notifications */}
              <div className="setting-item flex justify-between items-center mb-4">
                <span className="text-gray-300">Push Notifications</span>
                <div className="flex items-center">
                  <button 
                    className="px-3 py-1 rounded-md bg-[#333] hover:bg-[#444] transition-colors"
                    onClick={() => {
                      if (Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
                        Notification.requestPermission();
                      }
                    }}
                  >
                    {typeof Notification !== 'undefined' && Notification.permission === "granted" ? "Enabled" : "Enable"}
                  </button>
                </div>
              </div>
              {/* Test Alarm */}
              <div className="setting-item flex justify-between items-center">
                <span className="text-gray-300">Test Alarm</span>
                <div className="flex items-center">
                  <button 
                    className="px-3 py-1 rounded-md bg-[#333] hover:bg-[#444] transition-colors"
                    onClick={() => {
                      try {
                        let audioFile = alarmAudioWakeUp;
                        if (settings.alarmAudio === 'morning_flower') {
                          audioFile = alarmAudioMorning;
                        }
                        const audio = new Audio(audioFile);
                        audio.volume = settings.alarmVolume ?? 0.3;
                        audio.play();
                        setTimeout(() => {
                          audio.pause();
                          audio.currentTime = 0;
                        }, 2000);
                      } catch (e) {
                        console.log('Audio error:', e);
                      }
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroSettingsPopup;
