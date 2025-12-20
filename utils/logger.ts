
const LOG_KEY = 'medref_debug_logs';
const MAX_LOG_SIZE = 4 * 1024 * 1024; // 4MB Limit to prevent storage quota errors

export const getLogs = (): string => {
  return localStorage.getItem(LOG_KEY) || '# App Interaction Logs\n\n> Auto-generated session logs.\n\n';
};

export const clearLogs = () => {
  localStorage.setItem(LOG_KEY, '# App Interaction Logs\n\n> Logs cleared.\n\n');
};

export const appendLog = (entry: string) => {
  let current = getLogs();
  const timestamp = new Date().toLocaleString();
  const newEntry = `\n## Log Entry [${timestamp}]\n${entry}\n---\n`;
  
  // Safety check for size
  if (current.length + newEntry.length > MAX_LOG_SIZE) {
    // Truncate oldest half if full
    const truncateMarker = '\n\n...[Old logs truncated due to size limit]...\n\n';
    current = '# App Interaction Logs' + truncateMarker + current.slice(current.length / 2);
  }
  
  localStorage.setItem(LOG_KEY, current + newEntry);
};
