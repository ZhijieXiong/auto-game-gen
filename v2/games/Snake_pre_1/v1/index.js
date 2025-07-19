class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('button_play', './assets/sprites/ui_buttons.png');
        this.load.image('grid_background', './assets/sprites/backgrounds.png');
    }

    create() {
        this.add.image(400, 300, 'grid_background');
        
        const title = this.add.text(400, 150, 'CLASSIC SNAKE', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const playButton = this.add.image(400, 350, 'button_play')
            .setInteractive()
            .setScale(2);

        playButton.on('pointerover', () => {
            playButton.setTint(0x88ff88);
        });

        playButton.on('pointerout', () => {
            playButton.clearTint();
        });

        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.add.text(400, 450, 'Use Arrow Keys or WASD to move\nSpacebar to pause', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameRunning = true;
        this.isPaused = false;
        this.gridSize = 32;
        this.gameWidth = 25;
        this.gameHeight = 19;
    }

    preload() {
        this.load.image('snake_parts', './assets/sprites/snake_parts.png');
        this.load.image('food_apple', './assets/sprites/food_items.png');
        this.load.image('grid_background', './assets/sprites/backgrounds.png');
        this.load.image('ui_panel', './assets/sprites/ui_elements.png');
        this.load.image('button_pause', './assets/sprites/ui_buttons.png');
    }

    create() {
        // Create background
        for (let x = 0; x < this.gameWidth; x++) {
            for (let y = 0; y < this.gameHeight; y++) {
                this.add.image(x * this.gridSize + 16, y * this.gridSize + 16, 'grid_background')
                    .setDisplaySize(this.gridSize, this.gridSize);
            }
        }

        // Initialize snake
        this.snake = [
            { x: 5, y: 9 },
            { x: 4, y: 9 },
            { x: 3, y: 9 }
        ];

        this.snakeSprites = [];
        this.updateSnakeSprites();

        // Create food
        this.spawnFood();

        // Create UI
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        this.highScoreText = this.add.text(16, 50, `High Score: ${this.highScore}`, {
            fontSize: '16px',
            fill: '#ffff00',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        });

        const pauseButton = this.add.image(750, 30, 'button_pause')
            .setInteractive()
            .setScale(1.5);

        pauseButton.on('pointerdown', () => {
            this.togglePause();
        });

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');

        // Game loop
        this.moveTimer = this.time.addEvent({
            delay: 150,
            callback: this.moveSnake,
            callbackScope: this,
            loop: true
        });

        // Touch controls
        this.input.on('pointerdown', this.handleTouch, this);
        this.touchStartX = 0;
        this.touchStartY = 0;
    }

    update() {
        if (!this.gameRunning || this.isPaused) return;

        this.handleInput();
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

        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)) {
            this.togglePause();
        }
    }

    handleTouch(pointer) {
        if (pointer.isDown) {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
        }
    }

    moveSnake() {
        if (!this.gameRunning || this.isPaused) return;

        this.direction = { ...this.nextDirection };

        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.gameWidth || head.y < 0 || head.y >= this.gameHeight) {
            this.gameOver();
            return;
        }

        // Check self collision
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreText.setText(`Score: ${this.score}`);
            this.spawnFood();
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreText.setText(`High Score: ${this.highScore}`);
                localStorage.setItem('snakeHighScore', this.highScore.toString());
            }
        } else {
            this.snake.pop();
        }

        this.updateSnakeSprites();
    }

    updateSnakeSprites() {
        // Clear existing sprites
        this.snakeSprites.forEach(sprite => sprite.destroy());
        this.snakeSprites = [];

        // Create new sprites
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            let sprite;
            
            if (i === 0) {
                // Head
                sprite = this.add.image(
                    segment.x * this.gridSize + 16,
                    segment.y * this.gridSize + 16,
                    'snake_parts'
                ).setDisplaySize(this.gridSize, this.gridSize);
                sprite.setTint(0x00ff00);
            } else if (i === this.snake.length - 1) {
                // Tail
                sprite = this.add.image(
                    segment.x * this.gridSize + 16,
                    segment.y * this.gridSize + 16,
                    'snake_parts'
                ).setDisplaySize(this.gridSize, this.gridSize);
                sprite.setTint(0x008800);
            } else {
                // Body
                sprite = this.add.image(
                    segment.x * this.gridSize + 16,
                    segment.y * this.gridSize + 16,
                    'snake_parts'
                ).setDisplaySize(this.gridSize, this.gridSize);
                sprite.setTint(0x00cc00);
            }
            
            this.snakeSprites.push(sprite);
        }
    }

    spawnFood() {
        let validPosition = false;
        let foodX, foodY;

        while (!validPosition) {
            foodX = Phaser.Math.Between(0, this.gameWidth - 1);
            foodY = Phaser.Math.Between(0, this.gameHeight - 1);
            
            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }

        if (this.food && this.food.sprite) {
            this.food.sprite.destroy();
        }

        this.food = {
            x: foodX,
            y: foodY,
            sprite: this.add.image(
                foodX * this.gridSize + 16,
                foodY * this.gridSize + 16,
                'food_apple'
            ).setDisplaySize(this.gridSize, this.gridSize)
        };
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.moveTimer.paused = true;
            this.add.text(400, 300, 'PAUSED', {
                fontSize: '48px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 16, y: 8 }
            }).setOrigin(0.5).setName('pauseText');
        } else {
            this.moveTimer.paused = false;
            const pauseText = this.children.getByName('pauseText');
            if (pauseText) pauseText.destroy();
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.moveTimer.destroy();
        this.scene.start('GameOverScene', { score: this.score, highScore: this.highScore });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score;
        this.highScore = data.highScore;
    }

    preload() {
        this.load.image('button_restart', './assets/sprites/ui_buttons.png');
        this.load.image('game_over_panel', './assets/sprites/ui_elements.png');
        this.load.image('grid_background', './assets/sprites/backgrounds.png');
    }

    create() {
        this.add.image(400, 300, 'grid_background');
        
        const panel = this.add.image(400, 300, 'game_over_panel')
            .setScale(3)
            .setTint(0x000000)
            .setAlpha(0.8);

        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(400, 260, `Final Score: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 290, `High Score: ${this.highScore}`, {
            fontSize: '20px',
            fill: '#ffff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const restartButton = this.add.image(400, 360, 'button_restart')
            .setInteractive()
            .setScale(2);

        restartButton.on('pointerover', () => {
            restartButton.setTint(0xffaa00);
        });

        restartButton.on('pointerout', () => {
            restartButton.clearTint();
        });

        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        const menuButton = this.add.text(400, 420, 'Main Menu', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive();

        menuButton.on('pointerover', () => {
            menuButton.setTint(0xcccccc);
        });

        menuButton.on('pointerout', () => {
            menuButton.clearTint();
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('StartScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [StartScene, GameScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true
    }
};

const game = new Phaser.Game(config);