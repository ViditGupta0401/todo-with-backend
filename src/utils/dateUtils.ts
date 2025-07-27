// Time constants
export const DEFAULT_DAY_RESET_HOUR = 5; // 5 AM

export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const getLocalDate = (date: Date = new Date()): Date => {
  const now = date;
  const userTimezone = getUserTimezone();
  
  // Convert to user's timezone
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  
  // Apply day reset logic (if before reset hour, consider it previous day)
  if (localDate.getHours() < DEFAULT_DAY_RESET_HOUR) {
    localDate.setDate(localDate.getDate() - 1);
  }
  
  return localDate;
};

export const isSameLocalDay = (date1: Date, date2: Date): boolean => {
  const local1 = getLocalDate(date1);
  const local2 = getLocalDate(date2);
  
  return (
    local1.getFullYear() === local2.getFullYear() &&
    local1.getMonth() === local2.getMonth() &&
    local1.getDate() === local2.getDate()
  );
};
