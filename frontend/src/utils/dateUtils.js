import { 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  format,
  parseISO
} from 'date-fns';

/**
 * Formats a timestamp with smart, context-aware formatting
 * @param {string} timestamp - ISO formatted date string
 * @returns {string} Formatted date string
 */
export const formatChatTimestamp = (timestamp) => {
  // Ensure the timestamp is parsed correctly
  const date = parseISO(timestamp);
  
  // If the message is from today, show relative time
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  // If the message is from yesterday, show "Yesterday at [time]"
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'p')}`;
  }
  
  // For older messages, show date and time
  return format(date, 'MMM d, yyyy, p');
};

/**
 * Checks if two dates are close enough to be considered part of the same group
 * @param {string} timestamp1 - First timestamp
 * @param {string} timestamp2 - Second timestamp
 * @param {number} minutes - Number of minutes to consider as close
 * @returns {boolean} Whether the timestamps are close
 */
export const areTimestampsClose = (timestamp1, timestamp2, minutes = 5) => {
  const date1 = parseISO(timestamp1);
  const date2 = parseISO(timestamp2);
  
  const timeDifference = Math.abs(date1.getTime() - date2.getTime());
  const minutesDifference = timeDifference / (1000 * 60);
  
  return minutesDifference <= minutes;
};
