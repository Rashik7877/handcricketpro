# Hand Cricket Pro

A modern, interactive Hand Cricket game with user authentication and score tracking.

## Live Demo
Play the game at: [Your Hosting URL]

## Features
- 🎮 Classic Hand Cricket gameplay
- 👤 User authentication (Login/Signup)
- 🏆 Avatar selection (6 gaming-themed avatars)
- 📊 High score tracking
- 🪙 Coin toss mechanics
- 🎯 Milestone celebrations (50, 100, 200, etc.)
- 🎨 Beautiful glassmorphism UI
- 🔐 Password visibility toggle

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Styling**: Custom CSS with Google Fonts (Outfit)

## Local Development

### Prerequisites
- Node.js (v18 or higher)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd HandCricketPro

# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

## Deployment

### Heroku
```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Push to Heroku
git push heroku main

# Open your app
heroku open
```

### Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy!

### Vercel/Netlify
This app requires a Node.js backend, so platforms like Vercel or Netlify will need serverless function configuration.

## Game Rules
1. Choose a number between 1-6
2. If your number matches the bot's number, the batter is OUT
3. If the numbers are different, the batter scores that many runs
4. Score as much as possible before getting out!

## Project Structure
```
HandCricketPro/
├── index.html          # Main HTML file
├── style.css           # Styles and animations
├── script.js           # Frontend game logic
├── server.js           # Backend server
├── database.db         # SQLite database (auto-created)
├── package.json        # Dependencies
└── Procfile           # Heroku configuration
```

## License
MIT

## Author
Created with ❤️ for Hand Cricket fans
