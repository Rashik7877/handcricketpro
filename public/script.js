const API_URL = `${window.location.origin}/api`;

// State
let currentUser = null;
let gameState = {
    isPlaying: false,
    innings: 1, // 1: Player Batting, 2: Player Bowling
    playerScore: 0,
    botScore: 0,
    target: null,
    balls: 0,
    history: [],
    isSuperOver: false
};

// DOM Elements
const sections = {
    auth: document.getElementById('auth-section'),
    menu: document.getElementById('menu-section'),
    toss: document.getElementById('toss-section'),
    game: document.getElementById('game-section'),
    rules: document.getElementById('rules-section'),
    avatar: document.getElementById('avatar-section')
};

// Auth Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const authMessage = document.getElementById('auth-message');

// Game Elements
const scoreDisplay = document.getElementById('score-display');
const targetDisplay = document.getElementById('target-display');
const targetContainer = document.getElementById('target-display-container');
const userHand = document.getElementById('user-hand');
const botHand = document.getElementById('bot-hand');
const commentary = document.getElementById('commentary-text');
const modal = document.getElementById('game-over-modal');
const userZoneLabel = document.querySelector('.user-zone .zone-label');
const botZoneLabel = document.querySelector('.bot-zone .zone-label');
const highScoreDisplay = document.getElementById('high-score-display');
const animationOverlay = document.getElementById('animation-overlay');
const animationContent = document.getElementById('animation-content');

// Toss Elements
const coin = document.getElementById('coin');
const tossControls = document.getElementById('toss-controls');
const decisionControls = document.getElementById('decision-controls');
const tossMessage = document.getElementById('toss-result-message');

// Hand Icons Mapping
const handIcons = {
    1: '☝️',
    2: '✌️',
    3: '🤟',
    4: '🖖',
    5: '🖐️',
    6: '👍'
};

// --- Initialization ---
function init() {
    setupEventListeners();
    checkSession(); // Re-enable session check
}

function setupEventListeners() {
    // Auth Switching
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        forgotPasswordForm.classList.add('hidden');
        authMessage.textContent = '';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        forgotPasswordForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authMessage.textContent = '';
        // Clear signup fields
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';
    });

    document.getElementById('show-forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        forgotPasswordForm.classList.remove('hidden');
        authMessage.textContent = '';
        // Reset forgot password form
        document.getElementById('forgot-step-1').classList.remove('hidden');
        document.getElementById('forgot-step-2').classList.add('hidden');
        document.getElementById('forgot-username').value = '';
        document.getElementById('forgot-answer').value = '';
        document.getElementById('new-password').value = '';
    });

    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authMessage.textContent = '';
    });

    // Auth Actions
    document.getElementById('login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogin();
    });
    document.getElementById('signup-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleSignup();
    });
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    // Forgot Password Actions
    document.getElementById('forgot-next-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleForgotStep1();
    });
    document.getElementById('reset-password-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleResetPassword();
    });

    // Menu Actions
    document.getElementById('play-btn').addEventListener('click', (e) => {
        e.preventDefault();
        initToss();
    });
    document.getElementById('rules-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('rules');
    });
    document.getElementById('back-from-rules').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('menu');
    });

    // Toss Actions
    document.querySelectorAll('.toss-btn[data-choice]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleToss(e.target.dataset.choice);
        });
    });

    document.getElementById('choose-bat').addEventListener('click', (e) => {
        e.preventDefault();
        startGame(1);
    });
    document.getElementById('choose-bowl').addEventListener('click', (e) => {
        e.preventDefault();
        startGame(2);
    });

    // Game Controls
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleMove(parseInt(e.target.dataset.value));
        });
    });

    // Modal Actions
    // restart-btn logic is handled dynamically in showGameOver
    document.getElementById('home-btn').addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('hidden');
        showSection('menu');
    });

    // Avatar Selection
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            handleAvatarSelection(e.target.dataset.id);
        });
    });

    document.getElementById('confirm-avatar-btn').addEventListener('click', (e) => {
        e.preventDefault();
        performSignup();
    });

    // Password Toggle
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                e.target.textContent = '🔒';
            } else {
                input.type = 'password';
                e.target.textContent = '👁️';
            }
        });
    });
}

