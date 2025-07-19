class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.image('ui_button_play', './assets/sprites/ui_button_play.png');
        this.load.image('ui_button_play_hover', './assets/sprites/ui_button_play_hover.png');
        this.load.image('game_background', './assets/sprites/game_background.png');
    }

    create() {
        this.add.tileSprite(0, 0, 800, 600, 'game_background').setOrigin(0);
        
        this.add.text(400, 200, 'CLASSIC SNAKE', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 280, 'Use Arrow Keys or WASD to move\nEat apples to grow and score points\nAvoid walls and your own tail', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        const playButton = this.add.image(400, 400, 'ui_button_play').setInteractive();
        
        playButton.on('pointerover', () => {
            playButton.setTexture('ui_button_play_hover');
        });
        
        playButton.on('pointerout', () => {
            playButton.setTexture('ui_button_play');
        });
        
        playButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.newDirection = { x: 1, y: 0 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        this.gameRunning = true;
        this.isPaused = false;
        this.gridSize = 32;
        this.moveTimer = 0;
        this.moveDelay = 200;
    }

    preload() {
        this.load.image('snake_head', './assets/sprites/snake_head.png');
        this.load.image('snake_body', './assets/sprites/snake_body.png');
        this.load.image('snake_tail', './assets/sprites/snake_tail.png');
        this.load.image('food_apple', './assets/sprites/food_apple.png');
        this.load.image('game_background', './assets/sprites/game_background.png');
        this.load.image('ui_button_pause', './assets/sprites/ui_button_pause.png');
        this.load.image('score_0', './assets/sprites/score_0.png');
        this.load.image('score_1', './assets/sprites/score_1.png');
        this.load.image('score_2', './assets/sprites/score_2.png');
        this.load.image('score_3', './assets/sprites/score_3.png');
        this.load.image('score_4', './assets/sprites/score_4.png');
        this.load.image('score_5', './assets/sprites/score_5.png');
        this.load.image('score_6', './assets/sprites/score_6.png');
        this.load.image('score_7', './assets/sprites/score_7.png');
        this.load.image('score_8', './assets/sprites/score_8.png');
        this.load.image('score_9', './assets/sprites/score_9.png');
    }

    create() {
        this.add.tileSprite(0, 0, 800, 600, 'game_background').setOrigin(0);
        
        this.initializeSnake();
        this.spawnFood();
        this.setupInput();
        this.createUI();
    }

    initializeSnake() {
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = { x: 1, y: 0 };
        this.newDirection = { x: 1, y: 0 };
    }

    spawnFood() {
        let validPosition = false;
        let foodX, foodY;
        
        while (!validPosition) {
            foodX = Phaser.Math.Between(1, 23);
            foodY = Phaser.Math.Between(2, 17);
            
            validPosition = !this.snake.some(segment => segment.x === foodX && segment.y === foodY);
        }
        
        this.food = { x: foodX, y: foodY };
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.togglePause();
        });
    }

    createUI() {
        this.add.text(20, 20, 'SCORE:', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        
        this.add.text(400, 20, 'HIGH SCORE:', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        
        const pauseButton = this.add.image(750, 50, 'ui_button_pause').setInteractive();
        pauseButton.on('pointerdown', () => {
            this.togglePause();
        });
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.add.text(400, 300, 'PAUSED\nPress SPACE to resume', {
                fontSize: '32px',
                fill: '#ffff00',
                fontFamily: 'monospace',
                align: 'center'
            }).setOrigin(0.5).setDepth(100);
        }
    }

    update(time, delta) {
        if (!this.gameRunning || this.isPaused) return;
        
        this.handleInput();
        
        this.moveTimer += delta;
        if (this.moveTimer >= this.moveDelay) {
            this.moveSnake();
            this.moveTimer = 0;
        }
        
        this.render();
    }

    handleInput() {
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            if (this.direction.x !== 1) {
                this.newDirection = { x: -1, y: 0 };
            }
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            if (this.direction.x !== -1) {
                this.newDirection = { x: 1, y: 0 };
            }
        } else if (this.cursors.up.isDown || this.wasd.W.isDown) {
            if (this.direction.y !== 1) {
                this.newDirection = { x: 0, y: -1 };
            }
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            if (this.direction.y !== -1) {
                this.newDirection = { x: 0, y: 1 };
            }
        }
    }

    moveSnake() {
        this.direction = { ...this.newDirection };
        
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;
        
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.spawnFood();
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore.toString());
            }
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= 25 || head.y < 2 || head.y >= 18) {
            return true;
        }
        
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    render() {
        this.children.removeAll();
        
        this.add.tileSprite(0, 0, 800, 600, 'game_background').setOrigin(0);
        
        this.snake.forEach((segment, index) => {
            let texture;
            if (index === 0) {
                texture = 'snake_head';
            } else if (index === this.snake.length - 1) {
                texture = 'snake_tail';
            } else {
                texture = 'snake_body';
            }
            
            this.add.image(
                segment.x * this.gridSize + this.gridSize / 2,
                segment.y * this.gridSize + this.gridSize / 2,
                texture
            );
        });
        
        this.add.image(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            'food_apple'
        );
        
        this.createUI();
        this.displayScore();
    }

    displayScore() {
        const scoreStr = this.score.toString();
        const highScoreStr = this.highScore.toString();
        
        for (let i = 0; i < scoreStr.length; i++) {
            this.add.image(120 + i * 16, 32, `score_${scoreStr[i]}`);
        }
        
        for (let i = 0; i < highScoreStr.length; i++) {
            this.add.image(550 + i * 16, 32, `score_${highScoreStr[i]}`);
        }
    }

    gameOver() {
        this.gameRunning = false;
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
        this.load.image('ui_button_restart', './assets/sprites/ui_button_restart.png');
        this.load.image('ui_button_restart_hover', './assets/sprites/ui_button_restart_hover.png');
        this.load.image('game_background', './assets/sprites/game_background.png');
    }

    create() {
        this.add.tileSprite(0, 0, 800, 600, 'game_background').setOrigin(0);
        
        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        this.add.text(400, 280, `Final Score: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        this.add.text(400, 320, `High Score: ${this.highScore}`, {
            fontSize: '24px',
            fill: '#ffff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        const restartButton = this.add.image(400, 400, 'ui_button_restart').setInteractive();
        
        restartButton.on('pointerover', () => {
            restartButton.setTexture('ui_button_restart_hover');
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setTexture('ui_button_restart');
        });
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        this.add.text(400, 500, 'Press SPACE or click RESTART to play again', {
            fontSize: '16px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
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