class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('snake_sprites', './assets/images/snake-sprites.png');
        this.load.image('food_apple', './assets/images/food-apple.png');
        this.load.image('grid_background', './assets/images/grid-background.png');
        this.load.image('ui_elements', './assets/images/ui-elements.png');
        this.load.image('game_over_overlay', './assets/images/game-over-overlay.png');
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Title
        this.add.text(width/2, height/3, 'CLASSIC SNAKE', {
            fontSize: '48px',
            fill: '#00ff41',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(width/2, height/2, 'Use ARROW KEYS or WASD to move\nEat apples to grow and score points\nAvoid walls and your own tail!', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        
        // Play button
        const playButton = this.add.rectangle(width/2, height * 0.75, 200, 60, 0x00aa00)
            .setInteractive()
            .setStrokeStyle(3, 0x00ff41);
        
        this.add.text(width/2, height * 0.75, 'PLAY', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        playButton.on('pointerover', () => {
            playButton.setFillStyle(0x00cc00);
        });
        
        playButton.on('pointerout', () => {
            playButton.setFillStyle(0x00aa00);
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.snake = [];
        this.food = null;
        this.direction = 'RIGHT';
        this.newDirection = 'RIGHT';
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gridSize = 32;
        this.gameSpeed = 150;
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Grid background
        this.drawGrid();
        
        // Initialize snake
        this.initSnake();
        
        // Spawn first food
        this.spawnFood();
        
        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#00ff41',
            fontFamily: 'Arial'
        });
        
        this.highScoreText = this.add.text(16, 50, 'High Score: ' + this.getHighScore(), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        });
        
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');
        
        // Game loop
        this.gameTimer = this.time.addEvent({
            delay: this.gameSpeed,
            callback: this.updateSnake,
            callbackScope: this,
            loop: true
        });
        
        // Touch controls
        this.input.on('pointerdown', this.handleTouch, this);
        this.lastTouchX = 0;
        this.lastTouchY = 0;
    }

    drawGrid() {
        const { width, height } = this.cameras.main;
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.5);
        
        for (let x = 0; x <= width; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        
        for (let y = 0; y <= height; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        
        graphics.strokePath();
    }

    initSnake() {
        this.snake = [];
        const startX = Math.floor(this.cameras.main.width / 2 / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.cameras.main.height / 2 / this.gridSize) * this.gridSize;
        
        // Head
        const head = this.add.rectangle(startX, startY, this.gridSize-2, this.gridSize-2, 0x00ff41);
        head.setStrokeStyle(2, 0x00aa00);
        this.snake.push({ x: startX, y: startY, sprite: head });
        
        // Initial body segments
        for (let i = 1; i < 3; i++) {
            const bodyX = startX - (i * this.gridSize);
            const body = this.add.rectangle(bodyX, startY, this.gridSize-2, this.gridSize-2, 0x00cc00);
            body.setStrokeStyle(2, 0x008800);
            this.snake.push({ x: bodyX, y: startY, sprite: body });
        }
    }

    spawnFood() {
        let validPosition = false;
        let foodX, foodY;
        
        while (!validPosition) {
            foodX = Math.floor(Math.random() * (this.cameras.main.width / this.gridSize)) * this.gridSize;
            foodY = Math.floor(Math.random() * (this.cameras.main.height / this.gridSize)) * this.gridSize;
            
            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (this.food) {
            this.food.destroy();
        }
        
        this.food = this.add.rectangle(foodX, foodY, this.gridSize-4, this.gridSize-4, 0xff0000);
        this.food.setStrokeStyle(2, 0xaa0000);
        this.food.x = foodX;
        this.food.y = foodY;
    }

    update() {
        if (this.gameOver || this.isPaused) return;
        
        this.handleInput();
    }

    handleInput() {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            if (this.direction !== 'RIGHT') this.newDirection = 'LEFT';
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            if (this.direction !== 'LEFT') this.newDirection = 'RIGHT';
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            if (this.direction !== 'DOWN') this.newDirection = 'UP';
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            if (this.direction !== 'UP') this.newDirection = 'DOWN';
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
            this.togglePause();
        }
    }

    handleTouch(pointer) {
        if (this.gameOver) return;
        
        const deltaX = pointer.x - this.lastTouchX;
        const deltaY = pointer.y - this.lastTouchY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 30 && this.direction !== 'LEFT') {
                this.newDirection = 'RIGHT';
            } else if (deltaX < -30 && this.direction !== 'RIGHT') {
                this.newDirection = 'LEFT';
            }
        } else {
            if (deltaY > 30 && this.direction !== 'UP') {
                this.newDirection = 'DOWN';
            } else if (deltaY < -30 && this.direction !== 'DOWN') {
                this.newDirection = 'UP';
            }
        }
        
        this.lastTouchX = pointer.x;
        this.lastTouchY = pointer.y;
    }

    updateSnake() {
        if (this.gameOver || this.isPaused) return;
        
        this.direction = this.newDirection;
        
        const head = this.snake[0];
        let newX = head.x;
        let newY = head.y;
        
        switch (this.direction) {
            case 'LEFT':
                newX -= this.gridSize;
                break;
            case 'RIGHT':
                newX += this.gridSize;
                break;
            case 'UP':
                newY -= this.gridSize;
                break;
            case 'DOWN':
                newY += this.gridSize;
                break;
        }
        
        // Check wall collision
        if (newX < 0 || newX >= this.cameras.main.width || newY < 0 || newY >= this.cameras.main.height) {
            this.endGame();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (segment.x === newX && segment.y === newY) {
                this.endGame();
                return;
            }
        }
        
        // Check food collision
        const ateFood = (newX === this.food.x && newY === this.food.y);
        
        if (ateFood) {
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
            this.spawnFood();
            
            // Increase speed slightly
            if (this.gameSpeed > 80) {
                this.gameSpeed -= 2;
                this.gameTimer.delay = this.gameSpeed;
            }
        } else {
            // Remove tail if not eating
            const tail = this.snake.pop();
            tail.sprite.destroy();
        }
        
        // Add new head
        const newHead = this.add.rectangle(newX, newY, this.gridSize-2, this.gridSize-2, 0x00ff41);
        newHead.setStrokeStyle(2, 0x00aa00);
        this.snake.unshift({ x: newX, y: newY, sprite: newHead });
        
        // Update body colors
        for (let i = 1; i < this.snake.length; i++) {
            this.snake[i].sprite.setFillStyle(0x00cc00);
            this.snake[i].sprite.setStrokeStyle(2, 0x008800);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.gameTimer.paused = true;
            this.pauseText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'PAUSED\nPress SPACE to continue', {
                fontSize: '36px',
                fill: '#ffff00',
                fontFamily: 'Arial',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
        } else {
            this.gameTimer.paused = false;
            if (this.pauseText) {
                this.pauseText.destroy();
            }
        }
    }

    endGame() {
        this.gameOver = true;
        this.gameTimer.destroy();
        
        // Update high score
        const highScore = this.getHighScore();
        if (this.score > highScore) {
            localStorage.setItem('snakeHighScore', this.score.toString());
            this.highScoreText.setText('High Score: ' + this.score);
        }
        
        this.scene.start('GameOverScene', { score: this.score, highScore: Math.max(this.score, highScore) });
    }

    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore') || '0');
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.highScore = data.highScore || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        
        // Background overlay
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8);
        
        // Game Over text
        this.add.text(width/2, height/3, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Score display
        this.add.text(width/2, height/2 - 40, 'Final Score: ' + this.finalScore, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        this.add.text(width/2, height/2, 'High Score: ' + this.highScore, {
            fontSize: '20px',
            fill: '#00ff41',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.rectangle(width/2, height * 0.7, 200, 60, 0x0066cc)
            .setInteractive()
            .setStrokeStyle(3, 0x0088ff);
        
        this.add.text(width/2, height * 0.7, 'PLAY AGAIN', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Main menu button
        const menuButton = this.add.rectangle(width/2, height * 0.8, 200, 60, 0x666666)
            .setInteractive()
            .setStrokeStyle(3, 0x888888);
        
        this.add.text(width/2, height * 0.8, 'MAIN MENU', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        restartButton.on('pointerover', () => {
            restartButton.setFillStyle(0x0088cc);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setFillStyle(0x0066cc);
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
        
        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0x888888);
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0x666666);
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    canvas: document.getElementById('game-canvas'),
    backgroundColor: '#0a0a0a',
    scene: [StartScene, GameScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);