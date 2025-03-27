import { useState, useEffect, useRef } from "react";
import sdk from '@farcaster/frame-sdk';

function App() {
  // Sound reference for preloading
  const soundRef = useRef(null);
  
  // State
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  // Always enable vibration
  const vibrationEnabled = true;
  // Wake Lock state
  const [wakeLock, setWakeLock] = useState(null);
  // Farcaster Frame context
  const [isFrameSDKLoaded, setIsFrameSDKLoaded] = useState(false);
  const [frameContext, setFrameContext] = useState(null);

  // Initialize and preload sound
  useEffect(() => {
    // Preload the sound file
    soundRef.current = new Audio('/sound.mp3');
    
    // Function to unlock audio on user interaction
    const unlockAudio = () => {
      // Play and immediately pause to unlock audio
      soundRef.current.volume = 0;
      soundRef.current.play()
        .then(() => {
          soundRef.current.pause();
          soundRef.current.currentTime = 0;
          soundRef.current.volume = 1;
          console.log('Audio unlocked successfully');
        })
        .catch(e => {
          console.log('Error unlocking audio:', e);
        });
      
      // Remove event listeners once audio is unlocked
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    
    // Add event listeners to unlock audio on first user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    // Clean up
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      if (soundRef.current) {
        soundRef.current = null;
      }
    };
  }, []);

  // Load exercises from JSON file
  useEffect(() => {
    async function loadExercises() {
      try {
        // Add timestamp as cache-busting parameter
        const timestamp = new Date().getTime();
        const response = await fetch(`/exercises.json?t=${timestamp}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch exercises: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setExercises(data);
        setSecondsRemaining(data[0]?.duration || 60);
        setIsLoading(false);
        console.log('Exercises loaded successfully:', data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        // Fallback to default exercises if loading fails
        setExercises([
          {
            name: "Wide DB Curl",
            duration: 60,
            id: "ex-1",
            instruction: "Hold dumbbells with palms up and arms wider than shoulder-width, then curl up while keeping elbows fixed."
          }
        ]);
        setSecondsRemaining(60);
        setIsLoading(false);
      }
    }
    
    loadExercises();
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

  // Play sound - only when called directly
  const playSound = () => {
    if (!workoutInProgress || !soundEnabled) return; // Safety check
    
    try {
      // Try using the preloaded sound first
      if (soundRef.current) {
        soundRef.current.currentTime = 0;
        soundRef.current.play()
          .then(() => {
            console.log('Sound played successfully');
          })
          .catch(e => {
            console.log('Error playing preloaded sound:', e);
            // Fallback to creating a new Audio object
            const sound = new Audio('/sound.mp3');
            sound.play().catch(err => console.log('Error playing fallback sound:', err));
          });
      } else {
        // Fallback if reference is not available
        const sound = new Audio('/sound.mp3');
        sound.play().catch(e => console.log('Error playing sound:', e));
      }
    } catch (e) {
      console.log('Error playing sound:', e);
    }
  };

  // Vibrate device - only when called directly
  const vibrate = (pattern) => {
    if (!workoutInProgress || !vibrationEnabled) return; // Safety check
    
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.log('Vibration failed:', e);
      }
    }
  };
  
  // Move to next exercise - called only from one place
  const moveToNextExercise = () => {
    const nextIndex = currentExerciseIndex + 1;
    
    // Play sound and vibrate
    playSound();
    vibrate([300, 100, 300]);
    
    if (nextIndex < exercises.length) {
      // Go to next exercise
      setCurrentExerciseIndex(nextIndex);
      setSecondsRemaining(exercises[nextIndex].duration);
    } else {
      // Workout complete
      vibrate([500, 200, 500, 200, 500]);
      setIsRunning(false);
      setWorkoutInProgress(false);
      // Make sure isWorkoutComplete will be true
      setCurrentExerciseIndex(exercises.length);
    }
  };
  
  // SINGLE timer useEffect - the only place where time is decremented
  useEffect(() => {
    // Only run when the workout is active
    if (!isRunning) return;
    
    console.log(`Timer running for exercise ${currentExerciseIndex + 1}: ${exercises[currentExerciseIndex]?.name}`);
    
    // Create single interval that runs every second
    const intervalId = setInterval(() => {
      setSecondsRemaining(seconds => {
        // When time's up, move to next exercise
        if (seconds <= 1) {
          clearInterval(intervalId);
          
          console.log(`Exercise ${currentExerciseIndex + 1} complete`);
          moveToNextExercise();
          return 0;
        }
        
        // Vibrate during final countdown
        if (seconds <= 3) {
          vibrate(200);
        }
        
        // Continue countdown
        return seconds - 1;
      });
    }, 1000);
    
    // Clean up when component unmounts or dependencies change
    return () => {
      console.log('Clearing timer');
      clearInterval(intervalId);
    };
  }, [isRunning, currentExerciseIndex, exercises]); // Added exercises to dependencies

  // Wake Lock API - Request wake lock when workout starts and release it when it ends
  useEffect(() => {
    // Only try to acquire wake lock if workout is in progress
    if (workoutInProgress && 'wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          const wakeLockObj = await navigator.wakeLock.request('screen');
          setWakeLock(wakeLockObj);
          console.log('Wake Lock acquired');
          
          // Add release event listener
          wakeLockObj.addEventListener('release', () => {
            console.log('Wake Lock released');
            setWakeLock(null);
          });
        } catch (err) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      };
      
      requestWakeLock();
    }
    
    // Release wake lock when workout ends
    return () => {
      if (wakeLock) {
        wakeLock.release()
          .then(() => console.log('Wake Lock released'))
          .catch((err) => console.error(`Wake Lock release error: ${err.name}, ${err.message}`));
      }
    };
  }, [workoutInProgress]);

  // Re-acquire wake lock when visibility changes (user switches tabs/apps and returns)
  useEffect(() => {
    if (!workoutInProgress) return;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLock && 'wakeLock' in navigator) {
        try {
          const wakeLockObj = await navigator.wakeLock.request('screen');
          setWakeLock(wakeLockObj);
          console.log('Wake Lock re-acquired after visibility change');
        } catch (err) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [workoutInProgress, wakeLock]);

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

  // Start workout
  const startWorkout = () => {
    console.log('Starting workout');
    setIsRunning(true);
    if (!workoutInProgress) {
      setWorkoutInProgress(true);
    }
  };

  // Pause workout
  const pauseWorkout = () => {
    console.log('Pausing workout');
    setIsRunning(false);
  };

  // Reset workout
  const resetWorkout = () => {
    console.log('Resetting workout');
    setIsRunning(false);
    setWorkoutInProgress(false);
    setCurrentExerciseIndex(0);
    setSecondsRemaining(exercises[0]?.duration || 60);
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
    if (!isRunning && index !== currentExerciseIndex) {
      console.log(`Manually selecting exercise ${index + 1}`);
      setCurrentExerciseIndex(index);
      setSecondsRemaining(exercises[index].duration);
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
          {frameContext && frameContext.fid && (
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
                    <button 
                      type="button" 
                      className="btn btn-accent ghibli-btn ghibli-float" 
                      onClick={resetWorkout}
                    >
                      Restart Workout
                    </button>
                    {frameContext && frameContext.fid && (
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
                    <h3 className="font-bold">{exercise.name}</h3>
                    <p className="text-xs truncate">{exercise.instruction.substring(0, 60)}...</p>
                    <div className="text-xs mt-1">{formatTime(exercise.duration)}</div>
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
          {frameContext && frameContext.fid && (
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