// --- Navigation ---
function showSection(sectionName) {
    const target = sections[sectionName];

    Object.values(sections).forEach(sec => {
        if (sec === target) return;
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
        setTimeout(() => sec.classList.add('hidden'), 400);
    });

    target.classList.remove('hidden');
    setTimeout(() => {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }, 50);
}

// Avatar Mapping
const avatars = {
    1: "👾",
    2: "🤖",
    3: "🏆",
    4: "⚔️",
    5: "🛡️",
    6: "🔥"
};

let selectedAvatarId = null;

// --- Authentication ---
function checkSession() {
    currentUser = null;
    showSection('auth');
}

async function handleLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        const data = await res.json();

        if (res.ok && data.user) {
            currentUser = data.user;
            document.getElementById('player-name-display').textContent = currentUser.username;
            if (highScoreDisplay) highScoreDisplay.textContent = currentUser.highest_score || 0;

            // Set Avatar
            const avatarEl = document.querySelector('.user-profile .avatar');
            avatarEl.textContent = avatars[currentUser.avatar_id] || avatars[1];

            showSection('menu');
            usernameInput.value = '';
            passwordInput.value = '';
        } else {
            authMessage.textContent = data.error || 'Login failed';
        }
    } catch (err) {
        authMessage.textContent = 'Connection error';
    }
}

function handleSignup() {
    const usernameInput = document.getElementById('signup-username');
    const passwordInput = document.getElementById('signup-password');
    const securityQuestion = document.getElementById('signup-security-question');
    const securityAnswer = document.getElementById('signup-security-answer');

    if (!usernameInput.value || !passwordInput.value || !securityQuestion.value || !securityAnswer.value) {
        authMessage.textContent = 'Please fill in all fields';
        return;
    }

    // Reset selection
    selectedAvatarId = null;
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('confirm-avatar-btn').disabled = true;

    // Proceed to Avatar Selection
    showSection('avatar');
    authMessage.textContent = '';
}

function handleAvatarSelection(id) {
    selectedAvatarId = parseInt(id);
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.id == id) opt.classList.add('selected');
    });
    document.getElementById('confirm-avatar-btn').disabled = false;
}

async function performSignup() {
    const usernameInput = document.getElementById('signup-username');
    const passwordInput = document.getElementById('signup-password');
    const securityQuestion = document.getElementById('signup-security-question');
    const securityAnswer = document.getElementById('signup-security-answer');

    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value,
                avatarId: selectedAvatarId,
                securityQuestion: securityQuestion.value,
                securityAnswer: securityAnswer.value
            })
        });

        const data = await res.json();

        if (res.ok) {
            handleLoginWithCreds(usernameInput.value, passwordInput.value);
            // Clear fields
            usernameInput.value = '';
            passwordInput.value = '';
            securityQuestion.value = '';
            securityAnswer.value = '';
        } else {
            showSection('auth'); // Go back to auth
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
            authMessage.textContent = data.error;
        }
    } catch (err) {
        showSection('auth');
        authMessage.textContent = 'Connection error';
    }
}

async function handleForgotStep1() {
    const username = document.getElementById('forgot-username').value;
    if (!username) {
        authMessage.textContent = 'Please enter username';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/get-security-question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await res.json();

        if (res.ok) {
            const questionMap = {
                'color': 'What is your favorite color?',
                'pet': 'What is the name of your first pet?',
                'city': 'In what city were you born?',
                'food': 'What is your favorite food?',
                'school': 'What is the name of your first school?'
            };

            document.getElementById('security-question-display').textContent = questionMap[data.question] || data.question;
            document.getElementById('forgot-step-1').classList.add('hidden');
            document.getElementById('forgot-step-2').classList.remove('hidden');
            authMessage.textContent = '';
        } else {
            authMessage.textContent = data.error;
        }
    } catch (err) {
        authMessage.textContent = 'Connection error';
    }
}

