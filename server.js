const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public dir

// Database Setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            highest_score INTEGER DEFAULT 0,
            avatar_id INTEGER DEFAULT 1,
            security_question TEXT,
            security_answer TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                // Attempt to add columns if they don't exist
                const columnsToAdd = [
                    'highest_score INTEGER DEFAULT 0',
                    'avatar_id INTEGER DEFAULT 1',
                    'security_question TEXT',
                    'security_answer TEXT'
                ];

                columnsToAdd.forEach(col => {
                    db.run(`ALTER TABLE users ADD COLUMN ${col}`, () => { });
                });
            }
        });
    }
});

// Routes

// Signup
app.post('/api/signup', (req, res) => {
    const { username, password, avatarId, securityQuestion, securityAnswer } = req.body;
    console.log('Signup Request:', req.body); // Debug log
    if (!username || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const selectedAvatar = avatarId || 1; // Default to 1 if not provided

    const sql = `INSERT INTO users (username, password, highest_score, avatar_id, security_question, security_answer) VALUES (?, ?, 0, ?, ?, ?)`;
    db.run(sql, [username, password, selectedAvatar, securityQuestion, securityAnswer.toLowerCase()], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User created successfully', id: this.lastID });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(sql, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({
                message: 'Login successful',
                user: {
                    id: row.id,
                    username: row.username,
                    highest_score: row.highest_score || 0,
                    avatar_id: row.avatar_id || 1
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Get Security Question
app.post('/api/get-security-question', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    db.get("SELECT security_question FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ question: row.security_question });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
    const { username, answer, newPassword } = req.body;
    if (!username || !answer || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.get("SELECT security_answer FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            if (row.security_answer === answer.toLowerCase()) {
                db.run("UPDATE users SET password = ? WHERE username = ?", [newPassword, username], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Password reset successfully' });
                });
            } else {
                res.status(401).json({ error: 'Incorrect security answer' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});

// Update High Score
app.post('/api/update-score', (req, res) => {
    const { userId, score } = req.body;

    db.get("SELECT highest_score FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            if (score > row.highest_score) {
                db.run("UPDATE users SET highest_score = ? WHERE id = ?", [score, userId], function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Score updated", newHighScore: score });
                });
            } else {
                res.json({ message: "Score not higher", newHighScore: row.highest_score });
            }
        } else {
            res.status(404).json({ error: "User not found" });
        }
    });
});

// --- ADMIN ROUTE: View All Users (SECURED) ---
// Visit https://your-app-url.com/api/users?key=admin123 to see this data
app.get('/api/users', (req, res) => {
    const adminKey = req.query.key;
    const SECRET_KEY = "macha"; // 🔒 CHANGE THIS to something only you know!

    if (adminKey !== SECRET_KEY) {
        return res.status(403).json({ error: "⛔ Access Denied: Incorrect Admin Key" });
    }

    const sql = "SELECT id, username, highest_score, avatar_id FROM users ORDER BY highest_score DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "total_players": rows.length,
            "data": rows
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
