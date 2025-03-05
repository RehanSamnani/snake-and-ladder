const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cors = require('cors');
const path = require('path');
const GameState = require('./src/gameLogic');
const questions = require('./src/questions');

// Middleware
app.use(cors());
app.use(express.static('public'));

// Initialize game state
const gameState = new GameState();

// Routes
app.get('/', (req, res) => {
    res.redirect('/player');
});

app.get('/player', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle player joining
    socket.on('join-game', (playerName) => {
        if (Object.keys(gameState.players).length >= 4) {
            socket.emit('game-full');
            return;
        }

        gameState.players[socket.id] = {
            id: socket.id,
            name: playerName,
            position: 1,
            color: getNextColor(Object.keys(gameState.players).length),
            isActive: false
        };

        // Start game if we have 2-4 players
        if (Object.keys(gameState.players).length >= 2 && !gameState.gameStarted) {
            gameState.gameStarted = true;
            gameState.currentTurn = Object.keys(gameState.players)[0];
            gameState.players[gameState.currentTurn].isActive = true;
        }

        // Broadcast updated game state
        io.emit('game-state-update', gameState);
        socket.emit('player-initialized', gameState.players[socket.id]);
    });

    // Handle dice roll
    socket.on('roll-dice', () => {
        if (socket.id === gameState.currentTurn) {
            const roll = Math.floor(Math.random() * 6) + 1;
            const player = gameState.players[socket.id];
            const newPosition = Math.min(player.position + roll, gameState.boardSize);

            // Emit dice roll event
            io.emit('dice-rolled', {
                playerId: socket.id,
                roll: roll,
                oldPosition: player.position,
                newPosition: newPosition
            });

            // Check for question
            if (newPosition !== gameState.boardSize) {
                const question = getRandomQuestion();
                gameState.questions[socket.id] = question;
                socket.emit('show-question', {
                    question: question,
                    position: newPosition,
                    isSnake: gameState.snakesAndLadders[newPosition] < newPosition,
                    isLadder: gameState.snakesAndLadders[newPosition] > newPosition
                });
            } else {
                // Player won
                io.emit('game-won', {
                    player: player,
                    position: newPosition
                });
            }
        }
    });

    // Handle answer submission
    socket.on('submit-answer', (data) => {
        const player = gameState.players[socket.id];
        const question = gameState.questions[socket.id];
        const isCorrect = validateAnswer(data.answer, question);
        
        if (isCorrect) {
            // Handle correct answer
            if (data.isLadder) {
                player.position = gameState.snakesAndLadders[data.position];
            } else {
                player.position = data.position;
            }
        } else if (data.isSnake) {
            // Snake penalty for wrong answer
            player.position = gameState.snakesAndLadders[data.position];
        }

        // Move to next player
        nextTurn();
        io.emit('game-state-update', gameState);
    });

    // Handle skip turn
    socket.on('skip-turn', () => {
        if (socket.id === gameState.currentTurn) {
            nextTurn();
            io.emit('game-state-update', gameState);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (gameState.players[socket.id]) {
            delete gameState.players[socket.id];
            if (gameState.currentTurn === socket.id) {
                nextTurn();
            }
            io.emit('game-state-update', gameState);
        }
    });
});

// Helper functions
function getNextColor(index) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    return colors[index % colors.length];
}

function nextTurn() {
    const playerIds = Object.keys(gameState.players);
    if (playerIds.length === 0) return;

    const currentIndex = playerIds.indexOf(gameState.currentTurn);
    gameState.players[gameState.currentTurn].isActive = false;
    
    const nextIndex = (currentIndex + 1) % playerIds.length;
    gameState.currentTurn = playerIds[nextIndex];
    gameState.players[gameState.currentTurn].isActive = true;
}

function validateAnswer(answer, question) {
    // Implement answer validation logic
    return true; // Temporary
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 