async function handleResetPassword() {
    const username = document.getElementById('forgot-username').value;
    const answer = document.getElementById('forgot-answer').value;
    const newPassword = document.getElementById('new-password').value;

    if (!answer || !newPassword) {
        authMessage.textContent = 'Please fill in all fields';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, answer, newPassword })
        });

        if (res.ok) {
            authMessage.textContent = 'Password reset successful! Please login.';
            authMessage.style.color = 'green';
            setTimeout(() => {
                document.getElementById('show-login').click();
                authMessage.style.color = ''; // Reset color
            }, 2000);
        } else {
            const data = await res.json();
            authMessage.textContent = data.error;
        }
    } catch (err) {
        authMessage.textContent = 'Connection error';
    }
}

async function handleLoginWithCreds(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    handleLogin();
}

function handleLogout() {
    currentUser = null;
    showSection('auth');
}

// --- Toss Logic ---
function initToss() {
    showSection('toss');

    // Reset Toss UI
    coin.style.transform = 'rotateY(0deg)';
    tossControls.classList.remove('hidden');
    decisionControls.classList.add('hidden');
    tossMessage.textContent = '';

    // Enable buttons
    document.querySelectorAll('.toss-btn').forEach(btn => btn.disabled = false);
}

function handleToss(userChoice) {
    // Disable buttons
    document.querySelectorAll('.toss-btn').forEach(btn => btn.disabled = true);

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const rotations = 5; // Number of full rotations
    const degrees = result === 'heads' ? 0 : 180;
    const totalDegrees = (rotations * 360) + degrees;

    // Animate
    coin.style.transform = `rotateY(${totalDegrees}deg)`;

    setTimeout(() => {
        if (userChoice === result) {
            tossMessage.textContent = `It's ${result.toUpperCase()}! You Won the Toss!`;
            tossControls.classList.add('hidden');
            decisionControls.classList.remove('hidden');
            document.querySelectorAll('.toss-btn').forEach(btn => btn.disabled = false);
        } else {
            tossMessage.textContent = `It's ${result.toUpperCase()}! Bot Won the Toss.`;
            const botChoice = Math.random() < 0.5 ? 1 : 2; // 1=Bat, 2=Bowl
            const botChoiceText = botChoice === 1 ? 'Bat' : 'Bowl';

            setTimeout(() => {
                tossMessage.textContent += ` Bot chose to ${botChoiceText}.`;
                setTimeout(() => {
                    // If bot bats (1), player bowls (2). If bot bowls (2), player bats (1).
                    const playerRole = botChoice === 1 ? 2 : 1;
                    startGame(playerRole);
                }, 1000);
            }, 500);
        }
    }, 1500); // Wait for animation
}

// --- Game Logic ---
function startGame(playerRole, isSuperOver = false) {
    gameState = {
        isPlaying: true,
        innings: 1,
        playerScore: 0,
        botScore: 0,
        target: null,
        balls: 0,
        history: [],
        isSuperOver: isSuperOver,
        firstBattingSide: playerRole
    };

    updateUI();
    showSection('game');

    // Reset Visuals
    userHand.textContent = '✋';
    botHand.textContent = '🤖';
    targetContainer.classList.add('hidden');

    if (isSuperOver) {
        commentary.textContent = "SUPER OVER! You are Batting first.";
        // Force player to bat first in Super Over for simplicity, or toss again? 
        // Let's just stick to the role passed.
        // Actually, let's default Super Over to Player Batting first for simplicity unless we want another toss.
        // Let's keep the role passed.
    }

    startInnings(playerRole);
}

