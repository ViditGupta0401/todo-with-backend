import React, { useState, useEffect, useCallback } from 'react';
import happyPenguin from '../penguin images/happy.png';
import neutralPenguin from '../penguin images/neutral.png';
import angryPenguin from '../penguin images/angry.png';
import sadPenguin from '../penguin images/sad.png';
import cryPenguin from '../penguin images/cry.png';
import moreAngryPenguin from '../penguin images/more angry.png';
import lovePenguin from '../penguin images/love.png';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import LeetCodeStreakBar from './LeetCodeStreakBar';
import StreakCard from './StreakCard';

interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  totalTotal: number; // Sum of totalEasy, totalMedium, totalHard from API
  ranking: number;
  contributionPoint: number;
  reputation: number;
  submissionCalendar: { [key: string]: number };
}

interface DailyLeetCodeData {
  date: string; // YYYY-MM-DD
  totalSolved: number;
  isStreakDay: boolean;
  isFirstEntry?: boolean;
}

const LEETCODE_USERNAME_KEY = 'leetcodeUsername';
const LEETCODE_DAILY_DATA_KEY = 'leetcodeDailyData';
const DSA_SHEET_URL_KEY = 'dsaSheetUrl';
const LEETCODE_CACHE_PREFIX = 'leetcode_cache_';
const LEETCODE_FIRST_ENTRY_KEY = 'leetcodeFirstEntry';
const LEETCODE_BASELINE_SOLVED_KEY = 'leetcodeBaselineSolved';

// Helper function to determine effective date for submissions
const getEffectiveDate = (date: Date): Date => {
  const hour = date.getHours();
  if (hour < 5) {
    // If before 5 AM, count as previous day
    return addDays(date, -1);
  }
  return date;
};

