import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Exercise data
  const exercises = [
    {
      name: "Wide DB Curl",
      duration: 60,
      id: "ex-1",
      instruction:
        "Hold dumbbells with palms up and arms wider than shoulder-width, then curl up while keeping elbows fixed.",
    },
    {
      name: "Hammer Curl",
      duration: 60,
      id: "ex-2",
      instruction:
        "Hold dumbbells with palms facing each other, then curl up while maintaining the neutral grip throughout the movement.",
    },
    {
      name: "Drag Curl",
      duration: 60,
      id: "ex-3",
      instruction:
        "Curl the weights while keeping them close to your body, dragging them upward as your elbows move backward.",
    },
    {
      name: "Reverse DB Curl",
      duration: 60,
      id: "ex-4",
      instruction:
        "Hold dumbbells with palms facing down, then curl up while maintaining the overhand grip to target the forearms and brachialis.",
    },
    {
      name: "DB Straight Curl",
      duration: 60,
      id: "ex-5",
      instruction:
        "Hold dumbbells at your sides with palms facing forward, then curl straight up without letting your elbows move forward.",
    },
  ];

  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(exercises[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSeconds = exercises[currentExerciseIndex].duration;
    return ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  };

  // Play sound - only when called directly
  const playSound = () => {
    if (!workoutInProgress) return; // Safety check
    
    try {
      const sound = new Audio('/sound.mp3');
      sound.play().catch(e => console.log('Error playing sound:', e));
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
    }
  };
  
  // SINGLE timer useEffect - the only place where time is decremented
  useEffect(() => {
    // Only run when the workout is active
    if (!isRunning) return;
    
    console.log(`Timer running for exercise ${currentExerciseIndex + 1}: ${exercises[currentExerciseIndex].name}`);
    
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
  }, [isRunning, currentExerciseIndex]); // Only re-run when these change

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
    setSecondsRemaining(exercises[0].duration);
  };

  // Skip to next exercise
  const skipToNext = () => {
    if (currentExerciseIndex >= exercises.length - 1) return;
    
    console.log(`Skipping to exercise ${currentExerciseIndex + 2}`);
    moveToNextExercise();
  };

  // Toggle vibration
  const toggleVibration = () => {
    setVibrationEnabled(prev => !prev);
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

  return (
    <div className="container">
      <header>
        <h1>Bicep Blaster Workout</h1>
        <p>Complete all exercises in one continuous flow</p>
      </header>

      <div className="workout-container">
        <div className="timer-display" id="timer">
          {currentExerciseIndex >= exercises.length 
            ? "DONE!" 
            : formatTime(secondsRemaining)}
        </div>

        <div className="exercise-info">
          <div className="exercise-name">
            {currentExerciseIndex < exercises.length 
              ? exercises[currentExerciseIndex].name 
              : "Workout Complete"}
          </div>

          <div className="exercise-description">
            {currentExerciseIndex < exercises.length 
              ? exercises[currentExerciseIndex].instruction 
              : "Great job! You've completed all exercises."}
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${currentExerciseIndex < exercises.length ? calculateProgress() : 100}%` }}
            ></div>
          </div>
        </div>

        {getNextExerciseName() && (
          <div className="next-up">
            <div className="next-label">Next Exercise:</div>
            <div className="next-exercise">{getNextExerciseName()}</div>
          </div>
        )}

        <div className="controls">
          <button 
            className="start-btn" 
            onClick={startWorkout}
            disabled={isRunning}
          >
            {!workoutInProgress 
              ? "Start Workout" 
              : isRunning 
                ? "In Progress" 
                : "Resume"}
          </button>
          <button 
            className="pause-btn" 
            onClick={pauseWorkout}
            disabled={!isRunning}
          >
            Pause
          </button>
          <button 
            className="reset-btn" 
            onClick={resetWorkout}
          >
            Reset
          </button>
          {currentExerciseIndex < exercises.length - 1 && workoutInProgress && !isRunning && (
            <button 
              className="skip-btn" 
              onClick={skipToNext}
            >
              Skip
            </button>
          )}
        </div>
        
        <div className="settings">
          <button 
            className={`vibration-btn ${vibrationEnabled ? 'active' : 'inactive'}`}
            onClick={toggleVibration}
          >
            {vibrationEnabled ? 'Vibration: ON' : 'Vibration: OFF'}
          </button>
        </div>
      </div>

      <div className="workout-list">
        <h2>Exercise List</h2>
        {exercises.map((exercise, index) => (
          <div 
            key={exercise.id} 
            className={`exercise-item ${index === currentExerciseIndex ? 'current' : ''} ${index < currentExerciseIndex ? 'completed' : ''}`}
            onClick={() => handleExerciseItemClick(index)}
          >
            <div className="exercise-item-header">
              <span className="exercise-name">{exercise.name}</span>
              <span className="exercise-time">{formatTime(exercise.duration)}</span>
            </div>
            <p className="exercise-instruction">{exercise.instruction}</p>
          </div>
        ))}
      </div>

      <footer className="footer">
        <a href="https://fourzerofour.fkey.id/" target="_blank" rel="noopener noreferrer" className="support-link">
          Support this project ❤️
        </a>
      </footer>
    </div>
  )
}

export default App
