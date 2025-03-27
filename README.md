[![CodeQL](https://github.com/ngmisl/bicep-blaster/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/ngmisl/bicep-blaster/actions/workflows/github-code-scanning/codeql)

# Bicep Blaster Workout App

A lightweight, mobile-first workout timer application specifically designed for bicep training. Built with React, Bun, Tailwind CSS, and DaisyUI, this application helps users follow a structured bicep workout routine with timed exercises and visual cues.

![2025-03-24 12 47 46 bicepblaster orbiter website 79f17c054199](https://github.com/user-attachments/assets/b27aa082-efe1-409c-b5c8-43227814af47)

## Features

- **Structured Workout Plan**: Pre-defined bicep exercises with appropriate durations
- **Visual Timer**: Large, easy-to-read countdown timer for each exercise
- **Progress Tracking**: Visual progress bar showing completion status
- **Exercise Instructions**: Clear instructions for proper form during each exercise
- **Mobile-First Design**: Optimized for mobile devices with a beautiful Ghibli-inspired UI
- **Audio Cues**: Sound notifications when transitioning between exercises
- **Vibration Feedback**: Haptic feedback on mobile devices during transitions
- **Intuitive Controls**: Simple start, pause, and reset functionality
- **Screen Wake Lock**: Prevents screen from turning off during workouts
- **Farcaster Integration**: Share your workout completion on Farcaster

## Recent Updates

- **DaisyUI Integration**: Added DaisyUI for a beautiful Ghibli-inspired UI
- **JSON-Based Exercise Data**: Moved exercises to a separate JSON file for easier customization
- **Improved Sound Handling**: Enhanced audio playback for better browser compatibility
- **Mobile Optimizations**: Improved layout and controls for mobile devices
- **Wake Lock API**: Added support to keep the screen on during workouts
- **Restart Button**: Added a dedicated restart button at workout completion

## Tech Stack

- **React**: Frontend framework
- **Bun**: JavaScript runtime and package manager
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind CSS
- **Farcaster Frame SDK**: Integration with Farcaster social platform

## Exercises

Exercises are now stored in a JSON file (`public/exercises.json`) for easy customization:

```json
[
  {
    "name": "Wide DB Curl",
    "duration": 60,
    "id": "ex-1",
    "instruction": "Hold dumbbells with palms up and arms wider than shoulder-width, then curl up while keeping elbows fixed."
  },
  {
    "name": "Hammer Curl",
    "duration": 60,
    "id": "ex-2",
    "instruction": "Hold dumbbells with palms facing each other, then curl up while maintaining the neutral grip throughout the movement."
  },
  {
    "name": "Drag Curl",
    "duration": 60,
    "id": "ex-3",
    "instruction": "Curl the weights while keeping them close to your body, dragging them upward as your elbows move backward."
  },
  {
    "name": "Reverse DB Curl",
    "duration": 60,
    "id": "ex-4",
    "instruction": "Hold dumbbells with palms facing down, then curl up while maintaining the overhand grip to target the forearms and brachialis."
  },
  {
    "name": "DB Straight Curl",
    "duration": 60,
    "id": "ex-5",
    "instruction": "Hold dumbbells at your sides with palms facing forward, then curl straight up without letting your elbows move forward."
  }
]
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime and package manager)
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Dumbbells for performing the exercises

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ngmisl/bicep-blaster.git
   ```

2. Navigate to the project directory:

   ```bash
   cd bicep-blaster
   ```

3. Install dependencies:

   ```bash
   bun install
   ```

4. Start the development server:

   ```bash
   bun run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
bun run build
```

The built files will be in the `dist` directory, ready to be deployed to your hosting provider.

## Customizing Exercises

To customize the workout routine, modify the `public/exercises.json` file. Each exercise object should include:

```json
{
  "name": "Exercise Name",
  "duration": 60,
  "id": "unique-id",
  "instruction": "Detailed instructions for the exercise"
}
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Unlicenced license - see the LICENSE file for details.

## Acknowledgments

- Inspired by high-intensity interval training (HIIT) workout methods
- UI design inspired by Studio Ghibli animations
- DaisyUI for the beautiful component library
- Farcaster for social sharing integration

## Future Enhancements

- User-customizable exercise durations
- Ability to save and load different workout routines
- Integration with fitness tracking apps
- Voice guidance for exercises
- Offline support with Progressive Web App (PWA) features
- Workout statistics and history
