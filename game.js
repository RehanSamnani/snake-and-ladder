class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.position = 1;
        this.isActive = false;
    }
}

class Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.boardSize = 100;
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
            '#E67E22', '#2ECC71'
        ];
        this.snakesAndLadders = {
            // Ladders (start: end)
            4: 25,
            13: 46,
            33: 49,
            42: 63,
            50: 69,
            62: 81,
            74: 92,
            // Snakes (start: end)
            99: 41,
            89: 53,
            76: 58,
            66: 45,
            54: 31,
            43: 18,
            27: 5
        };
        this.questionTimer = null;
        this.skipTimer = {};
        this.questionTimeLimit = 180;
        this.skipTimeLimit = 240;
        this.lastRoll = 0;
        this.currentViewPlayer = null;
        this.currentQuestion = null;
        
        this.setupStartScreen();
    }

    setupStartScreen() {
        const startScreen = document.getElementById('start-screen');
        const startButton = document.getElementById('start-game');
        const addPlayerBtn = document.getElementById('add-player');
        const playerNameInput = document.getElementById('player-name');
        const registeredPlayers = document.getElementById('registered-players');

        addPlayerBtn.onclick = () => {
            const name = playerNameInput.value.trim();
            if (name && this.players.length < 4) {
                const color = this.colors[this.players.length];
                const player = new Player(name, color);
                this.players.push(player);
                
                const playerElement = document.createElement('div');
                playerElement.className = 'registered-player';
                playerElement.innerHTML = `
                    <div class="player-marker" style="background-color: ${color}"></div>
                    <span>${name}</span>
                `;
                registeredPlayers.appendChild(playerElement);
                
                playerNameInput.value = '';
                
                if (this.players.length >= 2) {
                    startButton.disabled = false;
                }
            }
        };

        startButton.onclick = () => {
            if (this.players.length >= 2) {
                startScreen.style.display = 'none';
                this.startGame();
            }
        };
    }

    startGame() {
        // Set first player as active
        this.players[0].isActive = true;
        
        // Setup event listeners
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        document.getElementById('close-modal').addEventListener('click', () => this.skipTurn());
        
        // Setup additional event listeners
        document.getElementById('run-tests').addEventListener('click', () => {
            const result = this.checkAnswer(this.currentQuestion);
            const resultDiv = document.getElementById('test-results');
            resultDiv.innerHTML = `
                <div class="test-case-result ${result ? 'pass' : 'fail'}">
                    ${result ? 'All tests passed!' : 'Tests failed. Try again!'}
                </div>
            `;
        });
        
        document.getElementById('reset-code').addEventListener('click', () => {
            const language = document.getElementById('language-select').value;
            document.getElementById('code-input').value = this.currentQuestion.templates[language];
        });
        
        this.setupLanguageSelect();
        
        // Initialize game board and views
        this.initializeGameBoard();
        this.updatePlayerViews();
        this.updateDashboard();
    }

    initializeGameBoard() {
        const playerViews = document.getElementById('player-views');
        if (!playerViews) return;
        
        playerViews.innerHTML = '';
        
        this.players.forEach(player => {
            const playerView = document.createElement('div');
            playerView.className = 'player-view';
            playerView.id = `player-view-${player.name}`;
            
            const board = document.createElement('div');
            board.className = 'game-board';
            board.id = `game-board-${player.name}`;
            
            // Create cells
            for (let i = this.boardSize; i >= 1; i--) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (this.snakesAndLadders[i]) {
                    const isLadder = this.snakesAndLadders[i] > i;
                    cell.classList.add(isLadder ? 'ladder' : 'snake');
                }
                
                cell.textContent = i;
                board.appendChild(cell);
            }
            
            playerView.appendChild(board);
            playerViews.appendChild(playerView);
        });

        // Show first player's view
        if (this.players.length > 0) {
            this.switchToPlayerView(this.players[0]);
        }
    }

    rollDice() {
        if (this.players.length === 0 || this.skipTimer[this.players[this.currentPlayerIndex].name]) return;
        
        const dice = document.getElementById('dice');
        const diceValue = Math.floor(Math.random() * 6) + 1;
        
        this.lastRoll = diceValue;
        
        // Add rolling animation
        dice.classList.add('rolling');
        
        // Calculate random rotations for each axis
        const rotations = {
            1: { x: 0, y: 0, z: 0 },
            2: { x: -90, y: 0, z: 0 },
            3: { x: 0, y: -90, z: 0 },
            4: { x: 0, y: 90, z: 0 },
            5: { x: 90, y: 0, z: 0 },
            6: { x: 0, y: 180, z: 0 }
        };
        
        const extraSpins = {
            x: Math.floor(Math.random() * 2 + 2) * 360,
            y: Math.floor(Math.random() * 2 + 2) * 360,
            z: Math.floor(Math.random() * 2 + 2) * 360
        };
        
        const finalRotation = rotations[diceValue];
        
        dice.style.transform = `rotateX(${finalRotation.x + extraSpins.x}deg) 
                               rotateY(${finalRotation.y + extraSpins.y}deg) 
                               rotateZ(${finalRotation.z + extraSpins.z}deg)`;
        
        // Disable roll button during animation
        const rollButton = document.getElementById('roll-dice');
        rollButton.disabled = true;
        
        setTimeout(() => {
            dice.classList.remove('rolling');
            const diceValueEl = document.getElementById('dice-value');
            diceValueEl.textContent = `Rolled: ${diceValue}`;
            
            const currentPlayer = this.players[this.currentPlayerIndex];
            const newPosition = Math.min(currentPlayer.position + diceValue, this.boardSize);
            
            this.previewMovement(currentPlayer.position, newPosition, currentPlayer.color);
            
            setTimeout(() => {
                if (newPosition === this.boardSize) {
                    this.showWinner(currentPlayer);
                    return;
                }
                
                this.showQuestion(newPosition);
                rollButton.disabled = false;
            }, 1500);
        }, 2000);
    }

    previewMovement(start, end, color) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (!currentPlayer) return;
        
        const board = document.getElementById(`game-board-${currentPlayer.name}`);
        if (!board) return;
        
        const cells = board.querySelectorAll('.cell');
        const preview = document.createElement('div');
        preview.className = 'move-preview';
        preview.style.backgroundColor = color;
        document.body.appendChild(preview);
        
        // Highlight path
        for (let i = start; i <= end; i++) {
            const highlight = document.createElement('div');
            highlight.className = 'path-highlight';
            const cell = cells[this.boardSize - i];
            
            if (cell) {
                const rect = cell.getBoundingClientRect();
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
                highlight.style.left = `${rect.left}px`;
                highlight.style.top = `${rect.top}px`;
                document.body.appendChild(highlight);
                
                setTimeout(() => highlight.remove(), 1500);
            }
        }
        
        // Animate preview along the path
        const animatePreview = (position) => {
            if (position > end) {
                preview.remove();
                return;
            }
            
            const cell = cells[this.boardSize - position];
            if (cell) {
                const rect = cell.getBoundingClientRect();
                preview.style.left = `${rect.left + rect.width/2 - 10}px`;
                preview.style.top = `${rect.top + rect.height/2 - 10}px`;
                
                setTimeout(() => animatePreview(position + 1), 200);
            }
        };
        
        animatePreview(start);
    }

    showQuestion(newPosition) {
        const modal = document.getElementById('question-modal');
        const questionText = document.getElementById('question-text');
        const currentPlayer = this.players[this.currentPlayerIndex];
        const currentQuestion = questions[Math.floor(Math.random() * questions.length)];
        const isSnake = this.snakesAndLadders[newPosition] < newPosition;
        const isLadder = this.snakesAndLadders[newPosition] > newPosition;
        
        this.currentQuestion = currentQuestion;
        modal.style.display = 'block';
        
        // Update player info
        document.querySelector('.current-player-info').textContent = 
            `Current Player: ${currentPlayer.name}`;
        
        // Set question
        questionText.textContent = currentQuestion.question;
        
        // Set code template
        const language = document.getElementById('language-select').value;
        document.getElementById('code-input').value = currentQuestion.templates[language];
        
        // Show function preview
        const functionPreview = document.getElementById('function-preview');
        const testCase = currentQuestion.testCases[0];
        functionPreview.innerHTML = `
            <span class="function-call">${currentQuestion.functionName}</span>(
            <span class="parameter">${testCase.input.join(', ')}</span>) → 
            <span class="parameter">${testCase.expected}</span>
        `;
        
        // Display test cases
        const testCasesList = document.querySelector('.test-cases-list');
        testCasesList.innerHTML = currentQuestion.testCases.map(test => `
            <div class="test-case-item">
                Input: ${JSON.stringify(test.input)}
                Expected: ${JSON.stringify(test.expected)}
            </div>
        `).join('');
        
        // Start timer
        this.startQuestionTimer(newPosition, isSnake);
        
        // Setup submit button event listener
        const submitButton = document.getElementById('submit-answer');
        submitButton.onclick = () => {
            const result = this.checkAnswer(currentQuestion);
            if (result) {
                clearInterval(this.questionTimer);
                modal.style.display = 'none';
                
                if (isLadder) {
                    // Move up the ladder on correct answer
                    const ladderEnd = this.snakesAndLadders[newPosition];
                    alert(`Correct! ${currentPlayer.name} climbs the ladder to ${ladderEnd}!`);
                    currentPlayer.position = ladderEnd;
                } else if (isSnake) {
                    // Avoid snake on correct answer
                    alert(`Correct! ${currentPlayer.name} avoids the snake!`);
                    currentPlayer.position = newPosition;
                } else {
                    // Normal movement
                    currentPlayer.position = newPosition;
                }
                
                this.updateBoard(currentPlayer);
                this.nextPlayer();
            } else {
                // Wrong answer
                if (isSnake) {
                    // Snake eats on wrong answer
                    const snakeEnd = this.snakesAndLadders[newPosition];
                    alert(`Wrong answer! Snake ate ${currentPlayer.name}!`);
                    currentPlayer.position = snakeEnd;
                    modal.style.display = 'none';
                    this.updateBoard(currentPlayer);
                    this.nextPlayer();
                } else {
                    // Show error message but allow retry if not on snake
                    alert('Wrong answer! Try again!');
                }
            }
        };
        
        // Setup skip button
        document.getElementById('close-modal').onclick = () => {
            clearInterval(this.questionTimer);
            modal.style.display = 'none';
            this.startSkipTimer(currentPlayer);
            this.nextPlayer();
        };
    }

    checkAnswer(question) {
        if (!question) return false;
        
        const code = document.getElementById('code-input').value;
        const language = document.getElementById('language-select').value;
        
        try {
            // Remove whitespace and comments for comparison
            const normalizedCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            const normalizedSolution = question.solutions[language]
                .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            return normalizedCode === normalizedSolution;
        } catch (error) {
            console.error('Error checking answer:', error);
            return false;
        }
    }

    skipTurn() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        clearInterval(this.questionTimer);
        document.getElementById('question-modal').style.display = 'none';
        this.startSkipTimer(currentPlayer);
        this.nextPlayer();
    }

    movePlayer(newPosition) {
        const currentPlayer = this.players[this.currentPlayerIndex];
        currentPlayer.position = newPosition;
        
        if (this.snakesAndLadders[newPosition]) {
            const finalPosition = this.snakesAndLadders[newPosition];
            const isLadder = finalPosition > newPosition;
            
            setTimeout(() => {
                alert(`${isLadder ? 'Ladder!' : 'Snake!'} ${currentPlayer.name} moves from ${newPosition} to ${finalPosition}`);
                currentPlayer.position = finalPosition;
                this.updateBoard();
                this.nextPlayer();
            }, 500);
        } else {
            this.nextPlayer();
        }
        
        this.updateBoard();
        this.updateDashboard();
    }

    nextPlayer() {
        // Clear current player's active state
        this.players[this.currentPlayerIndex].isActive = false;
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Set new player as active
        this.players[this.currentPlayerIndex].isActive = true;
        
        // Update the view to show new player's board
        this.switchToPlayerView(this.players[this.currentPlayerIndex]);
        this.updateDashboard();
    }

    updateBoard(player = null) {
        // If no player specified, update all boards
        const playersToUpdate = player ? [player] : this.players;
        
        playersToUpdate.forEach(currentPlayer => {
            const board = document.getElementById(`game-board-${currentPlayer.name}`);
            if (!board) return;
            
            const cells = board.querySelectorAll('.cell');
            
            // Clear all pieces from this board
            cells.forEach(cell => {
                const pieces = cell.querySelectorAll('.player-piece');
                pieces.forEach(piece => piece.remove());
            });
            
            // Add player piece to their current position
            const cell = cells[this.boardSize - currentPlayer.position];
            if (cell) {
                const piece = document.createElement('div');
                piece.className = 'player-piece';
                piece.style.backgroundColor = currentPlayer.color;
                cell.appendChild(piece);
            }
        });
    }

    updateDashboard() {
        const currentTurn = document.getElementById('current-turn');
        const lastRoll = document.getElementById('last-roll');
        const leaderboard = document.getElementById('leaderboard-list');
        
        // Update current turn
        currentTurn.textContent = this.players[this.currentPlayerIndex].name;
        
        // Update last roll
        lastRoll.textContent = this.lastRoll || '-';
        
        // Update leaderboard
        leaderboard.innerHTML = this.players
            .map(player => `
                <div class="leaderboard-item">
                    <div class="player-info">
                        <div class="player-marker" style="background-color: ${player.color}"></div>
                        <span>${player.name}</span>
                    </div>
                    <div class="player-position">Position: ${player.position}</div>
                </div>
            `)
            .join('');
    }

    createPlayerView(player) {
        const view = document.createElement('div');
        view.className = 'player-view';
        view.id = `player-view-${player.name}`;
        
        const board = document.createElement('div');
        board.className = 'game-board';
        board.id = `game-board-${player.name}`;
        
        // Create cells
        for (let i = this.boardSize; i >= 1; i--) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (this.snakesAndLadders[i]) {
                const isLadder = this.snakesAndLadders[i] > i;
                cell.classList.add(isLadder ? 'ladder' : 'snake');
            }
            
            cell.textContent = i;
            board.appendChild(cell);
        }
        
        view.appendChild(board);
        return view;
    }

    updatePlayerViews() {
        const playerViews = document.getElementById('player-views');
        const switchControls = document.getElementById('player-switch-controls');
        
        if (!playerViews || !switchControls) return;
        
        playerViews.innerHTML = '';
        switchControls.innerHTML = '';
        
        this.players.forEach(player => {
            // Create player view
            const view = this.createPlayerView(player);
            playerViews.appendChild(view);
            
            // Create switch button
            const switchBtn = document.createElement('button');
            switchBtn.className = 'player-switch-btn';
            switchBtn.textContent = player.name;
            switchBtn.onclick = () => this.switchToPlayerView(player);
            switchControls.appendChild(switchBtn);
        });
        
        // Show first player's view by default
        if (this.players.length > 0) {
            this.switchToPlayerView(this.players[0]);
        }
    }

    switchToPlayerView(player) {
        if (!player) return;
        
        this.currentViewPlayer = player;
        
        // Update view visibility
        document.querySelectorAll('.player-view').forEach(view => {
            view.classList.remove('active');
        });
        
        const playerView = document.getElementById(`player-view-${player.name}`);
        if (playerView) {
            playerView.classList.add('active');
        }
        
        // Update switch buttons
        document.querySelectorAll('.player-switch-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === player.name);
        });
        
        // Update board
        this.updateBoard(player);
    }

    showWinner(player) {
        const winnerScreen = document.getElementById('winner-screen');
        const winnerDetails = document.getElementById('winner-details');
        const finalScores = document.getElementById('final-scores');
        
        winnerDetails.innerHTML = `
            <h3>${player.name} Wins!</h3>
            <p>Final Position: ${player.position}</p>
            <p>Score: ${this.scores[player.name] || 0}</p>
        `;
        
        const sortedPlayers = [...this.players].sort((a, b) => 
            (this.scores[b.name] || 0) - (this.scores[a.name] || 0)
        );
        
        finalScores.innerHTML = `
            <h3>Final Standings</h3>
            ${sortedPlayers.map((p, i) => `
                <div class="final-score-item">
                    ${i + 1}. ${p.name} - Score: ${this.scores[p.name] || 0}
                </div>
            `).join('')}
        `;
        
        winnerScreen.style.display = 'flex';
        this.createConfetti();
        
        document.getElementById('play-again').onclick = () => {
            window.location.reload();
        };
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    startQuestionTimer(newPosition, isSnake) {
        let timeLeft = this.questionTimeLimit;
        const timerDisplay = document.getElementById('question-timer');
        
        clearInterval(this.questionTimer);
        timerDisplay.style.display = 'block';
        timerDisplay.classList.remove('warning', 'danger');
        
        this.questionTimer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 30) {
                timerDisplay.classList.add('warning');
            }
            if (timeLeft <= 10) {
                timerDisplay.classList.add('danger');
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.questionTimer);
                const currentPlayer = this.players[this.currentPlayerIndex];
                
                if (isSnake) {
                    // Snake eats the player
                    const snakeEnd = this.snakesAndLadders[newPosition];
                    alert(`Time's up! Snake ate ${currentPlayer.name}!`);
                    currentPlayer.position = snakeEnd;
                    this.updateBoard();
                }
                
                document.getElementById('question-modal').style.display = 'none';
                this.nextPlayer();
            }
        }, 1000);
    }

    startSkipTimer(player) {
        this.skipTimer[player.name] = {
            timeLeft: this.skipTimeLimit,
            interval: setInterval(() => {
                this.skipTimer[player.name].timeLeft--;
                this.updateSkipTimer(player);
                
                if (this.skipTimer[player.name].timeLeft <= 0) {
                    clearInterval(this.skipTimer[player.name].interval);
                    delete this.skipTimer[player.name];
                    this.enableDiceRoll(player);
                }
            }, 1000)
        };
        this.disableDiceRoll(player);
    }

    updateSkipTimer(player) {
        const skipInfo = document.getElementById('skip-timer');
        if (skipInfo && this.skipTimer[player.name]) {
            const timeLeft = this.skipTimer[player.name].timeLeft;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            skipInfo.textContent = `Wait Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    disableDiceRoll(player) {
        const rollButton = document.getElementById('roll-dice');
        if (this.players[this.currentPlayerIndex].name === player.name) {
            rollButton.disabled = true;
        }
    }

    enableDiceRoll(player) {
        const rollButton = document.getElementById('roll-dice');
        if (this.players[this.currentPlayerIndex].name === player.name) {
            rollButton.disabled = false;
        }
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;
        
        playersList.innerHTML = this.players.map(player => `
            <div class="player-card ${player.isActive ? 'active' : ''}">
                <div class="player-marker" style="background-color: ${player.color}"></div>
                <span>${player.name}</span>
                ${this.skipTimer[player.name] ? 
                    `<div class="skip-timer">Wait: ${Math.ceil(this.skipTimer[player.name].timeLeft / 60)}m</div>` 
                    : ''}
            </div>
        `).join('');
    }

    // Add language change handler
    setupLanguageSelect() {
        const languageSelect = document.getElementById('language-select');
        languageSelect.onchange = () => {
            const language = languageSelect.value;
            const currentQuestion = this.currentQuestion;
            if (currentQuestion) {
                document.getElementById('code-input').value = currentQuestion.templates[language];
            }
        };
    }
}

// Initialize the game when the window loads
window.onload = () => {
    new Game();
}; 