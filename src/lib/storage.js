/**
 * Storage utilities for Bicep Blaster app
 * Handles saving and retrieving workout session data
 */

const STORAGE_KEY = 'bicep-blaster-workout-history';

/**
 * Save workout session to localStorage
 * @param {Object} sessionData - The workout session data
 * @param {number} sessionData.weight - Weight used for the workout (kg)
 * @param {Array} sessionData.exercises - Array of exercise names completed
 * @param {number} sessionData.duration - Total duration of the workout in seconds
 * @param {number} sessionData.repetitions - Number of repetitions completed
 * @returns {Object} The saved session object with id and date
 */
export function saveWorkoutSession({ weight, exercises, duration, repetitions = 1 }) {
  try {
    // Create session object with metadata
    const session = {
      id: Date.now(),
      date: new Date().toISOString(),
      weight,
      exercises,
      duration,
      repetitions
    };

    // Get existing history
    const history = getWorkoutHistory();
    
    // Add new session to history
    history.push(session);
    
    // Save updated history back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return session;
  } catch (error) {
    console.error('Error saving workout session:', error);
    return null;
  }
}

/**
 * Get workout history from localStorage
 * @returns {Array} Array of workout session objects
 */
export function getWorkoutHistory() {
  try {
    const historyString = localStorage.getItem(STORAGE_KEY);
    return historyString ? JSON.parse(historyString) : [];
  } catch (error) {
    console.error('Error retrieving workout history:', error);
    return [];
  }
}

/**
 * Get workout stats from history
 * @returns {Object} Object containing workout statistics
 */
export function getWorkoutStats() {
  const history = getWorkoutHistory();
  
  if (history.length === 0) {
    return {
      totalSessions: 0,
      avgWeight: 0,
      totalDuration: 0,
      totalRepetitions: 0,
    };
  }
  
  const totalSessions = history.length;
  const totalWeight = history.reduce((sum, session) => sum + session.weight, 0);
  const totalDuration = history.reduce((sum, session) => sum + session.duration, 0);
  const totalRepetitions = history.reduce((sum, session) => sum + (session.repetitions || 1), 0);
  
  const avgWeight = Math.round((totalWeight / totalSessions) * 10) / 10;
  
  return {
    totalSessions,
    avgWeight,
    totalDuration,
    totalRepetitions,
    // Last 7 sessions for progress tracking
    recentSessions: history.slice(-7)
  };
}

/**
 * Clear all workout history
 */
export function clearWorkoutHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
