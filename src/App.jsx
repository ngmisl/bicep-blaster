import { useState, useEffect, useRef, useCallback } from "react";
import sdk from '@farcaster/frame-sdk';
import { saveWorkoutSession } from "./lib/storage";

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
  // Weight selector state
  const [weight, setWeight] = useState(10); // Default weight in kg
  // Repetition tracking
  const [repetitions, setRepetitions] = useState(1);
  const [sessionStats, setSessionStats] = useState(null);
  // Transition flag to prevent multiple timers - critical for exercise progression
  const [isTransitioning, setIsTransitioning] = useState(false);

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
            // console.log('Sound played successfully');
          })
          .catch(e => {
            // console.log('Sound playback failed, using vibration instead:', e);
            // Always vibrate as a fallback or additional feedback
            if (vibrationEnabled && 'vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          });
      }
    } catch (e) {
      // console.log('Error in playSound, using vibration instead:', e);
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
        // console.log('Vibration failed:', e);
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
      setSecondsRemaining(exercises[nextIndex].duration);
      
      // Make sure isRunning stays true
      setIsRunning(true);
      
      // Clear transition flag after a short delay
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    } else {
      // Workout complete - explicitly set index to length to trigger completion state
      setCurrentExerciseIndex(exercises.length);
      vibrate([500, 200, 500, 200, 500]);
      setIsRunning(false);
      setWorkoutInProgress(false);
      setIsTransitioning(false);
      
      // Calculate and save session stats
      const totalDuration = exercises.reduce((total, exercise) => total + exercise.duration, 0);
      const exerciseNames = exercises.map(ex => ex.name);
      
      // Create session stats object
      const stats = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        weight,
        repetitions,
        exercises: exerciseNames
      };
      
      // Set current session stats
      setSessionStats(stats);
      
      // Save workout session with selected weight
      saveWorkoutSession({
        weight,
        exercises: exerciseNames,
        repetitions
      });
      
      // console.log('WORKOUT COMPLETE! Showing completion screen with buttons.');
    }
  }, [currentExerciseIndex, exercises, playSound, vibrate, weight, repetitions]);

  // Timer effect - simplified to ensure it starts immediately
  useEffect(() => {
    // Only run if workout is in progress
    if (!isRunning) return;
    
    // console.log(`Timer running for exercise ${currentExerciseIndex + 1}: ${exercises[currentExerciseIndex]?.name || 'Unknown'}, seconds: ${secondsRemaining}`);
    
    // Create a timer that runs every second
    const timerId = setInterval(() => {
      setSecondsRemaining(prev => {
        // When time's up, move to next exercise
        if (prev <= 1) {
          clearInterval(timerId);
          // console.log(`Exercise ${currentExerciseIndex + 1} complete`);
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
      // console.log('Clearing timer');
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
        // console.log('Exercises loaded successfully:', data);
      })
      .catch(error => {
        // console.error('Error loading exercises:', error);
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
        // console.log('Wake Lock activated');
        
        // Add release listener
        lock.addEventListener('release', () => {
          // console.log('Wake Lock released');
          setWakeLock(null);
        });
      } catch (err) {
        // This is expected in some environments like iframes or when permissions are denied
        // console.log('Wake Lock error (this is normal in some environments):', err.name, err.message);
      }
    } else if (!('wakeLock' in navigator)) {
      // console.log('Wake Lock API not supported in this browser');
    }
  }, [wakeLock]);

  // Release wake lock - wrapped in useCallback
  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        // console.log('Wake Lock released');
      } catch (err) {
        // console.error('Error releasing Wake Lock:', err);
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
        // console.log('Frame SDK loaded:', frameContext);
      } catch (err) {
        // console.error('Error loading Frame SDK:', err);
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
          // console.log('Error releasing Wake Lock during cleanup:', err);
        }
      }
    };
  }, [wakeLock]);

  // Start workout - completely separated from audio logic
  const startWorkout = () => {
    // console.log('Starting or resuming workout...');
    
    if (workoutInProgress) {
      // This is a resume action
      // console.log('Resuming paused workout');
      setIsRunning(true);
      return;
    }
    
    // console.log('Starting new workout...');
    
    // Make sure we have a valid duration for the first exercise
    if (exercises.length > 0) {
      const firstExerciseDuration = exercises[0]?.duration || 60;
      // console.log(`Setting initial duration to ${firstExerciseDuration} seconds`);
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
    // console.log('Pausing workout');
    setIsRunning(false);
  };

  // Reset workout to beginning
  const resetWorkout = () => {
    // console.log('Resetting workout for a new repetition');
    
    // Important! Reset exercise index to 0 first
    setCurrentExerciseIndex(0);
    
    // Make sure we have the correct duration for the first exercise
    if (exercises.length > 0) {
      const firstExerciseDuration = exercises[0]?.duration || 60;
      setSecondsRemaining(firstExerciseDuration);
      // console.log(`Reset duration to ${firstExerciseDuration} seconds for first exercise`);
    } else {
      setSecondsRemaining(60);
    }
    
    // Reset workout state flags
    setIsRunning(false);
    setWorkoutInProgress(false);
    setIsTransitioning(false);
    
    // Don't reset the sessionStats here to keep them visible
    // The repetition count is incremented separately when "Another Repetition" is clicked
  };

  // Skip to next exercise
  const skipToNext = () => {
    if (currentExerciseIndex >= exercises.length - 1) return;
    
    // console.log(`Skipping to exercise ${currentExerciseIndex + 2}`);
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

  // Helper to check if workout is complete
  const isWorkoutComplete = currentExerciseIndex >= exercises.length;

  useEffect(() => {
    // Debug workout completion state
    if (isWorkoutComplete) {
      // console.log('Workout is marked as COMPLETE - buttons should be visible now');
    }
  }, [isWorkoutComplete]);

  // Current exercise - safely access it to prevent errors
  const currentExercise = exercises[currentExerciseIndex];
  
  // Get next exercise name helper
  const getNextExerciseName = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      return exercises[currentExerciseIndex + 1]?.name;
    }
    return null;
  }, [currentExerciseIndex, exercises]);

  const nextExercise = getNextExerciseName();
  
  // console.log('Workout state:', { 
  //   currentExerciseIndex, 
  //   exercisesLength: exercises.length,
  //   isWorkoutComplete
  // });

  const generateAndDownloadCard = () => {
    // console.log('Generating download card with stats:', sessionStats);
    
    if (!sessionStats) {
      // console.error('No session stats available');
      return;
    }
    
    // Create a new SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 800 400');
    
    // Add background with gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'bg-gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#4158D0');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '46%');
    stop2.setAttribute('stop-color', '#C850C0');
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', '#FFCC70');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    // Add background rectangle with rounded corners
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('rx', '20');
    rect.setAttribute('ry', '20');
    rect.setAttribute('width', '800');
    rect.setAttribute('height', '400');
    rect.setAttribute('fill', 'url(#bg-gradient)');
    svg.appendChild(rect);
    
    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '400');
    title.setAttribute('y', '60');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-size', '36');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('font-family', 'Arial, sans-serif');
    title.setAttribute('fill', 'white');
    title.textContent = 'Bicep Blaster';
    svg.appendChild(title);
    
    // Format date nicely for display
    const dateStr = sessionStats.date && sessionStats.time 
      ? `${sessionStats.date} - ${sessionStats.time}`
      : new Date().toLocaleString();
    
    // Add workout info
    const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateText.setAttribute('x', '400');
    dateText.setAttribute('y', '120');
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('font-size', '24');
    dateText.setAttribute('font-family', 'Arial, sans-serif');
    dateText.setAttribute('fill', 'white');
    dateText.textContent = `Date: ${dateStr}`;
    svg.appendChild(dateText);
    
    const weightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    weightText.setAttribute('x', '400');
    weightText.setAttribute('y', '180');  
    weightText.setAttribute('text-anchor', 'middle');
    weightText.setAttribute('font-size', '24');
    weightText.setAttribute('font-family', 'Arial, sans-serif');
    weightText.setAttribute('fill', 'white');
    weightText.textContent = `Weight: ${sessionStats.weight} kg`;
    svg.appendChild(weightText);
    
    const repsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    repsText.setAttribute('x', '400');
    repsText.setAttribute('y', '240');  
    repsText.setAttribute('text-anchor', 'middle');
    repsText.setAttribute('font-size', '24');
    repsText.setAttribute('font-family', 'Arial, sans-serif');
    repsText.setAttribute('fill', 'white');
    repsText.textContent = `Repetitions: ${sessionStats.repetitions}`;
    svg.appendChild(repsText);
    
    // Add website URL
    const urlText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    urlText.setAttribute('x', '400');
    urlText.setAttribute('y', '320');  
    urlText.setAttribute('text-anchor', 'middle');
    urlText.setAttribute('font-size', '18');
    urlText.setAttribute('font-family', 'Arial, sans-serif');
    urlText.setAttribute('fill', 'white');
    urlText.textContent = 'bicepblaster.orbiter.website';
    svg.appendChild(urlText);
    
    // Add dumbbell icon
    const dumbbellPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dumbbellPath.setAttribute('d', 'M6,5 H10 V7 H14 V5 H18 V9 H14 V7 H10 V9 H6 Z');
    dumbbellPath.setAttribute('transform', 'translate(660, 50) scale(2)');
    dumbbellPath.setAttribute('fill', 'white');
    dumbbellPath.setAttribute('stroke', 'white');
    dumbbellPath.setAttribute('stroke-width', '1');
    svg.appendChild(dumbbellPath);
    
    // Convert SVG to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    // Create a Blob with the SVG string
    const blob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `bicep-blaster-${new Date().toISOString().slice(0,10)}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // console.log('Workout card download initiated!');
  };

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
          {/* Weight selector - Only show before workout starts AND only on first repetition */}
          {!workoutInProgress && !isWorkoutComplete && repetitions === 1 && (
            <div className="card ghibli-card mb-6">
              <div className="card-body p-4">
                <h2 className="card-title justify-center font-bold text-lg mb-2 ghibli-text-shadow">Weight Selection</h2>
                <div className="flex items-center justify-center my-3">
                  <button 
                    type="button"
                    className="btn btn-circle btn-primary ghibli-btn text-xl font-bold"
                    onClick={() => setWeight(prev => Math.max(1, prev - 1))}
                    aria-label="Decrease weight"
                  >
                    -
                  </button>
                  <div className="mx-4 text-2xl font-bold flex items-baseline">
                    <span>{weight}</span>
                    <span className="text-xl ml-2">kg</span>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-circle btn-primary ghibli-btn text-xl font-bold"
                    onClick={() => setWeight(prev => prev + 1)}
                    aria-label="Increase weight"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Workout Completion Screen - Show when workout is complete */}
          {isWorkoutComplete && sessionStats && (
            <div className="card ghibli-card mb-6">
              <div className="card-body p-4">
                <h2 className="card-title justify-center font-bold text-lg mb-2 ghibli-text-shadow">Workout Stats</h2>
                <div className="my-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="opacity-70">Date:</div>
                  <div className="text-right">{sessionStats.date}</div>
                  <div className="opacity-70">Weight:</div>
                  <div className="text-right">{sessionStats.weight} kg</div>
                  <div className="opacity-70">Repetitions:</div>
                  <div className="text-right">{sessionStats.repetitions}</div>
                </div>
                <div className="card-actions justify-center gap-3 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-primary ghibli-btn" 
                    onClick={() => {
                      setRepetitions(repetitions + 1);
                      resetWorkout();
                    }}
                  >
                    Another Repetition
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-accent ghibli-btn" 
                    onClick={generateAndDownloadCard}
                  >
                    Download Card
                  </button>
                </div>
              </div>
            </div>
          )}
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
                  Next: {nextExercise}
                </div>
              )}
              <div className="card-actions justify-center gap-3 mt-4">
                {isWorkoutComplete ? (
                  <></>
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

          {/* Workout Stats */}
          {sessionStats && (
            <div className="card ghibli-card mb-6">
              <div className="card-body p-4">
                <h2 className="card-title justify-center font-bold text-lg mb-2 ghibli-text-shadow">Workout Stats</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Date:</span>
                    <span className="text-sm">{sessionStats.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Weight:</span>
                    <span className="text-sm">{sessionStats.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm opacity-70">Repetitions:</span>
                    <span className="text-sm">{sessionStats.repetitions}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
