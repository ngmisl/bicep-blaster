# Bicep Blaster Workout App

A lightweight, browser-based workout timer application specifically designed for bicep training. This application helps users follow a structured bicep workout routine with timed exercises and visual cues.

![image](https://github.com/user-attachments/assets/473a2459-065b-4686-a26f-a189b537718f)


## Features

- **Structured Workout Plan**: Pre-defined bicep exercises with appropriate durations
- **Visual Timer**: Large, easy-to-read countdown timer for each exercise
- **Progress Tracking**: Visual progress bar showing completion status
- **Exercise Instructions**: Clear instructions for proper form during each exercise
- **Responsive Design**: Works on desktop and mobile devices
- **Audio Cues**: Clear "bing" sound notifications when transitioning between exercises
- **Intuitive Controls**: Simple start, pause, and reset functionality
- **Browser Integration**: Custom favicon for better browser tab identification

## Recent Updates

- Added a custom favicon for better browser recognition
- Improved sound notification system with clearer audio cues
- Enhanced Content Security Policy for better compatibility across browsers
- Optimized audio file loading for better performance

## Exercises Included

1. **Wide DB Curl**: Hold dumbbells with palms up and arms wider than shoulder-width, then curl up while keeping elbows fixed.
2. **Hammer Curl**: Hold dumbbells with palms facing each other, then curl up while maintaining the neutral grip throughout the movement.
3. **Drag Curl**: Curl the weights while keeping them close to your body, dragging them upward as your elbows move backward.
4. **Reverse DB Curl**: Hold dumbbells with palms facing down, then curl up while maintaining the overhand grip to target the forearms and brachialis.
5. **DB Straight Curl**: Hold dumbbells at your sides with palms facing forward, then curl straight up without letting your elbows move forward.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Dumbbells for performing the exercises

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/bicepblaster.git
   ```

2. Navigate to the project directory:

   ```bash
   cd bicepblaster
   ```

3. Open `index.html` in your web browser:

   ```bash
   open index.html   # macOS
   xdg-open index.html   # Linux
   start index.html   # Windows
   ```

Alternatively, you can simply double-click the `index.html` file in your file explorer.

## Usage

1. Review the exercise list to familiarize yourself with the workout routine
2. Click "Start Workout" to begin the first exercise
3. Follow the on-screen instructions for each exercise
4. The timer will automatically progress to the next exercise when the current one is complete
5. Use the "Pause" button if you need to take a break
6. Use the "Reset" button to start the workout from the beginning

## Project Structure

- `index.html`: The main HTML structure of the application
- `styles.css`: All CSS styling for the application
- `script.js`: JavaScript functionality for the timer and exercise progression

## Customization

To customize the workout routine, modify the `exercises` array in `script.js`. Each exercise object should include:

```javascript
{
  name: "Exercise Name",
  duration: 60, // duration in seconds
  id: "unique-id",
  instruction: "Detailed instructions for the exercise"
}
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

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
- Color scheme based on the [American Colonial palette](https://coolors.co/palette/e63946-f1faee-a8dadc-457b9d-1d3557)
- Audio notification sounds from [Pixabay](https://pixabay.com/)

## Future Enhancements

- User-customizable exercise durations
- Ability to save and load different workout routines
- Integration with fitness tracking apps
- Voice guidance for exercises
- Dark mode support
