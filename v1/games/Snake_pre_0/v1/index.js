class SnakeGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGame' });
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.gridSize = 20;
        this.score = 0;
        this.gameOver = false;
        this.moveTimer = 0;
        this.moveDelay = 150;
    }

    preload() {
        this.load.image('snake-head', './assets/images/snake-head.png');
        this.load.image('snake-body', './assets/images/snake-body.png');
        this.load.image('food', './assets/images/food.png');
        this.load.image('wall', './assets/images/wall.png');
    }

    create() {
        const gameWidth = 800;
        const gameHeight = 600;
        
        // Initialize snake
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        // Create food
        this.spawnFood();
        
        // Create walls
        this.createWalls();
        
        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#27ae60',
            fontFamily: 'Arial'
        });
        
        // Game over text (hidden initially)
        this.gameOverText = this.add.text(400, 250, 'GAME OVER\nPress SPACE to Restart', {
            fontSize: '48px',
            fill: '#e74c3c',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);
        
        // Restart key
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    createWalls() {
        this.walls = this.add.group();
        const cols = 40;
        const rows = 30;
        
        // Top and bottom walls
        for (let x = 0; x < cols; x++) {
            this.walls.add(this.add.image(x * this.gridSize + 10, 10, 'wall').setOrigin(0));
            this.walls.add(this.add.image(x * this.gridSize + 10, (rows - 1) * this.gridSize + 10, 'wall').setOrigin(0));
        }
        
        // Left and right walls
        for (let y = 1; y < rows - 1; y++) {
            this.walls.add(this.add.image(10, y * this.gridSize + 10, 'wall').setOrigin(0));
            this.walls.add(this.add.image((cols - 1) * this.gridSize + 10, y * this.gridSize + 10, 'wall').setOrigin(0));
        }
    }
    
    spawnFood() {
        let validPosition = false;
        let foodX, foodY;
        
        while (!validPosition) {
            foodX = Phaser.Math.Between(2, 37);
            foodY = Phaser.Math.Between(2, 27);
            
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
        
        this.food = this.add.image(
            foodX * this.gridSize + 10,
            foodY * this.gridSize + 10,
            'food'
        ).setOrigin(0);
        
        this.foodPos = { x: foodX, y: foodY };
    }
    
    update(time, delta) {
        if (this.gameOver) {
            if (this.spaceKey.isDown) {
                this.restartGame();
            }
            return;
        }
        
        this.handleInput();
        
        this.moveTimer += delta;
        if (this.moveTimer >= this.moveDelay) {
            this.moveSnake();
            this.moveTimer = 0;
        }
    }
    
    handleInput() {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            if (this.direction.x !== 1) {
                this.nextDirection = { x: -1, y: 0 };
            }
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            if (this.direction.x !== -1) {
                this.nextDirection = { x: 1, y: 0 };
            }
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            if (this.direction.y !== 1) {
                this.nextDirection = { x: 0, y: -1 };
            }
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            if (this.direction.y !== -1) {
                this.nextDirection = { x: 0, y: 1 };
            }
        }
    }
    
    moveSnake() {
        this.direction = { ...this.nextDirection };
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        // Check wall collision
        if (head.x <= 1 || head.x >= 38 || head.y <= 1 || head.y >= 28) {
            this.endGame();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.endGame();
                return;
            }
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.foodPos.x && head.y === this.foodPos.y) {
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
            this.spawnFood();
            
            // Increase speed slightly
            this.moveDelay = Math.max(80, this.moveDelay - 2);
        } else {
            this.snake.pop();
        }
        
        this.renderSnake();
    }
    
    renderSnake() {
        // Clear previous snake sprites
        if (this.snakeSprites) {
            this.snakeSprites.forEach(sprite => sprite.destroy());
        }
        
        this.snakeSprites = [];
        
        this.snake.forEach((segment, index) => {
            const sprite = this.add.image(
                segment.x * this.gridSize + 10,
                segment.y * this.gridSize + 10,
                index === 0 ? 'snake-head' : 'snake-body'
            ).setOrigin(0);
            
            this.snakeSprites.push(sprite);
        });
    }
    
    endGame() {
        this.gameOver = true;
        this.gameOverText.setVisible(true);
    }
    
    restartGame() {
        this.score = 0;
        this.gameOver = false;
        this.moveDelay = 150;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        this.scoreText.setText('Score: 0');
        this.gameOverText.setVisible(false);
        
        this.spawnFood();
        this.renderSnake();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-area',
    backgroundColor: '#2c5530',
    scene: SnakeGame,
    physics: {
        default: 'arcade'
    }
};

const game = new Phaser.Game(config);