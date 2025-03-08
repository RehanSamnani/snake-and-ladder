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
                cell.setAttribute('data-cell-number', i);
                
                if (this.snakesAndLadders[i]) {
                    const isLadder = this.snakesAndLadders[i] > i;
                    cell.classList.add(isLadder ? 'ladder' : 'snake');
                    cell.setAttribute('data-target', this.snakesAndLadders[i]);
                }
                
                cell.textContent = i;
                board.appendChild(cell);
            }
            
            // Add visual snakes and ladders
            this.drawSnakesAndLadders(board);
            
            playerView.appendChild(board);
            playerViews.appendChild(playerView);
        });

        // Show first player's view
        if (this.players.length > 0) {
            this.switchToPlayerView(this.players[0]);
        }
    }
    
    // Draw visual snakes and ladders on the board
    drawSnakesAndLadders(board) {
        const boardRect = board.getBoundingClientRect();
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        
        // Process all snakes and ladders
        for (const [startPos, endPos] of Object.entries(this.snakesAndLadders)) {
            const start = parseInt(startPos);
            const end = parseInt(endPos);
            
            // Skip if invalid
            if (isNaN(start) || isNaN(end)) continue;
            
            const startCell = board.children[this.boardSize - start];
            const endCell = board.children[this.boardSize - end];
            
            if (!startCell || !endCell) continue;
            
            const startRect = startCell.getBoundingClientRect();
            const endRect = endCell.getBoundingClientRect();
            
            // Calculate relative positions
            const startX = startRect.left - boardRect.left + startRect.width / 2;
            const startY = startRect.top - boardRect.top + startRect.height / 2;
            const endX = endRect.left - boardRect.left + endRect.width / 2;
            const endY = endRect.top - boardRect.top + endRect.height / 2;
            
            // Create path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            if (start < end) {
                // It's a ladder
                path.setAttribute('class', 'ladder-path');
                
                // Create a curved path for the ladder
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                const controlX = midX + (Math.random() * 40 - 20);
                const controlY = midY + (Math.random() * 40 - 20);
                
                path.setAttribute('d', `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`);
                
                // Add ladder rungs
                const steps = 5;
                for (let i = 0; i < steps; i++) {
                    const t = i / (steps - 1);
                    const x1 = startX * (1 - t) + endX * t - 5;
                    const y1 = startY * (1 - t) + endY * t - 5;
                    const x2 = startX * (1 - t) + endX * t + 5;
                    const y2 = startY * (1 - t) + endY * t + 5;
                    
                    const rung = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    rung.setAttribute('x1', x1);
                    rung.setAttribute('y1', y1);
                    rung.setAttribute('x2', x2);
                    rung.setAttribute('y2', y2);
                    rung.setAttribute('stroke', 'rgba(6, 214, 160, 0.7)');
                    rung.setAttribute('stroke-width', '4');
                    svg.appendChild(rung);
                }
            } else {
                // It's a snake
                path.setAttribute('class', 'snake-path');
                
                // Create a wavy path for the snake
                const dx = endX - startX;
                const dy = endY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const waves = Math.ceil(distance / 50); // One wave per 50px
                
                let pathData = `M ${startX} ${startY}`;
                
                for (let i = 1; i <= waves * 2; i++) {
                    const t = i / (waves * 2);
                    const x = startX + dx * t;
                    const y = startY + dy * t;
                    
                    // Add some waviness
                    const offset = 20 * Math.sin(i * Math.PI);
                    const angle = Math.atan2(dy, dx) + Math.PI / 2;
                    const offsetX = offset * Math.cos(angle);
                    const offsetY = offset * Math.sin(angle);
                    
                    pathData += ` L ${x + offsetX} ${y + offsetY}`;
                }
                
                path.setAttribute('d', pathData);
                
                // Add snake head
                const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                head.setAttribute('cx', endX);
                head.setAttribute('cy', endY);
                head.setAttribute('r', '6');
                head.setAttribute('fill', 'rgba(239, 71, 111, 0.9)');
                svg.appendChild(head);
            }
            
            svg.appendChild(path);
        }
        
        board.appendChild(svg);
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
                
                // Add player name to piece
                piece.setAttribute('title', currentPlayer.name);
                
                cell.appendChild(piece);
            }
        });
    }

    movePlayer(player, fromPosition, toPosition, isSnakeOrLadder = false) {
        const board = document.getElementById(`game-board-${player.name}`);
        if (!board) return;
        
        const cells = board.querySelectorAll('.cell');
        
        // Get the current piece
        const fromCell = cells[this.boardSize - fromPosition];
        if (!fromCell) return;
        
        const piece = fromCell.querySelector('.player-piece');
        if (!piece) return;
        
        // Add moving class for animation
        piece.classList.add('moving');
        
        // Move the piece
        setTimeout(() => {
            fromCell.removeChild(piece);
            
            const toCell = cells[this.boardSize - toPosition];
            if (toCell) {
                toCell.appendChild(piece);
                
                // If it's a snake or ladder, add special animation
                if (isSnakeOrLadder) {
                    piece.classList.add(toPosition > fromPosition ? 'ladder-move' : 'snake-move');
                    
                    // Remove the special class after animation completes
                    setTimeout(() => {
                        piece.classList.remove('ladder-move', 'snake-move');
                    }, 1000);
                }
                
                // Remove moving class after animation completes
                setTimeout(() => {
                    piece.classList.remove('moving');
                }, 500);
            }
        }, 100);
    }

    rollDice() {
        if (this.players.length === 0 || this.skipTimer[this.players[this.currentPlayerIndex].name]) return;
        
        const dice = document.getElementById('dice');
        if (!dice) return;
        
        // Disable roll button during animation
        const rollButton = document.getElementById('roll-button');
        if (rollButton) rollButton.disabled = true;
        
        // Add rolling animation
        dice.classList.add('rolling');
        
        // Generate random number after a delay
        setTimeout(() => {
            const diceValue = Math.floor(Math.random() * 6) + 1;
            this.lastRoll = diceValue;
            
            // Update dice face
            dice.textContent = diceValue;
            dice.classList.remove('rolling');
            
            // Move player
            const currentPlayer = this.players[this.currentPlayerIndex];
            const oldPosition = currentPlayer.position;
            const newPosition = Math.min(currentPlayer.position + diceValue, this.boardSize);
            
            // Update player position
            currentPlayer.position = newPosition;
            
            // Animate player movement
            this.movePlayer(currentPlayer, oldPosition, newPosition);
            
            // Check for win
            if (newPosition === this.boardSize) {
                this.handleWin(currentPlayer);
                return;
            }
            
            // Check for snake or ladder
            setTimeout(() => {
                const isSnake = this.snakesAndLadders[newPosition] < newPosition;
                const isLadder = this.snakesAndLadders[newPosition] > newPosition;
                
                if (isSnake || isLadder) {
                    const finalPosition = this.snakesAndLadders[newPosition];
                    
                    // Show message
                    const message = isLadder ? 
                        `${currentPlayer.name} climbed a ladder from ${newPosition} to ${finalPosition}!` : 
                        `${currentPlayer.name} slid down a snake from ${newPosition} to ${finalPosition}!`;
                    
                    this.showMessage(message);
                    
                    // Animate snake/ladder movement
                    setTimeout(() => {
                        // Update player position
                        const oldPos = currentPlayer.position;
                        currentPlayer.position = finalPosition;
                        
                        // Animate the movement
                        this.movePlayer(currentPlayer, oldPos, finalPosition, true);
                        
                        // Check for win again
                        if (finalPosition === this.boardSize) {
                            this.handleWin(currentPlayer);
                            return;
                        }
                        
                        // Show question after snake/ladder movement
                        setTimeout(() => {
                            this.showQuestion(currentPlayer);
                        }, 1000);
                    }, 1000);
                } else {
                    // Show question immediately if no snake/ladder
                    this.showQuestion(currentPlayer);
                }
            }, 1000);
            
            // Re-enable roll button
            if (rollButton) rollButton.disabled = false;
            
            // Update dashboard
            this.updateDashboard();
        }, 1000);
    }
    
    // Show message to the player
    showMessage(message, duration = 3000) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            // Create message container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'message-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.zIndex = '1000';
            container.style.textAlign = 'center';
            document.body.appendChild(container);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        // Add to DOM
        const container = document.getElementById('message-container');
        container.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            if (container.contains(messageElement)) {
                container.removeChild(messageElement);
            }
        }, duration);
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
        
        // Setup run tests button
        const runTestsButton = document.getElementById('run-tests');
        runTestsButton.onclick = () => {
            this.runTests(currentQuestion);
        };
        
        // Setup submit button event listener
        const submitButton = document.getElementById('submit-answer');
        submitButton.onclick = () => {
            const result = this.checkAnswer(currentQuestion);
            
            // Add visual feedback
            if (result) {
                submitButton.classList.add('success-animation');
                setTimeout(() => submitButton.classList.remove('success-animation'), 1000);
                
                clearInterval(this.questionTimer);
                
                // Show success message with animation
                const testResults = document.getElementById('test-results');
                testResults.innerHTML = '<div class="test-case-result pass">All tests passed! Moving to next turn...</div>';
                
                setTimeout(() => {
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
                }, 1500);
            } else {
                // Wrong answer animation
                submitButton.classList.add('error-animation');
                setTimeout(() => submitButton.classList.remove('error-animation'), 1000);
                
                // Wrong answer
                if (isSnake) {
                    // Snake eats on wrong answer
                    const snakeEnd = this.snakesAndLadders[newPosition];
                    
                    // Show error message with animation
                    const testResults = document.getElementById('test-results');
                    testResults.innerHTML = '<div class="test-case-result fail">Tests failed! Snake penalty applied...</div>';
                    
                    setTimeout(() => {
                        modal.style.display = 'none';
                        alert(`Wrong answer! Snake ate ${currentPlayer.name}!`);
                        currentPlayer.position = snakeEnd;
                        this.updateBoard(currentPlayer);
                        this.nextPlayer();
                    }, 1500);
                } else {
                    // Show error message but allow retry if not on snake
                    const testResults = document.getElementById('test-results');
                    testResults.innerHTML = '<div class="test-case-result fail">Tests failed! Try again...</div>';
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
        
        // Setup language change handler
        document.getElementById('language-select').onchange = (e) => {
            const newLanguage = e.target.value;
            document.getElementById('code-input').value = currentQuestion.templates[newLanguage];
        };
        
        // Setup reset code button
        document.getElementById('reset-code').onclick = () => {
            const currentLanguage = document.getElementById('language-select').value;
            document.getElementById('code-input').value = currentQuestion.templates[currentLanguage];
            document.getElementById('test-results').innerHTML = '';
        };
    }

    runTests(question) {
        if (!question) return;
        
        const code = document.getElementById('code-input').value;
        const language = document.getElementById('language-select').value;
        const testResults = document.getElementById('test-results');
        
        // Clear previous results
        testResults.innerHTML = '';
        
        // Simulate test execution
        let allPassed = true;
        const results = question.testCases.map((test, index) => {
            // Simulate test execution with a random result for demo purposes
            // In a real implementation, you would actually execute the code against the test cases
            const isPassing = this.simulateTestExecution(code, test, language, question);
            allPassed = allPassed && isPassing;
            
            return `
                <div class="test-case-result ${isPassing ? 'pass' : 'fail'}">
                    Test Case ${index + 1}: ${isPassing ? 'PASS' : 'FAIL'}
                    <div class="test-details">
                        Input: ${JSON.stringify(test.input)}
                        Expected: ${JSON.stringify(test.expected)}
                        ${!isPassing ? `<div class="error-message">Output does not match expected result</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        // Add animation to run tests button
        const runTestsButton = document.getElementById('run-tests');
        runTestsButton.classList.add(allPassed ? 'success-animation' : 'error-animation');
        setTimeout(() => runTestsButton.classList.remove(allPassed ? 'success-animation' : 'error-animation'), 1000);
        
        // Display results
        testResults.innerHTML = results.join('');
        
        // Enable/disable submit button based on test results
        const submitButton = document.getElementById('submit-answer');
        submitButton.disabled = !allPassed;
    }
    
    simulateTestExecution(code, test, language, question) {
        // This is a simplified simulation
        // In a real implementation, you would actually execute the code
        
        try {
            // For demo purposes, we'll compare with the solution
            // In a real implementation, you would execute the code and compare the output
            const normalizedCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const normalizedSolution = question.solutions[language]
                .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            // For demo, we'll say it passes if the code is close enough to the solution
            // This is just for demonstration - real implementation would actually run the code
            const similarity = this.calculateSimilarity(normalizedCode, normalizedSolution);
            return similarity > 0.7; // Arbitrary threshold for demo
        } catch (error) {
            console.error('Error simulating test execution:', error);
            return false;
        }
    }
    
    calculateSimilarity(str1, str2) {
        // Simple similarity calculation for demo purposes
        // In a real implementation, you would use a more sophisticated approach
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }
    
    editDistance(s1, s2) {
        // Levenshtein distance calculation
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) {
                costs[s2.length] = lastValue;
            }
        }
        return costs[s2.length];
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