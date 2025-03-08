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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io/client-dist')));

// Serve game.js and questions.js from root directory
app.get('/game.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.js'));
});

app.get('/questions.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'questions.js'));
});

// Initialize game state
const gameState = new GameState();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle player joining
    socket.on('join-game', (playerName) => {
        if (!playerName || typeof playerName !== 'string') {
            socket.emit('error', { message: 'Invalid player name' });
            return;
        }

        const success = gameState.addPlayer(socket.id, playerName);
        if (!success) {
            socket.emit('error', { message: 'Game is full or already started' });
            return;
        }

        // Broadcast updated game state
        io.emit('game-state-update', {
            players: gameState.players,
            currentTurn: gameState.currentTurn,
            gameStatus: gameState.gameStatus
        });
        
        socket.emit('player-initialized', gameState.players[socket.id]);
    });

    // Handle dice roll
    socket.on('roll-dice', () => {
        if (!gameState.isValidTurn(socket.id)) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        const roll = Math.floor(Math.random() * 6) + 1;
        const player = gameState.players[socket.id];
        const oldPosition = player.position;
        const newPosition = Math.min(oldPosition + roll, gameState.boardSize);

        // Update player position
        const hasWon = gameState.movePlayer(socket.id, newPosition);

        // Emit dice roll event
        io.emit('dice-rolled', {
            playerId: socket.id,
            roll: roll,
            oldPosition: oldPosition,
            newPosition: gameState.players[socket.id].position
        });

        if (hasWon) {
            io.emit('game-won', {
                player: player,
                finalPosition: gameState.players[socket.id].position
            });
            return;
        }

        // Get random question
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        const questionData = {
            ...randomQuestion,
            isSnake: gameState.snakesAndLadders[newPosition] < newPosition,
            isLadder: gameState.snakesAndLadders[newPosition] > newPosition,
            timeLimit: gameState.questionTimeout
        };
        
        gameState.setQuestion(socket.id, questionData);

        // Send question to player
        socket.emit('show-question', questionData);
    });

    // Handle answer submission
    socket.on('submit-answer', (data) => {
        if (!gameState.isValidTurn(socket.id)) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        if (gameState.hasQuestionTimedOut(socket.id)) {
            socket.emit('error', { message: 'Question time limit exceeded' });
            gameState.nextTurn();
            io.emit('game-state-update', {
                players: gameState.players,
                currentTurn: gameState.currentTurn,
                gameStatus: gameState.gameStatus
            });
            return;
        }

        const player = gameState.players[socket.id];
        const question = gameState.questions[socket.id];
        
        if (!question) {
            socket.emit('error', { message: 'No active question' });
            return;
        }

        const isCorrect = validateAnswer(data.answer, question);
        
        if (isCorrect) {
            // Award points
            gameState.updateScore(socket.id, question.points || 10);
            
            // Handle ladder movement
            if (data.isLadder) {
                gameState.movePlayer(socket.id, gameState.snakesAndLadders[data.position]);
            }
        } else if (data.isSnake) {
            // Snake penalty for wrong answer
            gameState.movePlayer(socket.id, gameState.snakesAndLadders[data.position]);
        }

        // Move to next player
        gameState.nextTurn();
        
        // Broadcast updated state
        io.emit('game-state-update', {
            players: gameState.players,
            currentTurn: gameState.currentTurn,
            gameStatus: gameState.gameStatus
        });

        // Send answer result to player
        socket.emit('answer-result', {
            correct: isCorrect,
            points: isCorrect ? (question.points || 10) : 0,
            newPosition: gameState.players[socket.id].position
        });
    });

    // Handle skip turn
    socket.on('skip-turn', () => {
        if (!gameState.isValidTurn(socket.id)) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        gameState.nextTurn();
        io.emit('game-state-update', {
            players: gameState.players,
            currentTurn: gameState.currentTurn,
            gameStatus: gameState.gameStatus
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (gameState.players[socket.id]) {
            delete gameState.players[socket.id];
            
            if (gameState.currentTurn === socket.id) {
                gameState.nextTurn();
            }

            // If not enough players, end game
            if (Object.keys(gameState.players).length < 2) {
                gameState.gameStatus = 'waiting';
                gameState.gameStarted = false;
            }

            io.emit('game-state-update', {
                players: gameState.players,
                currentTurn: gameState.currentTurn,
                gameStatus: gameState.gameStatus
            });
        }
    });
});

function validateAnswer(answer, question) {
    if (!answer || !question || !question.solutions || !answer.language) {
        return false;
    }
    
    try {
        const solution = question.solutions[answer.language];
        if (!solution) return false;

        // Remove whitespace and comments for comparison
        const normalizedAnswer = answer.code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const normalizedSolution = solution.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
            
        return normalizedAnswer === normalizedSolution;
    } catch (error) {
        console.error('Error validating answer:', error);
        return false;
    }
}

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 