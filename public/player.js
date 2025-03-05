class PlayerGame {
    constructor() {
        this.socket = io();
        this.playerInfo = null;
        this.setupSocketListeners();
        this.setupEventListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            const playerName = prompt('Enter your name:');
            this.socket.emit('join-game', playerName);
        });

        this.socket.on('game-full', () => {
            alert('Game is full! Please try again later.');
        });

        this.socket.on('player-initialized', (playerInfo) => {
            this.playerInfo = playerInfo;
            this.updatePlayerInfo();
        });

        this.socket.on('game-state-update', (gameState) => {
            this.updateGameState(gameState);
        });

        this.socket.on('show-question', (data) => {
            this.showQuestion(data);
        });

        this.socket.on('dice-rolled', (data) => {
            if (data.playerId === this.socket.id) {
                this.animateDiceRoll(data.roll);
                this.animateMovement(data.oldPosition, data.newPosition);
            }
        });
    }

    setupEventListeners() {
        document.getElementById('roll-dice').addEventListener('click', () => {
            this.socket.emit('roll-dice');
        });

        document.getElementById('submit-answer').addEventListener('click', () => {
            const answer = document.getElementById('code-input').value;
            this.socket.emit('submit-answer', { answer });
        });
    }

    // ... rest of the methods for UI updates ...
}

// Initialize game when page loads
new PlayerGame(); 