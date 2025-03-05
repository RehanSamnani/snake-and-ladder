class PlayerGame {
    constructor() {
        this.socket = io();
        this.playerInfo = null;
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            // Join game with player name
            const playerName = prompt('Enter your name:');
            this.socket.emit('join-game', playerName);
        });

        this.socket.on('game-state', (state) => {
            this.updateGameState(state);
        });

        this.socket.on('your-turn', () => {
            document.getElementById('roll-dice').disabled = false;
        });

        // ... other event listeners ...
    }

    rollDice() {
        this.socket.emit('roll-dice');
    }

    submitAnswer(answer) {
        this.socket.emit('submit-answer', answer);
    }

    updateGameState(state) {
        // Update local game display
        this.updateBoard(state.position);
        this.updatePlayerInfo(state);
    }
} 