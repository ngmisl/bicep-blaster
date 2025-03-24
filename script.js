document.addEventListener("DOMContentLoaded", () => {
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

  // Elements
  const timerDisplay = document.getElementById("timer");
  const currentExerciseDisplay = document.getElementById("current-exercise");
  const currentInstructionDisplay = document.getElementById(
    "current-instruction"
  );
  const nextExerciseDisplay = document.getElementById("next-exercise");
  const nextUpContainer = document.getElementById("next-up-container");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const progressBar = document.getElementById("progress");

  // Audio for exercise change
  const exerciseChangeSound = new Audio("sound.mp3");

  let timer;
  let currentExerciseIndex = 0;
  let secondsRemaining = exercises[currentExerciseIndex].duration;
  let isRunning = false;
  let workoutInProgress = false;

  // Update next exercise display
  function updateNextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
      nextExerciseDisplay.textContent =
        exercises[currentExerciseIndex + 1].name;
      nextUpContainer.style.display = "flex";
    } else {
      nextUpContainer.style.display = "none";
    }
  }

  // Format time (seconds) to MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  // Update timer display
  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(secondsRemaining);

    // Update progress bar
    const totalSeconds = exercises[currentExerciseIndex].duration;
    const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
    progressBar.style.width = `${progress}%`;
  }

  // Move to next exercise
  function nextExercise() {
    // Mark current exercise as completed
    document
      .getElementById(exercises[currentExerciseIndex].id)
      .classList.remove("current");
    document
      .getElementById(exercises[currentExerciseIndex].id)
      .classList.add("completed");

    currentExerciseIndex++;

    if (currentExerciseIndex < exercises.length) {
      // Play sound to indicate exercise change
      exerciseChangeSound.play();

      // Update current exercise
      const currentExercise = exercises[currentExerciseIndex];
      secondsRemaining = currentExercise.duration;
      currentExerciseDisplay.textContent = currentExercise.name;
      currentInstructionDisplay.textContent = currentExercise.instruction;

      // Update current exercise in the list
      document.getElementById(currentExercise.id).classList.add("current");

      // Update next exercise display
      updateNextExercise();
      updateTimerDisplay();
    } else {
      // Workout completed
      workoutInProgress = false;
      clearInterval(timer);
      isRunning = false;
      timerDisplay.textContent = "DONE!";
      startBtn.textContent = "Restart";
    }
  }

  // Start timer
  function startTimer() {
    if (!isRunning) {
      isRunning = true;
      if (!workoutInProgress) {
        workoutInProgress = true;
        startBtn.textContent = "In Progress";
      }

      timer = setInterval(() => {
        secondsRemaining--;
        updateTimerDisplay();
        if (secondsRemaining <= 0) {
          clearInterval(timer);
          isRunning = false;
          nextExercise();
          // Automatically start the next exercise timer if we haven't reached the end
          if (currentExerciseIndex < exercises.length) {
            startTimer();
          }
        }
      }, 1000);
    }
  }

  // Pause timer
  function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    startBtn.textContent = "Resume";
  }

  // Reset workout
  function resetWorkout() {
    clearInterval(timer);
    isRunning = false;
    workoutInProgress = false;
    currentExerciseIndex = 0;

    // Reset to first exercise
    const currentExercise = exercises[currentExerciseIndex];
    secondsRemaining = currentExercise.duration;
    currentExerciseDisplay.textContent = currentExercise.name;
    currentInstructionDisplay.textContent = currentExercise.instruction;

    // Update next exercise display
    updateNextExercise();
    updateTimerDisplay();
    startBtn.textContent = "Start Workout";

    // Reset exercise list styles
    for (const exercise of exercises) {
      document
        .getElementById(exercise.id)
        .classList.remove("current", "completed");
    }

    document.getElementById(exercises[0].id).classList.add("current");
  }

  // Event listeners
  startBtn.addEventListener("click", () => {
    if (currentExerciseIndex >= exercises.length) {
      resetWorkout();
    } else {
      startTimer();
    }
  });

  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetWorkout);

  // Initialize
  updateTimerDisplay();
  updateNextExercise();
});