function startInnings(role) {
    // role: 1 = Player Batting, 2 = Player Bowling
    gameState.innings = role;

    if (role === 1) {
        commentary.textContent = gameState.isSuperOver ? "SUPER OVER: You are Batting!" : "You are Batting!";
        userZoneLabel.textContent = "You (Batting)";
        botZoneLabel.textContent = "Bot (Bowling)";
    } else {
        commentary.textContent = gameState.isSuperOver ? "SUPER OVER: You are Bowling!" : "You are Bowling!";
        userZoneLabel.textContent = "You (Bowling)";
        botZoneLabel.textContent = "Bot (Batting)";
    }

    // If it's the second innings of the match (chase)
    if (gameState.target !== null) {
        targetDisplay.textContent = gameState.target;
        targetContainer.classList.remove('hidden');
        commentary.textContent += ` Target: ${gameState.target}`;
    }

    updateUI();
}

function handleMove(playerMove) {
    if (!gameState.isPlaying) return;

    const botMove = Math.floor(Math.random() * 6) + 1;
    gameState.balls++;

    // Update Visuals
    userHand.textContent = handIcons[playerMove];
    botHand.textContent = handIcons[botMove];

    // Animation
    userHand.parentElement.classList.add('shake');
    botHand.parentElement.classList.add('shake');
    setTimeout(() => {
        userHand.parentElement.classList.remove('shake');
        botHand.parentElement.classList.remove('shake');
    }, 500);

    // Logic
    let isOut = false;
    if (gameState.innings === 1) {
        // Player Batting
        if (playerMove === botMove) {
            isOut = true;

            if (gameState.target !== null && gameState.playerScore < gameState.target - 1) {
                triggerAnimation('loss');
            } else {
                triggerAnimation('out');
            }

            commentary.textContent = `OUT! You scored ${gameState.playerScore}.`;

            if (gameState.target === null) {
                // End of 1st innings
                gameState.target = gameState.playerScore + 1;
                setTimeout(() => startInnings(2), 2000);
            } else {
                // End of 2nd innings
                checkWinCondition();
            }
        } else {
            const oldScore = gameState.playerScore;
            gameState.playerScore += playerMove;
            commentary.textContent = `You hit ${playerMove} runs!`;

            // Check Milestone
            checkMilestone(oldScore, gameState.playerScore);

            // Check if Player chased target (if batting second)
            if (gameState.target !== null && gameState.playerScore >= gameState.target) {
                triggerAnimation('win');
                gameState.isPlaying = false;
                setTimeout(() => showGameOver('win'), 1000);
            }
        }
    } else {
        // Player Bowling (Bot Batting)
        if (playerMove === botMove) {
            isOut = true;

            if (gameState.target !== null && gameState.botScore < gameState.target - 1) {
                triggerAnimation('win');
            } else {
                triggerAnimation('out');
            }

            commentary.textContent = `WICKET! Bot is OUT!`;

            if (gameState.target === null) {
                // End of 1st innings
                gameState.target = gameState.botScore + 1;
                setTimeout(() => startInnings(1), 2000);
            } else {
                // End of 2nd innings
                checkWinCondition();
            }
        } else {
            gameState.botScore += botMove;
            commentary.textContent = `Bot hits ${botMove} runs.`;

            // Check if Bot chased target
            if (gameState.target !== null && gameState.botScore >= gameState.target) {
                triggerAnimation('loss');
                gameState.isPlaying = false;
                setTimeout(() => showGameOver('loss'), 1000);
            }
        }
    }

    updateUI();
}

function checkWinCondition() {
    gameState.isPlaying = false;

    let playerTotal = gameState.playerScore;
    let botTotal = gameState.botScore;

    if (playerTotal > botTotal) {
        // Animation already triggered if bot got out
        setTimeout(() => showGameOver('win'), 1000);
    } else if (botTotal > playerTotal) {
        // Animation already triggered if player got out
        setTimeout(() => showGameOver('loss'), 1000);
    } else {
        // Tie
        setTimeout(() => showGameOver('tie'), 1000);
    }
}

function checkMilestone(oldScore, newScore) {
    // Check for 50
    if (oldScore < 50 && newScore >= 50) {
        triggerMilestone(50);
        return;
    }

    // Check for multiples of 100 (100, 200, 300, ...)
    const oldHundreds = Math.floor(oldScore / 100);
    const newHundreds = Math.floor(newScore / 100);

    if (newHundreds > oldHundreds) {
        triggerMilestone(newHundreds * 100);
    }
}

