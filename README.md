# Fitness Goal Tracker

A web application for tracking fitness goals and monitoring progress. Built with Express.js and Node.js.

## Features

- Create, read, update, and delete fitness goals
- Track progress towards goals
- Set due dates and goal types
- Responsive design for all devices
- Form validation and error handling

## Tech Stack

- Node.js
- Express.js
- Pug (Template Engine)
- Express Validator
- Method Override

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fitness-goal-tracker.git
cd fitness-goal-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
/fitness-goal-tracker
  app.js              # Main application file
  package.json        # Project dependencies and scripts
  .gitignore         # Git ignore rules
  /public            # Static files
    /images          # Image assets
    /styles          # CSS files
    /javascripts     # Client-side JavaScript
  /routes            # Route definitions
    index.js         # Homepage routes
    /goals           # Goal-related routes
  /controllers       # Route controllers
    /goals           # Goal-related controllers
  /services          # Business logic
    /goals           # Goal-related services
  /views             # Pug templates
    layout.pug       # Main layout template
    index.pug        # Homepage template
    goals/           # Goal-related templates
```

## Development

To run the application in development mode with auto-reload:

```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This web application was created to fulfill Web Technology module's requirements and does not represent an actual company or service. 