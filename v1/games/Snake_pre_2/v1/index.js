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
        this.gridSize = 20;
        this.gameWidth = 600;
        this.gameHeight = 400;
    }

    preload() {
        this.load.image('snake-head-up', './assets/images/snake-head-up.png');
        this.load.image('snake-head-down', './assets/images/snake-head-down.png');
        this.load.image('snake-head-left', './assets/images/snake-head-left.png');
        this.load.image('snake-head-right', './assets/images/snake-head-right.png');
        this.load.image('snake-body', './assets/images/snake-body.png');
        this.load.image('food', './assets/images/food.png');
        this.load.image('wall', './assets/images/wall.png');
    }

    create() {
        // Create walls
        this.createWalls();
        
        // Initialize snake
        this.initializeSnake();
        
        // Create first food
        this.createFood();
        
        // Create UI
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        this.highScoreText = this.add.text(10, 40, 'High Score: ' + this.getHighScore(), {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        });
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,ENTER');
        
        // Game loop timer
        this.gameTimer = this.time.addEvent({
            delay: 150,
            callback: this.updateGame,
            callbackScope: this,
            loop: true
        });
    }

    createWalls() {
        this.walls = this.add.group();
        
        // Top and bottom walls
        for (let x = 0; x < this.gameWidth; x += this.gridSize) {
            this.walls.add(this.add.image(x, 0, 'wall').setOrigin(0, 0));
            this.walls.add(this.add.image(x, this.gameHeight - this.gridSize, 'wall').setOrigin(0, 0));
        }
        
        // Left and right walls
        for (let y = this.gridSize; y < this.gameHeight - this.gridSize; y += this.gridSize) {
            this.walls.add(this.add.image(0, y, 'wall').setOrigin(0, 0));
            this.walls.add(this.add.image(this.gameWidth - this.gridSize, y, 'wall').setOrigin(0, 0));
        }
    }

    initializeSnake() {
        this.snake = [];
        const startX = Math.floor(this.gameWidth / 2 / this.gridSize) * this.gridSize;
        const startY = Math.floor(this.gameHeight / 2 / this.gridSize) * this.gridSize;
        
        // Create snake head
        this.snake.push({
            x: startX,
            y: startY,
            sprite: this.add.image(startX, startY, 'snake-head-right').setOrigin(0, 0)
        });
        
        // Create initial body segments
        for (let i = 1; i < 3; i++) {
            this.snake.push({
                x: startX - (i * this.gridSize),
                y: startY,
                sprite: this.add.image(startX - (i * this.gridSize), startY, 'snake-body').setOrigin(0, 0)
            });
        }
    }

    createFood() {
        let foodX, foodY;
        let validPosition = false;
        
        while (!validPosition) {
            foodX = this.gridSize + Math.floor(Math.random() * ((this.gameWidth - 2 * this.gridSize) / this.gridSize)) * this.gridSize;
            foodY = this.gridSize + Math.floor(Math.random() * ((this.gameHeight - 2 * this.gridSize) / this.gridSize)) * this.gridSize;
            
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
        
        this.food = this.add.image(foodX, foodY, 'food').setOrigin(0, 0);
    }

    update() {
        if (this.gameOver || this.paused) return;
        
        // Handle input
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            if (this.direction !== 'DOWN') this.nextDirection = 'UP';
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            if (this.direction !== 'UP') this.nextDirection = 'DOWN';
        } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
            if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
            this.togglePause();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.wasd.ENTER) && this.gameOver) {
            this.restartGame();
        }
    }

    updateGame() {
        if (this.gameOver || this.paused) return;
        
        this.direction = this.nextDirection;
        
        // Calculate new head position
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
        if (newX < this.gridSize || newX >= this.gameWidth - this.gridSize || 
            newY < this.gridSize || newY >= this.gameHeight - this.gridSize) {
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
            this.createFood();
        }
        
        // Move snake
        if (!ateFood) {
            const tail = this.snake.pop();
            tail.sprite.destroy();
        }
        
        // Update head sprite based on direction
        let headTexture = 'snake-head-right';
        switch (this.direction) {
            case 'UP': headTexture = 'snake-head-up'; break;
            case 'DOWN': headTexture = 'snake-head-down'; break;
            case 'LEFT': headTexture = 'snake-head-left'; break;
            case 'RIGHT': headTexture = 'snake-head-right'; break;
        }
        
        head.sprite.setTexture(headTexture);
        
        // Add new head
        this.snake.unshift({
            x: newX,
            y: newY,
            sprite: this.add.image(newX, newY, 'snake-body').setOrigin(0, 0)
        });
        
        // Update positions
        for (let i = 0; i < this.snake.length; i++) {
            this.snake[i].sprite.setPosition(this.snake[i].x, this.snake[i].y);
        }
        
        // Set head sprite
        this.snake[0].sprite.setTexture(headTexture);
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.add.rectangle(this.gameWidth/2, this.gameHeight/2, this.gameWidth, this.gameHeight, 0x000000, 0.7)
                .setDepth(100);
            this.pauseText = this.add.text(this.gameWidth/2, this.gameHeight/2, 'PAUSED\nPress SPACE to continue', {
                fontSize: '32px',
                fill: '#ffffff',
                align: 'center',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(101);
        } else {
            if (this.pauseText) {
                this.pauseText.destroy();
                this.children.getAll().forEach(child => {
                    if (child.depth === 100) child.destroy();
                });
            }
        }
    }

    endGame() {
        this.gameOver = true;
        
        // Update high score
        const currentHighScore = this.getHighScore();
        if (this.score > currentHighScore) {
            localStorage.setItem('snakeHighScore', this.score.toString());
            this.highScoreText.setText('High Score: ' + this.score + ' (NEW!)');
        }
        
        // Game over overlay
        this.add.rectangle(this.gameWidth/2, this.gameHeight/2, this.gameWidth, this.gameHeight, 0x000000, 0.8)
            .setDepth(100);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 - 40, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            align: 'center',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(101);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 + 20, 'Final Score: ' + this.score, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(101);
        
        this.add.text(this.gameWidth/2, this.gameHeight/2 + 60, 'Press ENTER to restart', {
            fontSize: '18px',
            fill: '#ffff00',
            align: 'center',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(101);
    }

    restartGame() {
        this.scene.restart();
    }

    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 400,
    parent: 'game-area',
    backgroundColor: '#000000',
    scene: SnakeGame,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);