function triggerMilestone(score) {
    // Visual
    const milestoneOverlay = document.getElementById('milestone-overlay');
    const milestoneText = document.getElementById('milestone-text');

    milestoneText.textContent = `${score}!`;
    milestoneOverlay.classList.add('show');
    milestoneText.classList.add('show');

    // Audio
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`${score} Runs! What a performance!`);
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }

    // Hide after delay
    setTimeout(() => {
        milestoneOverlay.classList.remove('show');
        milestoneText.classList.remove('show');
    }, 2500);
}

function triggerAnimation(type) {
    animationOverlay.classList.remove('hidden');
    animationContent.innerHTML = '';
    animationContent.className = 'animation-content'; // Reset classes

    if (type === 'out') {
        animationContent.textContent = 'OUT!';
        animationContent.classList.add('anim-out');
    } else if (type === 'win') {
        animationContent.textContent = 'VICTORY!';
        animationContent.classList.add('anim-win');
    } else if (type === 'loss') {
        animationContent.textContent = 'YOU LOSE!';
        animationContent.classList.add('anim-loss');
    }

    setTimeout(() => {
        animationOverlay.classList.add('hidden');
        animationContent.classList.remove('anim-out', 'anim-win', 'anim-loss');
    }, 2000);
}

function updateUI() {
    const isChasing = gameState.innings !== gameState.firstBattingSide;

    if (gameState.innings === 1) {
        // Player Batting
        if (gameState.target !== null && isChasing) {
            scoreDisplay.textContent = `${gameState.playerScore}/${gameState.target}`;
        } else {
            scoreDisplay.textContent = `${gameState.playerScore}`;
        }
    } else {
        // Bot Batting
        if (gameState.target !== null && isChasing) {
            scoreDisplay.textContent = `${gameState.botScore}/${gameState.target}`;
        } else {
            scoreDisplay.textContent = `${gameState.botScore}`;
        }
    }

    if (gameState.isSuperOver) {
        document.querySelector('.game-header').classList.add('super-over-header');
    } else {
        document.querySelector('.game-header').classList.remove('super-over-header');
    }
}

async function updateHighScore(score) {
    if (!currentUser) return;

    try {
        const res = await fetch(`${API_URL}/update-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                score: score
            })
        });

        const data = await res.json();
        if (res.ok && data.newHighScore > (currentUser.highest_score || 0)) {
            currentUser.highest_score = data.newHighScore;
            if (highScoreDisplay) highScoreDisplay.textContent = currentUser.highest_score;
        }
    } catch (err) {
        console.error('Failed to update score:', err);
    }
}

function showGameOver(result) {
    const title = document.getElementById('game-result-title');
    const message = document.getElementById('game-result-message');
    const restartBtn = document.getElementById('restart-btn');

    // Update high score if player batted
    updateHighScore(gameState.playerScore);

    if (result === 'win') {
        title.textContent = gameState.isSuperOver ? "Super Over Won! 🎉" : "You Won! 🎉";
        message.textContent = "Great Game!";
        restartBtn.textContent = "Play Again";
        restartBtn.onclick = (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
            initToss();
        };
    } else if (result === 'loss') {
        title.textContent = gameState.isSuperOver ? "Super Over Lost 🤖" : "Bot Won 🤖";
        message.textContent = "Better luck next time.";
        restartBtn.textContent = "Play Again";
        restartBtn.onclick = (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
            initToss();
        };
    } else if (result === 'tie') {
        title.textContent = "It's a Tie!";
        message.textContent = "Scores are level. Time for a Super Over!";
        restartBtn.textContent = "Start Super Over";
        restartBtn.onclick = (e) => {
            e.preventDefault();
            modal.classList.add('hidden');
            // Start Super Over - Player Bats First
            startGame(1, true);
        };
    }

    modal.classList.remove('hidden');
}

// Start
init();
