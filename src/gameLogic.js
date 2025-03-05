class GameState {
    constructor() {
        this.players = {};
        this.currentTurn = null;
        this.boardSize = 100;
        this.snakesAndLadders = {
            // Ladders
            4: 25,
            13: 46,
            33: 49,
            42: 63,
            50: 69,
            62: 81,
            74: 92,
            // Snakes
            99: 41,
            89: 53,
            76: 58,
            66: 45,
            54: 31,
            43: 18,
            27: 5
        };
        this.questions = [];
        this.gameStarted = false;
    }

    getNextColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        return colors[index % colors.length];
    }

    addPlayer(socketId, playerName) {
        if (Object.keys(this.players).length >= 4) {
            return false;
        }

        this.players[socketId] = {
            id: socketId,
            name: playerName,
            position: 1,
            color: this.getNextColor(Object.keys(this.players).length),
            isActive: false
        };

        if (Object.keys(this.players).length >= 2 && !this.gameStarted) {
            this.gameStarted = true;
            this.currentTurn = Object.keys(this.players)[0];
            this.players[this.currentTurn].isActive = true;
        }

        return true;
    }

    nextTurn() {
        const playerIds = Object.keys(this.players);
        if (playerIds.length === 0) return;

        const currentIndex = playerIds.indexOf(this.currentTurn);
        this.players[this.currentTurn].isActive = false;
        
        const nextIndex = (currentIndex + 1) % playerIds.length;
        this.currentTurn = playerIds[nextIndex];
        this.players[this.currentTurn].isActive = true;
    }
}

module.exports = GameState; 