import { useState, useEffect, useRef } from 'react'
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
  
  // Refs
  const timerRef = useRef(null);
  const exerciseChangeSoundRef = useRef(null);

  // Initialize sound
  useEffect(() => {
    exerciseChangeSoundRef.current = new Audio('/sound.mp3');
  }, []);

  // Format time (seconds) to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSeconds = exercises[currentExerciseIndex].duration;
    return ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
  };

  // Start timer
  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (!workoutInProgress) {
        setWorkoutInProgress(true);
      }

      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            nextExercise();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Move to next exercise
  const nextExercise = () => {
    const newIndex = currentExerciseIndex + 1;
    
    if (newIndex < exercises.length) {
      // Play sound to indicate exercise change
      exerciseChangeSoundRef.current.play();
      
      // Update current exercise index and seconds remaining
      setCurrentExerciseIndex(newIndex);
      setSecondsRemaining(exercises[newIndex].duration);
      
      // Use setTimeout to ensure state updates have been processed
      setTimeout(() => {
        // Automatically start the next exercise timer
        startTimer();
      }, 100);
    } else {
      // Workout completed
      setWorkoutInProgress(false);
      setIsRunning(false);
    }
  };

  // Pause timer
  const pauseTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  // Reset workout
  const resetWorkout = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setWorkoutInProgress(false);
    setCurrentExerciseIndex(0);
    setSecondsRemaining(exercises[0].duration);
  };

  // Handle button clicks
  const handleStartClick = () => {
    if (currentExerciseIndex >= exercises.length) {
      resetWorkout();
    } else {
      startTimer();
    }
  };

  // Get next exercise name
  const getNextExerciseName = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      return exercises[currentExerciseIndex + 1].name;
    }
    return null;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
            onClick={handleStartClick}
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
            onClick={pauseTimer}
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
        </div>
      </div>

      <div className="workout-list">
        <h2>Exercise List</h2>
        {exercises.map((exercise, index) => (
          <div 
            key={exercise.id} 
            className={`exercise-item ${index === currentExerciseIndex ? 'current' : ''} ${index < currentExerciseIndex ? 'completed' : ''}`}
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
