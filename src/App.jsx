import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Bell, Volume2, VolumeX, Vibrate, ZapOff } from "lucide-react";

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
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

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
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

  const currentExercise = currentExerciseIndex < exercises.length ? exercises[currentExerciseIndex] : null;
  const nextExercise = currentExerciseIndex < exercises.length - 1 ? exercises[currentExerciseIndex + 1] : null;
  const isWorkoutComplete = currentExerciseIndex >= exercises.length;

  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-background px-4 py-6 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border shadow-lg">
        <header className="border-b border-border p-4 text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Bicep Blaster</h1>
          <p className="text-sm text-muted-foreground">Complete all exercises in one flow</p>
        </header>

        {/* Main workout display */}
        <div className="p-4">
          {/* Current Exercise Display */}
          <Card className="mb-6 relative overflow-hidden">
            <Progress 
              value={isWorkoutComplete ? 100 : calculateProgress()} 
              className="absolute top-0 h-1 w-full" 
            />
            <CardHeader className="pb-2">
              <CardTitle className="exercise-name-large">
                {isWorkoutComplete 
                  ? "Workout Complete" 
                  : currentExercise?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-center">
              <div className="workout-timer-display">
                {isWorkoutComplete 
                  ? "DONE!" 
                  : formatTime(secondsRemaining)}
              </div>
              <p className="mt-4 text-sm md:text-base">
                {isWorkoutComplete 
                  ? "Great job! You've completed all exercises." 
                  : currentExercise?.instruction}
              </p>
              {nextExercise && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Next: {nextExercise.name}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-center gap-3">
              {isWorkoutComplete ? (
                <Button size="lg" onClick={resetWorkout}>
                  Start Again
                </Button>
              ) : !isRunning ? (
                <>
                  <Button size="lg" onClick={startWorkout}>
                    {!workoutInProgress ? "Start" : "Resume"}
                  </Button>
                  <Button size="lg" onClick={resetWorkout} variant="outline">
                    Reset
                  </Button>
                  {workoutInProgress && (
                    <Button size="lg" onClick={skipToNext} variant="outline" 
                      disabled={currentExerciseIndex >= exercises.length - 1}>
                      Skip
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={toggleSound}
                    className="h-10 px-3"
                  >
                    {soundEnabled ? "🔊" : "🔇"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={toggleVibration}
                    className="h-10 px-3"
                  >
                    {vibrationEnabled ? "📳" : "📴"}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={pauseWorkout} variant="outline">
                    Pause
                  </Button>
                  <Button size="lg" onClick={resetWorkout} variant="outline">
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={toggleSound}
                    className="h-10 px-3"
                  >
                    {soundEnabled ? "🔊" : "🔇"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={toggleVibration}
                    className="h-10 px-3"
                  >
                    {vibrationEnabled ? "📳" : "📴"}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

          {/* Exercise List */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-2">Exercise List</h2>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <Card 
                  key={exercise.id}
                  className={`cursor-pointer ${
                    index === currentExerciseIndex 
                      ? "border-primary" 
                      : index < currentExerciseIndex 
                        ? "opacity-50" 
                        : ""
                  }`}
                  onClick={() => handleExerciseItemClick(index)}
                >
                  <CardContent className="p-3">
                    <div className="font-bold">{exercise.name}</div>
                    <div className="text-xs truncate">{exercise.instruction.substring(0, 60)}...</div>
                    <div className="text-xs mt-1">{formatTime(exercise.duration)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Support Link - More Visible */}
          <div className="mt-4 text-center flex justify-center gap-3">
            <a 
              href="https://fourzerofour.fkey.id/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Support this project ❤️
            </a>
            <a 
              href="https://simplex.chat/contact/#/?v=2-7&smp=smp%3A%2F%2FZKe4uxF4Z_aLJJOEsC-Y6hSkXgQS5-oc442JQGkyP8M%3D%40smp17.simplex.im%2F1CEQbUx7PLENFjgLngWHKRb-hTNQIOKR%23%2F%3Fv%3D1-3%26dh%3DMCowBQYDK2VuAyEAO805q6Syl84pJXUTqmNiPfLPU_Dk_hqyosW56vMy7BU%253D%26srv%3Dogtwfxyi3h2h5weftjjpjmxclhb5ugufa5rcyrmg7j4xlch7qsr5nuqd.onion" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block py-2 px-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Contact Us 📱
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
