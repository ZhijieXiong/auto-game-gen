class SnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGame' });
        this.snake = [];
        this.food = null;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.gridSize = 32;
        this.gameWidth = 640;
        this.gameHeight = 480;
        this.moveTimer = 0;
        this.moveDelay = 200;
    }

    preload() {
        this.load.image('snake-head-up', './assets/images/snake-head-up.png');
        this.load.image('snake-head-down', './assets/images/snake-head-down.png');
        this.load.image('snake-head-left', './assets/images/snake-head-left.png');
        this.load.image('snake-head-right', './assets/images/snake-head-right.png');
        this.load.image('snake-body', './assets/images/snake-body.png');
        this.load.image('food', './assets/images/food.png');
        this.load.image('background', './assets/images/background.png');
        this.load.image('wall', './assets/images/wall.png');
        this.load.image('start-button', './assets/images/start-button.png');
        this.load.image('pause-icon', './assets/images/pause-icon.png');
    }

    create() {
        // Create background
        this.add.image(this.gameWidth / 2, this.gameHeight / 2, 'background');

        // Create walls
        this.createWalls();

        // Initialize game state
        this.resetGame();

        // Create UI
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        });

        this.pauseIcon = this.add.image(this.gameWidth - 40, 40, 'pause-icon').setVisible(false);

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Game over elements
        this.gameOverGroup = this.add.group();
        this.createGameOverScreen();
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

    createGameOverScreen() {
        const centerX = this.gameWidth / 2;
        const centerY = this.gameHeight / 2;

        const gameOverText = this.add.text(centerX, centerY - 50, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5).setVisible(false);

        const finalScoreText = this.add.text(centerX, centerY, 'Final Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Courier New'
        }).setOrigin(0.5).setVisible(false);

        const restartButton = this.add.image(centerX, centerY + 50, 'start-button')
            .setInteractive()
            .setVisible(false)
            .on('pointerdown', () => this.restartGame());

        this.gameOverGroup.addMultiple([gameOverText, finalScoreText, restartButton]);
        this.finalScoreText = finalScoreText;
    }

    resetGame() {
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        
        // Clear existing snake
        if (this.snakeGroup) {
            this.snakeGroup.clear(true, true);
        }
        
        this.snakeGroup = this.add.group();
        this.snake = [];
        
        // Create initial snake
        const startX = this.gridSize * 5;
        const startY = this.gridSize * 5;
        
        for (let i = 0; i < 3; i++) {
            const segment = {
                x: startX - (i * this.gridSize),
                y: startY,
                sprite: null
            };
            this.snake.push(segment);
        }
        
        this.updateSnakeSprites();
        this.spawnFood();
        this.updateScore();
        
        // Hide game over screen
        this.gameOverGroup.setVisible(false);
        this.pauseIcon.setVisible(false);
    }

    updateSnakeSprites() {
        this.snakeGroup.clear(true, true);
        
        this.snake.forEach((segment, index) => {
            let sprite;
            if (index === 0) {
                // Head sprite based on direction
                const headTexture = `snake-head-${this.direction.toLowerCase()}`;
                sprite = this.add.image(segment.x, segment.y, headTexture);
            } else {
                // Body segment
                sprite = this.add.image(segment.x, segment.y, 'snake-body');
            }
            segment.sprite = sprite;
            this.snakeGroup.add(sprite);
        });
    }

    spawnFood() {
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = Phaser.Math.Between(2, (this.gameWidth / this.gridSize) - 3) * this.gridSize;
            foodY = Phaser.Math.Between(2, (this.gameHeight / this.gridSize) - 3) * this.gridSize;
            
            validPosition = !this.snake.some(segment => segment.x === foodX && segment.y === foodY);
        }
        
        if (this.food) {
            this.food.destroy();
        }
        
        this.food = this.add.image(foodX, foodY, 'food');
    }

    update(time) {
        if (this.gameOver || this.paused) return;
        
        this.handleInput();
        
        if (time > this.moveTimer + this.moveDelay) {
            this.moveSnake();
            this.moveTimer = time;
        }
    }

    handleInput() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.togglePause();
            return;
        }
        
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            if (this.direction !== 'DOWN') this.nextDirection = 'UP';
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            if (this.direction !== 'UP') this.nextDirection = 'DOWN';
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
        
        // Check collisions
        if (this.checkCollision(newX, newY)) {
            this.endGame();
            return;
        }
        
        // Add new head
        this.snake.unshift({ x: newX, y: newY, sprite: null });
        
        // Check food collision
        if (newX === this.food.x && newY === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.spawnFood();
            
            // Increase speed slightly
            this.moveDelay = Math.max(100, this.moveDelay - 2);
        } else {
            // Remove tail
            this.snake.pop();
        }
        
        this.updateSnakeSprites();
    }

    checkCollision(x, y) {
        // Wall collision
        if (x < this.gridSize || x >= this.gameWidth - this.gridSize || 
            y < this.gridSize || y >= this.gameHeight - this.gridSize) {
            return true;
        }
        
        // Self collision
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }

    togglePause() {
        this.paused = !this.paused;
        this.pauseIcon.setVisible(this.paused);
    }

    endGame() {
        this.gameOver = true;
        this.finalScoreText.setText(`Final Score: ${this.score}`);
        this.gameOverGroup.setVisible(true);
    }

    restartGame() {
        this.resetGame();
    }

    updateScore() {
        this.scoreText.setText(`Score: ${this.score}`);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
    parent: 'game-canvas',
    backgroundColor: '#222222',
    scene: SnakeGame,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);