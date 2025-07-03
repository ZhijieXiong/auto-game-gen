class SnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGame' });
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameRunning = false;
        this.isPaused = false;
        this.gridSize = 32;
        this.gameWidth = 640;
        this.gameHeight = 480;
    }

    preload() {
        this.load.image('snake-head-up', './assets/images/snake-head-up.png');
        this.load.image('snake-head-down', './assets/images/snake-head-down.png');
        this.load.image('snake-head-left', './assets/images/snake-head-left.png');
        this.load.image('snake-head-right', './assets/images/snake-head-right.png');
        this.load.image('snake-body', './assets/images/snake-body.png');
        this.load.image('snake-tail-up', './assets/images/snake-tail-up.png');
        this.load.image('snake-tail-down', './assets/images/snake-tail-down.png');
        this.load.image('snake-tail-left', './assets/images/snake-tail-left.png');
        this.load.image('snake-tail-right', './assets/images/snake-tail-right.png');
        this.load.image('food', './assets/images/food.png');
        this.load.image('background', './assets/images/background.png');
        this.load.image('wall', './assets/images/wall.png');
    }

    create() {
        // Background
        this.add.image(this.gameWidth/2, this.gameHeight/2, 'background');
        
        // Create walls
        this.createWalls();
        
        // Initialize snake
        this.initSnake();
        
        // Create food
        this.spawnFood();
        
        // UI elements
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#00ff41',
            fontFamily: 'Courier New'
        });
        
        this.highScoreText = this.add.text(16, 50, 'High Score: ' + this.getHighScore(), {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });
        
        // Start screen
        this.showStartScreen();
        
        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');
        
        // Game loop
        this.moveTimer = this.time.addEvent({
            delay: 150,
            callback: this.moveSnake,
            callbackScope: this,
            loop: true,
            paused: true
        });
    }

    createWalls() {
        this.walls = this.add.group();
        
        // Top and bottom walls
        for (let x = 0; x < this.gameWidth; x += this.gridSize) {
            this.walls.add(this.add.image(x + this.gridSize/2, this.gridSize/2, 'wall'));
            this.walls.add(this.add.image(x + this.gridSize/2, this.gameHeight - this.gridSize/2, 'wall'));
        }
        
        // Left and right walls
        for (let y = this.gridSize; y < this.gameHeight - this.gridSize; y += this.gridSize) {
            this.walls.add(this.add.image(this.gridSize/2, y + this.gridSize/2, 'wall'));
            this.walls.add(this.add.image(this.gameWidth - this.gridSize/2, y + this.gridSize/2, 'wall'));
        }
    }

    initSnake() {
        this.snake = [];
        const startX = Math.floor(this.gameWidth / 2 / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.gameHeight / 2 / this.gridSize) * this.gridSize;
        
        // Create initial snake with 3 segments
        for (let i = 0; i < 3; i++) {
            this.snake.push({
                x: startX - i * this.gridSize,
                y: startY,
                sprite: null
            });
        }
        
        this.updateSnakeSprites();
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
    }

    updateSnakeSprites() {
        // Clear existing sprites
        this.snake.forEach(segment => {
            if (segment.sprite) {
                segment.sprite.destroy();
            }
        });
        
        // Create new sprites
        this.snake.forEach((segment, index) => {
            let texture;
            
            if (index === 0) {
                // Head
                if (this.direction.x === 1) texture = 'snake-head-right';
                else if (this.direction.x === -1) texture = 'snake-head-left';
                else if (this.direction.y === 1) texture = 'snake-head-down';
                else texture = 'snake-head-up';
            } else if (index === this.snake.length - 1) {
                // Tail
                const prevSegment = this.snake[index - 1];
                const tailDir = {
                    x: segment.x - prevSegment.x,
                    y: segment.y - prevSegment.y
                };
                
                if (tailDir.x > 0) texture = 'snake-tail-right';
                else if (tailDir.x < 0) texture = 'snake-tail-left';
                else if (tailDir.y > 0) texture = 'snake-tail-down';
                else texture = 'snake-tail-up';
            } else {
                // Body
                texture = 'snake-body';
            }
            
            segment.sprite = this.add.image(segment.x + this.gridSize/2, segment.y + this.gridSize/2, texture);
        });
    }

    spawnFood() {
        let validPosition = false;
        let foodX, foodY;
        
        while (!validPosition) {
            foodX = Phaser.Math.Between(1, (this.gameWidth / this.gridSize) - 2) * this.gridSize;
            foodY = Phaser.Math.Between(1, (this.gameHeight / this.gridSize) - 2) * this.gridSize;
            
            validPosition = !this.snake.some(segment => segment.x === foodX && segment.y === foodY);
        }
        
        if (this.food) {
            this.food.destroy();
        }
        
        this.food = this.add.image(foodX + this.gridSize/2, foodY + this.gridSize/2, 'food');
    }

    showStartScreen() {
        this.startButton = this.add.rectangle(this.gameWidth/2, this.gameHeight/2, 200, 60, 0x00ff41)
            .setInteractive()
            .on('pointerdown', () => this.startGame());
        
        this.add.text(this.gameWidth/2, this.gameHeight/2, 'START', {
            fontSize: '24px',
            fill: '#000000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 - 100, 'SNAKE GAME', {
            fontSize: '32px',
            fill: '#00ff41',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 + 80, 'Use Arrow Keys or WASD to move\nSPACE to pause', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Courier New',
            align: 'center'
        }).setOrigin(0.5);
    }

    startGame() {
        if (this.startButton) {
            this.startButton.destroy();
        }
        
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child !== this.scoreText && child !== this.highScoreText) {
                child.destroy();
            }
        });
        
        this.gameRunning = true;
        this.moveTimer.paused = false;
    }

    update() {
        if (!this.gameRunning) return;
        
        this.handleInput();
    }

    handleInput() {
        // Pause
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
            this.togglePause();
            return;
        }
        
        if (this.isPaused) return;
        
        // Movement
        if ((this.cursors.left.isDown || this.wasd.A.isDown) && this.direction.x !== 1) {
            this.nextDirection = { x: -1, y: 0 };
        } else if ((this.cursors.right.isDown || this.wasd.D.isDown) && this.direction.x !== -1) {
            this.nextDirection = { x: 1, y: 0 };
        } else if ((this.cursors.up.isDown || this.wasd.W.isDown) && this.direction.y !== 1) {
            this.nextDirection = { x: 0, y: -1 };
        } else if ((this.cursors.down.isDown || this.wasd.S.isDown) && this.direction.y !== -1) {
            this.nextDirection = { x: 0, y: 1 };
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.moveTimer.paused = this.isPaused;
        
        if (this.isPaused) {
            this.pauseText = this.add.text(this.gameWidth/2, this.gameHeight/2, 'PAUSED\nPress SPACE to continue', {
                fontSize: '24px',
                fill: '#00ff41',
                fontFamily: 'Courier New',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            if (this.pauseText) {
                this.pauseText.destroy();
            }
        }
    }

    moveSnake() {
        if (this.isPaused || !this.gameRunning) return;
        
        this.direction = { ...this.nextDirection };
        
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x * this.gridSize,
            y: head.y + this.direction.y * this.gridSize,
            sprite: null
        };
        
        // Check collisions
        if (this.checkCollision(newHead)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(newHead);
        
        // Check food collision
        if (newHead.x === this.food.x - this.gridSize/2 && newHead.y === this.food.y - this.gridSize/2) {
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
            this.spawnFood();
        } else {
            // Remove tail if no food eaten
            const tail = this.snake.pop();
            if (tail.sprite) {
                tail.sprite.destroy();
            }
        }
        
        this.updateSnakeSprites();
    }

    checkCollision(head) {
        // Wall collision
        if (head.x < this.gridSize || head.x >= this.gameWidth - this.gridSize ||
            head.y < this.gridSize || head.y >= this.gameHeight - this.gridSize) {
            return true;
        }
        
        // Self collision
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    gameOver() {
        this.gameRunning = false;
        this.moveTimer.paused = true;
        
        // Update high score
        const highScore = this.getHighScore();
        if (this.score > highScore) {
            localStorage.setItem('snakeHighScore', this.score.toString());
            this.highScoreText.setText('High Score: ' + this.score);
        }
        
        // Game over screen
        this.add.rectangle(this.gameWidth/2, this.gameHeight/2, this.gameWidth - 100, 200, 0x000000, 0.8);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 - 40, 'GAME OVER', {
            fontSize: '32px',
            fill: '#ff0000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2, 'Final Score: ' + this.score, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
        
        const restartButton = this.add.rectangle(this.gameWidth/2, this.gameHeight/2 + 60, 200, 50, 0x00ff41)
            .setInteractive()
            .on('pointerdown', () => this.restartGame());
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 + 60, 'RESTART', {
            fontSize: '20px',
            fill: '#000000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);
    }

    restartGame() {
        this.score = 0;
        this.scoreText.setText('Score: 0');
        this.scene.restart();
    }

    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
    parent: 'game-area',
    backgroundColor: '#000000',
    scene: SnakeGame,
    pixelArt: true
};

const game = new Phaser.Game(config);