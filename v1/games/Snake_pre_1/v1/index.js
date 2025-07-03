class SnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGame' });
        this.snake = [];
        this.food = null;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gridSize = 20;
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.moveTimer = 0;
        this.moveDelay = 150;
    }

    preload() {
        this.load.image('snake-head', './assets/images/snake-head.png');
        this.load.image('snake-body', './assets/images/snake-body.png');
        this.load.image('food', './assets/images/food.png');
        this.load.image('background', './assets/images/background.png');
    }

    create() {
        // Create background
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background').setDisplaySize(this.gameWidth, this.gameHeight);
        
        // Initialize snake
        this.initializeSnake();
        
        // Create food
        this.spawnFood();
        
        // Create UI
        this.createUI();
        
        // Setup input
        this.setupInput();
        
        // Create game over screen (hidden initially)
        this.createGameOverScreen();
        
        // Create pause screen (hidden initially)
        this.createPauseScreen();
    }

    initializeSnake() {
        this.snake = [];
        const startX = Math.floor(this.gameWidth / 2 / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.gameHeight / 2 / this.gridSize) * this.gridSize;
        
        // Create snake with 4 segments
        for (let i = 0; i < 4; i++) {
            const segment = this.add.image(
                startX - (i * this.gridSize),
                startY,
                i === 0 ? 'snake-head' : 'snake-body'
            ).setDisplaySize(this.gridSize, this.gridSize);
            this.snake.push({ x: startX - (i * this.gridSize), y: startY, sprite: segment });
        }
        
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
    }

    spawnFood() {
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = Math.floor(Math.random() * (this.gameWidth / this.gridSize)) * this.gridSize;
            foodY = Math.floor(Math.random() * (this.gameHeight / this.gridSize)) * this.gridSize;
            
            validPosition = true;
            // Check if food spawns on snake
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
        
        this.food = this.add.image(foodX, foodY, 'food').setDisplaySize(this.gridSize, this.gridSize);
    }

    createUI() {
        this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.highScoreText = this.add.text(20, 50, `High Score: ${this.highScore}`, {
            fontSize: '18px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.instructionText = this.add.text(this.gameWidth - 20, 20, 'Use Arrow Keys or WASD\nPress P to Pause', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'right'
        }).setOrigin(1, 0);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,P,R');
        
        this.input.keyboard.on('keydown', (event) => {
            if (this.gameOver) {
                if (event.code === 'KeyR' || event.code === 'Space') {
                    this.restartGame();
                }
                return;
            }
            
            if (event.code === 'KeyP') {
                this.togglePause();
                return;
            }
            
            if (this.isPaused) return;
            
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.direction !== 'DOWN') this.nextDirection = 'UP';
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.direction !== 'UP') this.nextDirection = 'DOWN';
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
                    break;
            }
        });
    }

    createGameOverScreen() {
        this.gameOverGroup = this.add.group();
        
        const overlay = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x000000, 0.8);
        const gameOverText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 - 50, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        const finalScoreText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, '', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        const restartText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 50, 'Press R or SPACE to Restart', {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.gameOverGroup.addMultiple([overlay, gameOverText, finalScoreText, restartText]);
        this.gameOverGroup.setVisible(false);
        
        this.finalScoreText = finalScoreText;
    }

    createPauseScreen() {
        this.pauseGroup = this.add.group();
        
        const overlay = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x000000, 0.6);
        const pauseText = this.add.text(this.gameWidth / 2, this.gameHeight / 2, 'PAUSED\nPress P to Resume', {
            fontSize: '36px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        
        this.pauseGroup.addMultiple([overlay, pauseText]);
        this.pauseGroup.setVisible(false);
    }

    update(time, delta) {
        if (this.gameOver || this.isPaused) return;
        
        this.moveTimer += delta;
        
        if (this.moveTimer >= this.moveDelay) {
            this.moveSnake();
            this.moveTimer = 0;
        }
    }

    moveSnake() {
        this.direction = this.nextDirection;
        
        const head = this.snake[0];
        let newX = head.x;
        let newY = head.y;
        
        switch (this.direction) {
            case 'UP':
                newY -= this.gridSize;
                break;
            case 'DOWN':
                newY += this.gridSize;
                break;
            case 'LEFT':
                newX -= this.gridSize;
                break;
            case 'RIGHT':
                newX += this.gridSize;
                break;
        }
        
        // Check wall collision
        if (newX < 0 || newX >= this.gameWidth || newY < 0 || newY >= this.gameHeight) {
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
            this.scoreText.setText(`Score: ${this.score}`);
            
            // Add new segment
            const newSegment = this.add.image(newX, newY, 'snake-head').setDisplaySize(this.gridSize, this.gridSize);
            this.snake.unshift({ x: newX, y: newY, sprite: newSegment });
            
            // Change old head to body
            head.sprite.setTexture('snake-body');
            
            this.spawnFood();
            
            // Increase speed slightly
            this.moveDelay = Math.max(80, this.moveDelay - 2);
        } else {
            // Move snake normally
            const tail = this.snake.pop();
            tail.sprite.destroy();
            
            const newSegment = this.add.image(newX, newY, 'snake-head').setDisplaySize(this.gridSize, this.gridSize);
            this.snake.unshift({ x: newX, y: newY, sprite: newSegment });
            
            // Change old head to body
            if (this.snake.length > 1) {
                this.snake[1].sprite.setTexture('snake-body');
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseGroup.setVisible(this.isPaused);
    }

    endGame() {
        this.gameOver = true;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
            this.highScoreText.setText(`High Score: ${this.highScore}`);
        }
        
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.gameOverGroup.setVisible(true);
    }

    restartGame() {
        // Reset game state
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.moveDelay = 150;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        
        // Clear existing snake
        for (let segment of this.snake) {
            segment.sprite.destroy();
        }
        
        // Hide screens
        this.gameOverGroup.setVisible(false);
        this.pauseGroup.setVisible(false);
        
        // Reinitialize game
        this.initializeSnake();
        this.spawnFood();
        this.scoreText.setText(`Score: ${this.score}`);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-area',
    backgroundColor: '#2c3e50',
    scene: SnakeGame,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);