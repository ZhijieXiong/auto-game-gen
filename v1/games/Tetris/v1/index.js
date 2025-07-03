class TetrisGame extends Phaser.Scene {
    constructor() {
        super({ key: 'TetrisGame' });
        this.GRID_WIDTH = 10;
        this.GRID_HEIGHT = 20;
        this.CELL_SIZE = 32;
        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropTimer = 0;
        this.dropInterval = 1000;
        this.gameOver = false;
        this.paused = false;
        
        this.tetrominoes = {
            I: { color: 0x00ffff, shapes: [[[1,1,1,1]], [[1],[1],[1],[1]]] },
            O: { color: 0xffff00, shapes: [[[1,1],[1,1]]] },
            T: { color: 0x800080, shapes: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]] },
            S: { color: 0x00ff00, shapes: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]] },
            Z: { color: 0xff0000, shapes: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]] },
            J: { color: 0x0000ff, shapes: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]] },
            L: { color: 0xffa500, shapes: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]] }
        };
    }
    
    preload() {
        this.load.image('grid-cell', './assets/images/grid-cell.png');
        this.load.image('filled-cell', './assets/images/filled-cell.png');
        this.load.image('game-border', './assets/images/game-border.png');
        this.load.image('next-preview-box', './assets/images/next-preview-box.png');
        this.load.image('game-over-overlay', './assets/images/game-over-overlay.png');
        this.load.image('pause-overlay', './assets/images/pause-overlay.png');
    }
    
    create() {
        this.initializeGrid();
        this.createUI();
        this.setupControls();
        this.spawnNewPiece();
        
        this.time.addEvent({
            delay: this.dropInterval,
            callback: this.dropPiece,
            callbackScope: this,
            loop: true
        });
    }
    
    initializeGrid() {
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                this.grid[y][x] = { filled: false, color: 0x000000 };
                
                const cellSprite = this.add.image(
                    x * this.CELL_SIZE + this.CELL_SIZE / 2 + 100,
                    y * this.CELL_SIZE + this.CELL_SIZE / 2 + 50,
                    'grid-cell'
                );
                cellSprite.setDisplaySize(this.CELL_SIZE, this.CELL_SIZE);
            }
        }
        
        const border = this.add.image(200, 370, 'game-border');
        border.setDisplaySize(this.GRID_WIDTH * this.CELL_SIZE + 20, this.GRID_HEIGHT * this.CELL_SIZE + 20);
    }
    
    createUI() {
        this.scoreText = this.add.text(450, 100, 'SCORE: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });
        
        this.levelText = this.add.text(450, 140, 'LEVEL: 1', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });
        
        this.linesText = this.add.text(450, 180, 'LINES: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });
        
        this.add.text(450, 250, 'NEXT:', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });
        
        const previewBox = this.add.image(500, 320, 'next-preview-box');
        previewBox.setDisplaySize(120, 120);
    }
    
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        this.input.keyboard.on('keydown-LEFT', () => this.movePiece(-1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => this.movePiece(1, 0));
        this.input.keyboard.on('keydown-UP', () => this.rotatePiece());
        this.input.keyboard.on('keydown-DOWN', () => this.softDrop());
        this.input.keyboard.on('keydown-SPACE', () => this.hardDrop());
        this.input.keyboard.on('keydown-P', () => this.togglePause());
    }
    
    spawnNewPiece() {
        const pieceTypes = Object.keys(this.tetrominoes);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        
        if (!this.nextPiece) {
            this.nextPiece = randomType;
        }
        
        this.currentPiece = {
            type: this.nextPiece,
            x: Math.floor(this.GRID_WIDTH / 2) - 1,
            y: 0,
            rotation: 0,
            sprites: []
        };
        
        this.nextPiece = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        this.drawCurrentPiece();
        this.drawNextPiece();
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.endGame();
        }
    }
    
    drawCurrentPiece() {
        this.clearCurrentPiece();
        const shape = this.tetrominoes[this.currentPiece.type].shapes[this.currentPiece.rotation];
        const color = this.tetrominoes[this.currentPiece.type].color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const sprite = this.add.rectangle(
                        (this.currentPiece.x + x) * this.CELL_SIZE + this.CELL_SIZE / 2 + 100,
                        (this.currentPiece.y + y) * this.CELL_SIZE + this.CELL_SIZE / 2 + 50,
                        this.CELL_SIZE - 2,
                        this.CELL_SIZE - 2,
                        color
                    );
                    sprite.setStrokeStyle(2, 0xffffff);
                    this.currentPiece.sprites.push(sprite);
                }
            }
        }
    }
    
    drawNextPiece() {
        if (this.nextPieceSprites) {
            this.nextPieceSprites.forEach(sprite => sprite.destroy());
        }
        this.nextPieceSprites = [];
        
        const shape = this.tetrominoes[this.nextPiece].shapes[0];
        const color = this.tetrominoes[this.nextPiece].color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const sprite = this.add.rectangle(
                        480 + x * 20,
                        300 + y * 20,
                        18,
                        18,
                        color
                    );
                    sprite.setStrokeStyle(1, 0xffffff);
                    this.nextPieceSprites.push(sprite);
                }
            }
        }
    }
    
    clearCurrentPiece() {
        if (this.currentPiece && this.currentPiece.sprites) {
            this.currentPiece.sprites.forEach(sprite => sprite.destroy());
            this.currentPiece.sprites = [];
        }
    }
    
    movePiece(dx, dy) {
        if (this.gameOver || this.paused || !this.currentPiece) return;
        
        if (!this.checkCollision(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.drawCurrentPiece();
        } else if (dy > 0) {
            this.lockPiece();
        }
    }
    
    rotatePiece() {
        if (this.gameOver || this.paused || !this.currentPiece) return;
        
        const newRotation = (this.currentPiece.rotation + 1) % this.tetrominoes[this.currentPiece.type].shapes.length;
        const tempPiece = { ...this.currentPiece, rotation: newRotation };
        
        if (!this.checkCollision(tempPiece, 0, 0)) {
            this.currentPiece.rotation = newRotation;
            this.drawCurrentPiece();
        }
    }
    
    softDrop() {
        this.movePiece(0, 1);
    }
    
    hardDrop() {
        if (this.gameOver || this.paused || !this.currentPiece) return;
        
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
        }
        this.drawCurrentPiece();
        this.lockPiece();
    }
    
    dropPiece() {
        if (this.gameOver || this.paused) return;
        this.movePiece(0, 1);
    }
    
    checkCollision(piece, dx, dy) {
        const shape = this.tetrominoes[piece.type].shapes[piece.rotation];
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + dx;
                    const newY = piece.y + y + dy;
                    
                    if (newX < 0 || newX >= this.GRID_WIDTH || newY >= this.GRID_HEIGHT) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX].filled) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    lockPiece() {
        const shape = this.tetrominoes[this.currentPiece.type].shapes[this.currentPiece.rotation];
        const color = this.tetrominoes[this.currentPiece.type].color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const gridX = this.currentPiece.x + x;
                    const gridY = this.currentPiece.y + y;
                    
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = { filled: true, color: color };
                        
                        const filledCell = this.add.rectangle(
                            gridX * this.CELL_SIZE + this.CELL_SIZE / 2 + 100,
                            gridY * this.CELL_SIZE + this.CELL_SIZE / 2 + 50,
                            this.CELL_SIZE - 2,
                            this.CELL_SIZE - 2,
                            color
                        );
                        filledCell.setStrokeStyle(2, 0xffffff);
                    }
                }
            }
        }
        
        this.clearCurrentPiece();
        this.clearLines();
        this.spawnNewPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.GRID_HEIGHT - 1; y >= 0; y--) {
            let fullLine = true;
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                if (!this.grid[y][x].filled) {
                    fullLine = false;
                    break;
                }
            }
            
            if (fullLine) {
                this.grid.splice(y, 1);
                this.grid.unshift(new Array(this.GRID_WIDTH).fill({ filled: false, color: 0x000000 }));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            
            this.updateUI();
            this.redrawGrid();
        }
    }
    
    redrawGrid() {
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'filled-cell') {
                child.destroy();
            }
        });
        
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                if (this.grid[y][x].filled) {
                    const filledCell = this.add.rectangle(
                        x * this.CELL_SIZE + this.CELL_SIZE / 2 + 100,
                        y * this.CELL_SIZE + this.CELL_SIZE / 2 + 50,
                        this.CELL_SIZE - 2,
                        this.CELL_SIZE - 2,
                        this.grid[y][x].color
                    );
                    filledCell.setStrokeStyle(2, 0xffffff);
                }
            }
        }
    }
    
    updateUI() {
        this.scoreText.setText('SCORE: ' + this.score);
        this.levelText.setText('LEVEL: ' + this.level);
        this.linesText.setText('LINES: ' + this.lines);
    }
    
    togglePause() {
        this.paused = !this.paused;
        
        if (this.paused) {
            const pauseOverlay = this.add.image(400, 300, 'pause-overlay');
            pauseOverlay.setDisplaySize(800, 600);
            pauseOverlay.setAlpha(0.8);
            
            this.pauseText = this.add.text(400, 300, 'PAUSED\nPress P to Resume', {
                fontSize: '32px',
                fill: '#ffffff',
                fontFamily: 'Courier New',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            this.children.list.forEach(child => {
                if (child.texture && child.texture.key === 'pause-overlay') {
                    child.destroy();
                }
            });
            if (this.pauseText) {
                this.pauseText.destroy();
            }
        }
    }
    
    endGame() {
        this.gameOver = true;
        
        const gameOverOverlay = this.add.image(400, 300, 'game-over-overlay');
        gameOverOverlay.setDisplaySize(800, 600);
        gameOverOverlay.setAlpha(0.8);
        
        this.add.text(400, 280, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(400, 340, 'Final Score: ' + this.score, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(400, 380, 'Press F5 to Restart', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-canvas',
    backgroundColor: '#0f0f23',
    scene: TetrisGame,
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);