const LeetCodeWidget: React.FC = () => {
  const [leetcodeUsername, setLeetcodeUsername] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(true);
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<DailyLeetCodeData[]>([]);
  const [dsaSheetUrl, setDsaSheetUrl] = useState<string>('');
  const [showDsaSheetInput, setShowDsaSheetInput] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [currentPenguinImage, setCurrentPenguinImage] = useState<string>(neutralPenguin);

  const PENGUIN_IMAGES = {
    happy: happyPenguin,
    neutral: neutralPenguin,
    angry: angryPenguin,
    sad: sadPenguin,
    cry: cryPenguin,
    'more angry': moreAngryPenguin,
    love: lovePenguin,
  };

  const fetchLeetCodeStats = useCallback(async (username: string, isPeriodicCheck: boolean = false) => {
    if (!username.trim()) {
      setError('LeetCode username cannot be empty.');
      setStats(null);
      // Ensure loading is off if we're showing the input form
      setLoading(false); // Unconditionally set to false if showing input form
      setShowInput(true);
      return;
    }

    if (!isPeriodicCheck) {
      setLoading(true);
    }
    setError(null);
    
    const maxRetries = 3; 
    let retries = 0;
    let delay = 2000; 
    const maxDelay = 8000; 

    try {
      while (retries < maxRetries) {
        try {
          console.log(`Attempting to fetch LeetCode stats for user: ${username}, attempt ${retries + 1}/${maxRetries}`);
          const profileRes = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (!profileRes.ok) {
            if (profileRes.status === 404) {
              throw new Error(`User '${username}' not found on LeetCode. Please check the username.`);
            } else if (profileRes.status === 429) {
              const retryAfter = profileRes.headers.get('Retry-After');
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
              
              console.warn(`Rate limit hit (429). Retrying in ${waitTime / 1000} seconds...`);
              retries++;
              const jitter = Math.random() * 500; 
              await new Promise(resolve => setTimeout(resolve, Math.min(waitTime + jitter, maxDelay)));
              delay = Math.min(delay * 2, maxDelay);
              continue;
            } else {
              throw new Error(`Profile fetch error: ${profileRes.statusText} (Status: ${profileRes.status})`);
            }
          }

          const profile = await profileRes.json();
          console.log('Raw LeetCode Profile API Response Data:', profile);

          if (!profile || typeof profile.totalSolved === 'undefined' || profile.errors) {
              if (profile.errors && profile.errors.length > 0) {
                  throw new Error(profile.errors[0].message || 'Could not fetch LeetCode profile stats.');
              } else {
                  throw new Error('Invalid LeetCode profile data received. Username might be incorrect or API response malformed.');
              }
          }

          const totalTotalQuestions = (profile.totalEasy || 0) + (profile.totalMedium || 0) + (profile.totalHard || 0);

          const cacheData = {
            data: profile,
            timestamp: Date.now()
          };
          localStorage.setItem(`${LEETCODE_CACHE_PREFIX}${username}`, JSON.stringify(cacheData));

          setStats({
            totalSolved: profile.totalSolved,
            easySolved: profile.easySolved,
            mediumSolved: profile.mediumSolved,
            hardSolved: profile.hardSolved,
            totalEasy: profile.totalEasy || 0,
            totalMedium: profile.totalMedium || 0,
            totalHard: profile.totalHard || 0,
            totalTotal: totalTotalQuestions, 
            ranking: profile.ranking || 0,
            contributionPoint: profile.contributionPoint || 0,
            reputation: profile.reputation || 0,
            submissionCalendar: profile.submissionCalendar || {}
          });
          console.log('Stats set successfully. Total Solved:', profile.totalSolved);
          setShowInput(false);

          const todayStr = format(new Date(), 'yyyy-MM-dd');
          setDailyData(prevData => {
            const updatedData = prevData.filter(d => d.date !== todayStr); 

            const yesterdayStr = format(addDays(new Date(), -1), 'yyyy-MM-dd');
            const yesterdayData = prevData.find(d => d.date === yesterdayStr);

            let isStreakDay = false;

            // Find existing entry for today
            const existingTodayData = prevData.find(d => d.date === todayStr);
            
            if (existingTodayData) {
              // If we already have data for today, check if totalSolved has increased
              if (profile.totalSolved > existingTodayData.totalSolved) {
                isStreakDay = true;
              } else {
                // Keep existing streak status
                isStreakDay = existingTodayData.isStreakDay;
              }
            } else if (yesterdayData) {
              // For a new day, check if totalSolved has increased from yesterday
              if (profile.totalSolved > yesterdayData.totalSolved) {
                isStreakDay = true;
              }
            } else {
              // First entry - check if there's any increase from baseline
              const baselineSolved = localStorage.getItem(LEETCODE_BASELINE_SOLVED_KEY);
              if (baselineSolved) {
                const baseline = parseInt(baselineSolved);
                if (profile.totalSolved > baseline) {
                  isStreakDay = true;
                }
              } else {
                // Set baseline for first entry
                localStorage.setItem(LEETCODE_BASELINE_SOLVED_KEY, profile.totalSolved.toString());
              }
            }
            
            updatedData.push({
              date: todayStr,
              totalSolved: profile.totalSolved,
              isStreakDay: isStreakDay
            });

            const thirtyDaysAgo = format(addDays(new Date(), -30), 'yyyy-MM-dd');
            return updatedData.filter(d => parseISO(d.date) >= parseISO(thirtyDaysAgo));
          });

          break; 

        } catch (err) {
          console.error(`Fetch attempt ${retries + 1}/${maxRetries} failed:`, err);
          if (retries === maxRetries) {
            const cachedData = localStorage.getItem(`${LEETCODE_CACHE_PREFIX}${username}`);
            if (cachedData) {
              try {
                const { data, timestamp } = JSON.parse(cachedData);
                const cacheAge = Date.now() - timestamp;
                if (cacheAge < 3600000) { 
                  console.log('Using cached LeetCode data due to API error.');
                  setStats({
                    totalSolved: data.totalSolved,
                    easySolved: data.easySolved,
                    mediumSolved: data.mediumSolved,
                    hardSolved: data.hardSolved,
                    totalEasy: data.totalEasy,
                    totalMedium: data.totalMedium,
                    totalHard: data.totalHard,
                    totalTotal: (data.totalEasy || 0) + (data.totalMedium || 0) + (data.totalHard || 0),
                    ranking: data.ranking || 0,
                    contributionPoint: data.contributionPoint || 0,
                    reputation: data.reputation || 0,
                    submissionCalendar: data.submissionCalendar || {}
                  });
                  setError(null);
                  setShowInput(false);
                  return; 
                }
              } catch (e) {
                console.error('Error parsing cached data:', e);
              }
            }

            if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
              setError('Network Error: Could not connect to LeetCode API. Please check your internet connection, ensure no VPN/firewall is blocking the request, or the API server might be temporarily down.');
            } else if (err instanceof Error) {
              setError(`Error: ${err.message}. This might be due to an incorrect LeetCode username or an API issue.`);
            } else {
              setError('An unexpected error occurred while fetching LeetCode stats.');
            }
            setStats(null);
            setShowInput(true);
          } 
        } 
      }
    } finally {
      if (!isPeriodicCheck) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    console.log('useEffect: Component mounted, checking localStorage for username...');
    const savedUsername = localStorage.getItem(LEETCODE_USERNAME_KEY);
    if (savedUsername) {
      setLeetcodeUsername(savedUsername);
      console.log(`useEffect: Found saved username: ${savedUsername}. Attempting initial fetch.`);
      fetchLeetCodeStats(savedUsername, false); // Initial fetch, show loading
    } else {
      setShowInput(true);
      console.log('useEffect: No saved username found. Showing input form.');
    }

    const savedDailyData = localStorage.getItem(LEETCODE_DAILY_DATA_KEY);
    if (savedDailyData) {
      try {
        setDailyData(JSON.parse(savedDailyData));
        console.log('useEffect: Loaded daily data from localStorage.');
      } catch (e) {
        console.error('Error parsing daily LeetCode data from localStorage', e);
      }
    }

    const savedDsaSheetUrl = localStorage.getItem(DSA_SHEET_URL_KEY);
    if (savedDsaSheetUrl) {
      setDsaSheetUrl(savedDsaSheetUrl);
      console.log('useEffect: Loaded DSA Sheet URL from localStorage.');
    }
  }, [fetchLeetCodeStats]);

  useEffect(() => {
    localStorage.setItem(LEETCODE_DAILY_DATA_KEY, JSON.stringify(dailyData));
  }, [dailyData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (leetcodeUsername && !showInput) {
      // Re-evaluate isFirstEntry on each interval tick to dynamically adjust polling frequency
      const currentIsFirstEntry = localStorage.getItem(LEETCODE_FIRST_ENTRY_KEY) === 'true';
      const intervalTime = currentIsFirstEntry ? 15 * 1000 : 60 * 1000;
      
      interval = setInterval(() => {
        console.log('Periodic fetch initiated.');
        fetchLeetCodeStats(leetcodeUsername, true); // Always pass true for periodic checks
      }, intervalTime);
    }
    return () => clearInterval(interval);
  }, [leetcodeUsername, showInput, fetchLeetCodeStats]);

  useEffect(() => {
    const updatePenguinMood = () => {
      const currentHour = new Date().getHours();
      const today = new Date();
      const effectiveToday = getEffectiveDate(today);
      const todayStr = format(effectiveToday, 'yyyy-MM-dd');
      const todayData = dailyData.find(d => d.date === todayStr);

      let moodImage: string;

      if (todayData?.isStreakDay && stats) {
        const todaySolvedCountFromAPI = stats.submissionCalendar[todayStr] || 0;

        if (todaySolvedCountFromAPI > 1) {
          moodImage = PENGUIN_IMAGES.love;
        } else {
          moodImage = PENGUIN_IMAGES.happy;
        }
      } else {
        // Time-based Mood Timeline Logic (without streak)
        if (currentHour >= 5 && currentHour < 8) { // Neutral from 5 AM to 8 AM
          moodImage = PENGUIN_IMAGES.neutral;
        } else if (currentHour >= 8 && currentHour < 12) {
          moodImage = PENGUIN_IMAGES.sad;
        } else if (currentHour >= 12 && currentHour < 16) {
          moodImage = PENGUIN_IMAGES.cry;
        } else if (currentHour >= 16 && currentHour < 20) {
          moodImage = PENGUIN_IMAGES.angry;
        } else { // This else will cover 20:00 - 23:59 and 00:00 - 04:59 (next day)
          moodImage = PENGUIN_IMAGES['more angry'];
        }
      }
      setCurrentPenguinImage(moodImage);
    };

    updatePenguinMood();

    const intervalId = setInterval(updatePenguinMood, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [dailyData, stats, PENGUIN_IMAGES]);

  const handleSaveUsername = () => {
    console.log(`handleSaveUsername: Attempting to save username: ${leetcodeUsername.trim()}`);
    if (leetcodeUsername.trim()) {
      const previousUsername = localStorage.getItem(LEETCODE_USERNAME_KEY);
      const newUsername = leetcodeUsername.trim();
      
      // Check if the username is changing
      if (previousUsername !== newUsername) {
        console.log('Username changed, resetting baseline data');
        // Reset baseline and first entry flag when changing users
        localStorage.removeItem(LEETCODE_BASELINE_SOLVED_KEY);
        localStorage.removeItem(LEETCODE_FIRST_ENTRY_KEY);
        // Clear daily data when switching users to avoid streak contamination
        setDailyData([]);
      }
      
      localStorage.setItem(LEETCODE_USERNAME_KEY, newUsername);
      
      // Check if this is a first-time entry
      const isFirstEntry = !localStorage.getItem(LEETCODE_FIRST_ENTRY_KEY);
      if (isFirstEntry) {
        localStorage.setItem(LEETCODE_FIRST_ENTRY_KEY, 'true');
        // We'll set the baseline after the first successful fetch
      }
      
      fetchLeetCodeStats(newUsername, false); // Initial fetch on save, show loading
      console.log('handleSaveUsername: Username saved and fetch initiated.');
    } else {
      setError('Username cannot be empty.');
      setShowInput(true);
      console.log('handleSaveUsername: Username is empty.');
    }
  };

  const calculateStreak = useCallback(() => {
    let currentStreak = 0;
    const today = new Date();
    const effectiveToday = getEffectiveDate(today);
    
    const sortedDailyData = [...dailyData].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    const relevantData = sortedDailyData.filter(d => {
      const date = parseISO(d.date);
      return date <= effectiveToday;
    });

    if (relevantData.length === 0) return 0;

    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (let i = 0; i < relevantData.length; i++) {
      const currentDay = parseISO(relevantData[i].date);

      if (relevantData[i].isStreakDay) {
        if (lastDate === null || isSameDay(currentDay, addDays(lastDate, 1))) {
          tempStreak++;
        } else if (!isSameDay(currentDay, lastDate)) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 0;
      }
      lastDate = currentDay;
      currentStreak = Math.max(currentStreak, tempStreak);
    }

    const latestActiveDay = relevantData.filter(d => d.isStreakDay).pop();

    if (latestActiveDay) {
        const latestActiveDate = parseISO(latestActiveDay.date);
        const effectiveLatestDate = getEffectiveDate(latestActiveDate);
        if (!isSameDay(effectiveLatestDate, effectiveToday) && !isSameDay(effectiveLatestDate, addDays(effectiveToday, -1))) {
            return 0;
        }
    }
    
    let activeStreak = 0;
    let tempActiveStreak = 0;
    let currentLastDate: Date | null = null;

    for (let i = relevantData.length - 1; i >= 0; i--) {
        const currentDay = parseISO(relevantData[i].date);
        
        if (relevantData[i].isStreakDay) {
            if (currentLastDate === null || isSameDay(currentLastDate, addDays(currentDay, 1))) {
                tempActiveStreak++;
            } else {
                break;
            }
        } else {
            if (!isSameDay(currentDay, effectiveToday)) {
                break; 
            }
        }
        currentLastDate = currentDay;
    }
    activeStreak = tempActiveStreak;

    return activeStreak;
  }, [dailyData]);

  const currentStreak = calculateStreak();

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });

  const getDayStatus = useCallback((dayIndex: number) => {
    const day = addDays(startOfCurrentWeek, dayIndex);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dataForDay = dailyData.find(d => d.date === dayStr);
    
    if (dataForDay?.isStreakDay) {
      return 'completed';
    } 
    
    return 'not-completed';
  }, [dailyData, startOfCurrentWeek]);

  const handleDailyProblemClick = async () => {
    try {
      const response = await fetch('https://alfa-leetcode-api.onrender.com/daily');
      const data = await response.json();
      if (data && data.questionLink) {
        window.open(data.questionLink, '_blank');
      } else {
        alert('Could not fetch daily problem link.');
      }
    } catch (err) {
      console.error('Error fetching daily problem:', err);
      alert('Failed to fetch daily problem. Please try again later.');
    }
  };

  const handleDsaSheetUrlSave = () => {
    if (dsaSheetUrl.trim()) {
      localStorage.setItem(DSA_SHEET_URL_KEY, dsaSheetUrl.trim());
      setShowDsaSheetInput(false);
    }
  };

  if (showInput) {
    return (
      <div className="bg-zinc-800 p-6  rounded-2xl shadow-xl flex flex-col items-center justify-center h-full">
        <h3 className="text-xl font-semibold mb-6  text-white">Enter LeetCode Username</h3>
        <input
          type="text"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          placeholder="Your LeetCode username"
          className=" border  p-2 border-gray-600 rounded-xl w-full max-w-xs mb-6 bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#ff3d71]"
        />
        <button
          onClick={handleSaveUsername}
          className="bg-[#c30052] hover:bg-[#d40058] text-white px-6 py-3 rounded-full font-medium transition-colors"
        >
          Save
        </button>
        {error && <p className="text-[#ff3d71] text-sm mt-4">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-xl flex flex-col h-full text-center items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 mb-4 rounded-full bg-gradient-to-b from-[#333] to-[#222]"></div>
          <p className="text-lg text-white/70">Loading LeetCode stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-xl flex flex-col h-full text-center items-center justify-center text-[#ff3d71]">
        <p className="text-lg mb-4">Error: {error}</p>
        <button
          onClick={() => {
            // Reset baseline when trying again with potentially new username
            localStorage.removeItem(LEETCODE_BASELINE_SOLVED_KEY);
            localStorage.removeItem(LEETCODE_FIRST_ENTRY_KEY);
            setShowInput(true);
          }}
          className="bg-[#c30052] hover:bg-[#d40058] text-white px-6 py-3 rounded-full font-medium transition-colors mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (stats) {
    return (
      <div className="bg-zinc-800 p-2 rounded-3xl shadow-xl flex flex-col text-white font-sans relative">
        
        
        <div className="flex flex-col md:flex-row gap-1 mb-2">
          {/* Left side - Streak Card */}
          <div className="w-[35%] h-[140px] flex-shrink-0">
            <StreakCard 
              streakCount={currentStreak} 
              penguinImg={currentPenguinImage}
              username={leetcodeUsername}
            />
          </div>

          {/* Right side - Week tracker + Stats */}
          <div className="flex-1 w-full flex flex-col gap-1">
            {/* Week Tracker */}
            <div className=" flex ">
              <LeetCodeStreakBar
                streakDays={daysOfWeek.map((_, idx) => getDayStatus(idx) === 'completed')}
              />
            </div>
            
            {/* Stats Section */}
            <div className="bg-[#1e1e1e] rounded-xl p-2 flex-1 flex flex-col justify-between">
              <div className="flex flex-row    justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 ">
                      <div className="w-3 h-3 rounded-full mr-2 bg-[#00d68f]"></div>
                    </div>
                    <span className="text-white/80 text-sm">{stats.easySolved}
                    <span className='opacity-60'>/{stats.totalEasy}</span></span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center gap-2 ">
                      <div className="w-3 h-3 rounded-full mr-2 bg-[#ffcc00]"></div>
                    </div>
                    <span className="text-white/80 text-sm">{stats.mediumSolved}<span className='opacity-60'>/{stats.totalMedium}</span></span>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center gap-2 ">
                      <div className="w-3 h-3 rounded-full mr-2 bg-[#ff3d71]"></div>
                    </div>
                    <span className="text-white/80 text-sm">{stats.hardSolved}<span className='opacity-60'>/{stats.totalHard}</span></span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold">{stats.totalSolved}
                    <span className="text-white/60 font-normal text-xl">/{stats.totalTotal}</span>
                  </span>
                  <span className="text-white/80 text-xs mt-1"># {stats.ranking}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 mt-2">
          <button
            onClick={() => window.open('https://leetcode.com/contest/', '_blank')}
            className="flex-1 bg-[#3A3A3D] hover:bg-[#4A4A4D] text-white px-4 py-3 rounded-full font-medium transition-colors text-center flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/>
              <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/>
              <path d="M18 9h1.5a1 1 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/>
              <path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>
            </svg>
            
          </button>
          <button
            onClick={handleDailyProblemClick}
            className="flex-1 bg-[#c30052] hover:bg-[#d40058] text-white px-4 py-3 rounded-full font-medium transition-colors text-center flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock-icon">
              <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/>
              <path d="M16 2v4"/>
              <path d="M8 2v4"/>
              <path d="M3 10h5"/>
              <path d="M17.5 17.5 16 16.3V14"/>
              <circle cx="16" cy="16" r="6"/>
            </svg>
            
          </button>
          {dsaSheetUrl ? (
            <button
              onClick={() => window.open(dsaSheetUrl, '_blank')}
              className="flex-1 bg-[#00bfff] hover:bg-[#33ccff] text-white px-4 py-3 rounded-full font-medium transition-colors text-center flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
              Sheet
            </button>
          ) : (
            <button
              onClick={() => setShowDsaSheetInput(true)}
              className="flex-1 bg-[#00bfff] hover:bg-[#33ccff] text-white px-4 py-3 rounded-full font-medium transition-colors text-center flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
              
            </button>
          )}

          {/* Settings Button  */}
        <button 
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          className=" bg-zinc-700 flex-1 flex items-center justify-center text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {/* Settings Dropdown Menu */}
        {showSettingsMenu && (
          <div className=" absolute top-10 right-2 z-20 bg-zinc-900 rounded-lg shadow-lg border border-zinc-700 p-2 w-48 transition-all">
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => { 
                  setShowSettingsMenu(false);
                  // Reset baseline to avoid streak calculation issues with new username
                  localStorage.removeItem(LEETCODE_BASELINE_SOLVED_KEY);
                  localStorage.removeItem(LEETCODE_FIRST_ENTRY_KEY);
                  setShowInput(true); 
                }}
                className="flex items-center gap-2 text-sm text-left text-white/80 hover:text-white hover:bg-zinc-800 p-2 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-3a2 2 0 0 1-2-2V2"/>
                  <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/>
                  <path d="M3 15h6"/>
                  <path d="M6 18l3-3-3-3"/>
                </svg>
                Change Username
              </button>
              <button 
                onClick={() => {
                  setShowSettingsMenu(false);
                  setShowDsaSheetInput(true);
                }}
                className="flex items-center gap-2 text-sm text-left text-white/80 hover:text-white hover:bg-zinc-800 p-2 rounded transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M12 18v-6"/>
                  <path d="M9 15h6"/>
                </svg>
                Change DSA Sheet URL
              </button>
            </div>
          </div>
        )}

        </div>

        {showDsaSheetInput && (
          <div className="fixed inset-0 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#1e1e1e] rounded-2xl flex flex-col items-center justify-center p-6 w-full max-w-md relative">
              <h3 className="text-xl font-semibold mb-6 text-white">Enter DSA Sheet URL</h3>
              <input
                type="text"
                value={dsaSheetUrl}
                onChange={(e) => setDsaSheetUrl(e.target.value)}
                placeholder="Your DSA Sheet URL"
                className="p-3 border border-gray-600 rounded-xl w-full mb-6 bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#00bfff]"
              />
              <div className="flex space-x-4">
                <button
                  onClick={handleDsaSheetUrlSave}
                  className="bg-[#00bfff] hover:bg-[#33ccff] text-white px-6 py-3 rounded-full font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowDsaSheetInput(false)}
                  className="bg-[#3A3A3D] hover:bg-[#4A4A4D] text-white px-6 py-3 rounded-full font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#222126] p-4 rounded-xl shadow-xl flex flex-col items-center justify-center h-full">
      <div className="text-center text-gray-600 dark:text-gray-400">
          <p>No LeetCode stats to display. Please ensure your username is correct or enter one above.</p>
          <button
            onClick={() => {
              // Reset baseline data when entering new username from fallback state
              localStorage.removeItem(LEETCODE_BASELINE_SOLVED_KEY);
              localStorage.removeItem(LEETCODE_FIRST_ENTRY_KEY);
              setShowInput(true);
            }}
            className="bg-[#ff4101] text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors mt-4"
          >
            Enter Username
          </button>
      </div>
    </div>
  );
};

export default LeetCodeWidget;