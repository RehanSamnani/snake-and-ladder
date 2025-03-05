class GameDashboard {
    constructor() {
        this.socket = io();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('game-state-update', (gameState) => {
            this.updateDashboard(gameState);
        });

        this.socket.on('dice-rolled', (data) => {
            this.addGameLog(`${gameState.players[data.playerId].name} rolled ${data.roll}`);
        });

        this.socket.on('game-won', (data) => {
            this.showWinner(data.player);
        });
    }

    updateDashboard(gameState) {
        this.updateBoard(gameState);
        this.updatePlayers(gameState.players);
        this.updateCurrentTurn(gameState.currentTurn);
    }

    // ... rest of the methods for UI updates ...
}

// Initialize dashboard when page loads
new GameDashboard(); 