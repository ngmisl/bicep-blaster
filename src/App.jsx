import { useState, useEffect, useRef, useCallback } from "react";
import sdk from '@farcaster/frame-sdk';

function App() {
  // State
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(60); // Default to 60 seconds
  const [isRunning, setIsRunning] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  // Always enable vibration
  const vibrationEnabled = true;
  // Wake Lock state
  const [wakeLock, setWakeLock] = useState(null);
  // Farcaster Frame context
  const [isFrameSDKLoaded, setIsFrameSDKLoaded] = useState(false);
  const [frameContext, setFrameContext] = useState(null);

  // Play sound - only when called directly - wrapped in useCallback
  const playSound = useCallback(() => {
    if (!workoutInProgress || !soundEnabled) return; // Safety check
    
    try {
      // Create a new Audio object directly (simpler approach)
      const sound = new Audio('/sound.mp3');
      sound.volume = 1.0;
      
      // Play with promise handling
      const playPromise = sound.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Sound played successfully');
          })
          .catch(e => {
            console.log('Sound playback failed, using vibration instead:', e);
            // Always vibrate as a fallback or additional feedback
            if (vibrationEnabled && 'vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          });
      }
    } catch (e) {
      console.log('Error in playSound, using vibration instead:', e);
      // Fallback to vibration
      if (vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [workoutInProgress, soundEnabled]);

  // Vibrate device - only when called directly - wrapped in useCallback
  const vibrate = useCallback((pattern) => {
    if (!workoutInProgress || !vibrationEnabled) return; // Safety check
    
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.log('Vibration failed:', e);
      }
    }
  }, [workoutInProgress]);
  
  // Move to next exercise - called only from one place - wrapped in useCallback
  const moveToNextExercise = useCallback(() => {
    const nextIndex = currentExerciseIndex + 1;
    
    // Play sound and vibrate for all transitions (not just after the first)
    playSound();
    vibrate([300, 100, 300]);
    
    if (nextIndex < exercises.length) {
      // Go to next exercise
      setCurrentExerciseIndex(nextIndex);
      setSecondsRemaining(exercises[nextIndex]?.duration || 60);
    } else {
      // Workout complete - make sure we properly set the state
      console.log('Workout complete! Setting final state...');
      vibrate([500, 200, 500, 200, 500]);
      setIsRunning(false);
      setWorkoutInProgress(false);
      setCurrentExerciseIndex(exercises.length); // Ensure we're past the last exercise
    }
  }, [currentExerciseIndex, exercises, playSound, vibrate]);

  // Timer effect - simplified to ensure it starts immediately
  useEffect(() => {
    // Only run if workout is in progress
    if (!isRunning) return;
    
    console.log(`Timer running for exercise ${currentExerciseIndex + 1}: ${exercises[currentExerciseIndex]?.name || 'Unknown'}, seconds: ${secondsRemaining}`);
    
    // Create a timer that runs every second
    const timerId = setInterval(() => {
      setSecondsRemaining(prev => {
        // When time's up, move to next exercise
        if (prev <= 1) {
          clearInterval(timerId);
          console.log(`Exercise ${currentExerciseIndex + 1} complete`);
          moveToNextExercise();
          return 0;
        }
        
        // Vibrate during final countdown
        if (prev <= 3) {
          vibrate(200);
        }
        
        // Continue countdown
        return prev - 1;
      });
    }, 1000);
    
    // Clean up when component unmounts or dependencies change
    return () => {
      console.log('Clearing timer');
      clearInterval(timerId);
    };
  }, [isRunning, currentExerciseIndex, exercises, moveToNextExercise, vibrate, secondsRemaining]);

  // Load exercises from JSON file
  useEffect(() => {
    fetch('/exercises.json')
      .then(response => response.json())
      .then(data => {
        setExercises(data);
        setIsLoading(false);
        // Set initial seconds for the first exercise
        if (data.length > 0) {
          setSecondsRemaining(data[0]?.duration || 60);
        }
        console.log('Exercises loaded successfully:', data);
      })
      .catch(error => {
        console.error('Error loading exercises:', error);
        setIsLoading(false);
      });
  }, []);

  // Format time (seconds) to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSeconds = exercises[currentExerciseIndex]?.duration || 1;
    return ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  };

  // Request wake lock to keep screen on during workout - wrapped in useCallback
  const requestWakeLock = useCallback(async () => {
    // Only proceed if Wake Lock API is supported and we don't already have a wake lock
    if ('wakeLock' in navigator && !wakeLock) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Wake Lock activated');
        
        // Add release listener
        lock.addEventListener('release', () => {
          console.log('Wake Lock released');
          setWakeLock(null);
        });
      } catch (err) {
        // This is expected in some environments like iframes or when permissions are denied
        console.log('Wake Lock error (this is normal in some environments):', err.name, err.message);
      }
    } else if (!('wakeLock' in navigator)) {
      console.log('Wake Lock API not supported in this browser');
    }
  }, [wakeLock]);

  // Release wake lock - wrapped in useCallback
  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log('Wake Lock released');
      } catch (err) {
        console.error('Error releasing Wake Lock:', err);
      }
    }
  }, [wakeLock]);

  // Effect for wake lock management
  useEffect(() => {
    // Only try to acquire wake lock if workout is in progress
    if (workoutInProgress && 'wakeLock' in navigator) {
      requestWakeLock();
    }
    
    // Cleanup function
    return () => {
      if (wakeLock) {
        releaseWakeLock();
      }
    };
  }, [workoutInProgress, wakeLock, requestWakeLock, releaseWakeLock]);

  // Load Farcaster Frame SDK
  useEffect(() => {
    const loadFrameSDK = async () => {
      try {
        setFrameContext(await sdk.context);
        sdk.actions.ready();
        setIsFrameSDKLoaded(true);
        console.log('Frame SDK loaded:', frameContext);
      } catch (err) {
        console.error('Error loading Frame SDK:', err);
      }
    };
    
    if (!isFrameSDKLoaded && 'context' in sdk) {
      loadFrameSDK();
    }
  }, [isFrameSDKLoaded, frameContext]);

  // Cleanup function for timers and resources
  useEffect(() => {
    // Cleanup function that runs on component unmount
    return () => {
      // Clear any running timers
      if (window.workoutTimer) {
        clearTimeout(window.workoutTimer);
      }
      
      // Release wake lock if active
      if (wakeLock) {
        try {
          wakeLock.release();
        } catch (err) {
          console.log('Error releasing Wake Lock during cleanup:', err);
        }
      }
    };
  }, [wakeLock]);

  // Start workout - completely separated from audio logic
  const startWorkout = () => {
    // Only start if we're not already in a workout
    if (workoutInProgress) {
      console.log('Workout already in progress');
      return;
    }
    
    console.log('Starting workout...');
    
    // Make sure we have a valid duration for the first exercise
    if (exercises.length > 0) {
      const firstExerciseDuration = exercises[0]?.duration || 60;
      console.log(`Setting initial duration to ${firstExerciseDuration} seconds`);
      setSecondsRemaining(firstExerciseDuration);
    }
    
    // Start the workout immediately - order matters here!
    setWorkoutInProgress(true);
    setIsRunning(true);
    
    // Request wake lock to keep screen on
    requestWakeLock();
  };

  // Pause workout
  const pauseWorkout = () => {
    console.log('Pausing workout');
    setIsRunning(false);
  };

  // Reset workout
  const resetWorkout = () => {
    console.log('Resetting workout');
    
    // Clear any running timers first
    if (window.workoutTimer) {
      clearTimeout(window.workoutTimer);
    }
    
    // Reset all state in the correct order
    setIsRunning(false);
    setWorkoutInProgress(false);
    setCurrentExerciseIndex(0);
    
    // Make sure we have a valid duration for the first exercise
    if (exercises.length > 0) {
      setSecondsRemaining(exercises[0]?.duration || 60);
    } else {
      setSecondsRemaining(60); // Default fallback
    }
    
    console.log('Workout reset complete');
  };

  // Skip to next exercise
  const skipToNext = () => {
    if (currentExerciseIndex >= exercises.length - 1) return;
    
    console.log(`Skipping to exercise ${currentExerciseIndex + 2}`);
    moveToNextExercise();
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Handle exercise item click
  const handleExerciseItemClick = (index) => {
    if (workoutInProgress && index !== currentExerciseIndex) {
      // If workout is in progress, clicking on an exercise will skip to it
      setCurrentExerciseIndex(index);
      setSecondsRemaining(exercises[index]?.duration || 60);
    }
  };

  // Get next exercise name
  const getNextExerciseName = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      return exercises[currentExerciseIndex + 1].name;
    }
    return null;
  };

  const currentExercise = currentExerciseIndex < exercises.length ? exercises[currentExerciseIndex] : null;
  const nextExercise = currentExerciseIndex < exercises.length - 1 ? exercises[currentExerciseIndex + 1] : null;
  const isWorkoutComplete = currentExerciseIndex >= exercises.length;
  
  console.log('Workout state:', { 
    currentExerciseIndex, 
    exercisesLength: exercises.length,
    isWorkoutComplete
  });

  // Show loading state if exercises are still loading
  if (isLoading) {
    return (
      <div data-theme="ghibli" className="min-h-screen w-full flex items-center justify-center px-4 py-6">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4">Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-theme="ghibli" className="min-h-screen w-full flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md ghibli-card overflow-hidden">
        <header className="ghibli-header p-4 text-center">
          <h1 className="text-3xl font-bold ghibli-text-shadow">Bicep Blaster</h1>
          <p className="text-sm opacity-80">Complete all exercises in one flow</p>
          {frameContext?.fid && (
            <div className="mt-2 text-xs text-primary">
              Connected via Farcaster • FID: {frameContext.fid}
            </div>
          )}
        </header>

        {/* Main workout display */}
        <div className="p-4">
          {/* Current Exercise Display */}
          <div className="card ghibli-card mb-6 relative overflow-hidden">
            <progress 
              className="progress progress-primary absolute top-0 w-full h-2" 
              value={isWorkoutComplete ? 100 : calculateProgress()} 
              max="100"
            />
            <div className="card-body p-4">
              <h2 className="card-title exercise-name-large justify-center">
                {isWorkoutComplete 
                  ? "Workout Complete" 
                  : currentExercise?.name}
              </h2>
              <div className="workout-timer-display">
                {isWorkoutComplete 
                  ? "DONE!" 
                  : formatTime(secondsRemaining)}
              </div>
              <p className="mt-4 text-sm md:text-base text-center">
                {isWorkoutComplete 
                  ? "Great job! You've completed all exercises." 
                  : currentExercise?.instruction}
              </p>
              {nextExercise && (
                <div className="mt-3 text-sm opacity-70 text-center">
                  Next: {nextExercise.name}
                </div>
              )}
              <div className="card-actions justify-center gap-3 mt-4">
                {isWorkoutComplete ? (
                  <>
                    <button type="button" className="btn btn-primary ghibli-btn" onClick={resetWorkout}>
                      Start Again
                    </button>
                    {frameContext?.fid && (
                      <button
                        type="button"
                        className="btn btn-outline ghibli-btn"
                        onClick={() => {
                          try {
                            // Post to Farcaster about completed workout
                            sdk.actions.execute({
                              type: 'share',
                              title: 'Workout Complete!',
                              text: `Just completed the Bicep Blaster workout with ${exercises.length} exercises! 💪`,
                              url: window.location.href
                            });
                          } catch (err) {
                            console.error('Error sharing to Farcaster:', err);
                          }
                        }}
                      >
                        Share 🔄
                      </button>
                    )}
                  </>
                ) : !isRunning ? (
                  <>
                    <button type="button" className="btn btn-primary ghibli-btn" onClick={startWorkout}>
                      {!workoutInProgress ? "Start" : "Resume"}
                    </button>
                    <button type="button" className="btn btn-outline ghibli-btn" onClick={resetWorkout}>
                      Reset
                    </button>
                    {workoutInProgress && (
                      <button 
                        type="button"
                        className="btn btn-outline ghibli-btn" 
                        onClick={skipToNext} 
                        disabled={currentExerciseIndex >= exercises.length - 1}
                      >
                        Skip
                      </button>
                    )}
                    <button 
                      type="button"
                      className="btn btn-circle btn-sm ghibli-btn" 
                      onClick={toggleSound}
                    >
                      {soundEnabled ? "🔊" : "🔇"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline ghibli-btn" onClick={pauseWorkout}>
                      Pause
                    </button>
                    <button type="button" className="btn btn-outline ghibli-btn" onClick={resetWorkout}>
                      Reset
                    </button>
                    <button 
                      type="button"
                      className="btn btn-circle btn-sm ghibli-btn" 
                      onClick={toggleSound}
                    >
                      {soundEnabled ? "🔊" : "🔇"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-2 ghibli-text-shadow">Exercise List</h2>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <button 
                  type="button"
                  key={exercise.id}
                  className={`card ghibli-card cursor-pointer hover:shadow-ghibli-lg transition-all w-full text-left ${
                    index === currentExerciseIndex 
                      ? "border-primary border-2" 
                      : index < currentExerciseIndex 
                        ? "opacity-60" 
                        : ""
                  }`}
                  onClick={() => handleExerciseItemClick(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleExerciseItemClick(index);
                    }
                  }}
                >
                  <div className="card-body p-3">
                    <h3 className="font-bold text-sm md:text-base">
                      {exercise.name}
                    </h3>
                    <p className="text-xs break-words whitespace-normal overflow-hidden line-clamp-2">
                      {exercise.instruction}
                    </p>
                    <div className="text-xs mt-1">
                      {formatTime(exercise.duration)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Support Link - More Visible */}
          <div className="mt-4 text-center flex justify-center gap-3">
            <a 
              href="https://fourzerofour.fkey.id/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary ghibli-btn ghibli-float"
            >
              Support this project ❤️
            </a>
            <a 
              href="https://simplex.chat/contact/#/?v=2-7&smp=smp%3A%2F%2FZKe4uxF4Z_aLJJOEsC-Y6hSkXgQS5-oc442JQGkyP8M%3D%40smp17.simplex.im%2F1CEQbUx7PLENFjgLngWHKRb-hTNQIOKR%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAO805q6Syl84pJXUTqmNiPfLPU_Dk_hqyosW56vMy7BU%253D%26srv%3Dogtwfxyi3h2h5weftjjpjmxclhb5ugufa5rcyrmg7j4xlch7qsr5nuqd.onion" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary ghibli-btn"
            >
              Contact Us 📱
            </a>
          </div>
          
          {/* Farcaster attribution if in Frame */}
          {frameContext?.fid && (
            <div className="mt-4 text-center text-xs opacity-70">
              <p>Viewed via Farcaster Frame</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
