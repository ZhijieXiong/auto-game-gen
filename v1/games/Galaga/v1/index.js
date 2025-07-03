class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.cursors = null;
        this.projectiles = null;
        this.enemies = null;
        this.enemyProjectiles = null;
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.gameOver = false;
        this.capturedShip = null;
        this.doubleShot = false;
        this.enemySpeed = 50;
        this.formationEnemies = [];
        this.divingEnemies = [];
        this.lastFired = 0;
        this.fireRate = 200;
        this.keys = {};
    }

    preload() {
        this.load.image('player-ship', './assets/images/player-ship.png');
        this.load.image('player-ship-captured', './assets/images/player-ship-captured.png');
        this.load.image('player-projectile', './assets/images/player-projectile.png');
        this.load.image('galaga-bee-idle', './assets/images/galaga-bee-idle.png');
        this.load.image('galaga-bee-diving', './assets/images/galaga-bee-diving.png');
        this.load.image('red-alien-idle', './assets/images/red-alien-idle.png');
        this.load.image('red-alien-diving', './assets/images/red-alien-diving.png');
        this.load.image('green-alien-idle', './assets/images/green-alien-idle.png');
        this.load.image('boss-galaga', './assets/images/boss-galaga.png');
        this.load.image('enemy-projectile', './assets/images/enemy-projectile.png');
        this.load.image('explosion', './assets/images/explosion.png');
        this.load.image('starfield', './assets/images/starfield.png');
        this.load.image('tractor-beam', './assets/images/tractor-beam.png');
    }

    create() {
        // Background
        this.starfield = this.add.tileSprite(400, 300, 800, 600, 'starfield');
        
        // Player
        this.player = this.physics.add.sprite(400, 550, 'player-ship');
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(24, 24);
        
        // Groups
        this.projectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyProjectiles = this.physics.add.group();
        this.explosions = this.physics.add.group();
        
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys.A = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keys.D = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keys.SPACE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keys.P = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        
        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        
        this.livesText = this.add.text(16, 40, 'Lives: 3', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        
        this.waveText = this.add.text(700, 16, 'Wave: 1', {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        
        // Collisions
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyProjectiles, this.playerHit, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        
        // Create initial wave
        this.createWave();
        
        // Enemy shooting timer
        this.enemyShootTimer = this.time.addEvent({
            delay: 1500,
            callback: this.enemyShoot,
            callbackScope: this,
            loop: true
        });
        
        // Formation movement timer
        this.formationTimer = this.time.addEvent({
            delay: 3000,
            callback: this.moveFormation,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        if (this.gameOver) return;
        
        // Scroll starfield
        this.starfield.tilePositionY -= 1;
        
        // Player movement
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Player shooting
        if (this.keys.SPACE.isDown && time > this.lastFired) {
            this.shoot();
            this.lastFired = time + this.fireRate;
        }
        
        // Clean up projectiles
        this.projectiles.children.entries.forEach(projectile => {
            if (projectile.y < 0) {
                projectile.destroy();
            }
        });
        
        this.enemyProjectiles.children.entries.forEach(projectile => {
            if (projectile.y > 600) {
                projectile.destroy();
            }
        });
        
        // Update diving enemies
        this.divingEnemies.forEach((enemy, index) => {
            if (enemy.active) {
                enemy.divingTime += delta;
                if (enemy.divingTime > 2000) {
                    // Return to formation
                    this.physics.moveTo(enemy, enemy.formationX, enemy.formationY, 100);
                    if (Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.formationX, enemy.formationY) < 10) {
                        enemy.setVelocity(0, 0);
                        enemy.diving = false;
                        enemy.setTexture(enemy.idleTexture);
                        this.divingEnemies.splice(index, 1);
                    }
                }
            }
        });
        
        // Check wave completion
        if (this.enemies.children.entries.length === 0 && !this.gameOver) {
            this.nextWave();
        }
    }

    shoot() {
        const projectile = this.physics.add.sprite(this.player.x, this.player.y - 20, 'player-projectile');
        projectile.setVelocityY(-400);
        projectile.body.setSize(4, 8);
        this.projectiles.add(projectile);
        
        if (this.doubleShot && this.capturedShip) {
            const projectile2 = this.physics.add.sprite(this.capturedShip.x, this.capturedShip.y - 20, 'player-projectile');
            projectile2.setVelocityY(-400);
            projectile2.body.setSize(4, 8);
            this.projectiles.add(projectile2);
        }
    }

    enemyShoot() {
        if (this.enemies.children.entries.length > 0) {
            const enemy = Phaser.Utils.Array.GetRandom(this.enemies.children.entries);
            if (enemy && enemy.active) {
                const projectile = this.physics.add.sprite(enemy.x, enemy.y + 20, 'enemy-projectile');
                projectile.setVelocityY(200);
                projectile.body.setSize(4, 8);
                this.enemyProjectiles.add(projectile);
            }
        }
    }

    hitEnemy(projectile, enemy) {
        projectile.destroy();
        
        // Create explosion
        const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
        explosion.setScale(0.5);
        this.time.delayedCall(200, () => explosion.destroy());
        
        // Add score
        let points = 100;
        if (enemy.enemyType === 'boss') points = 500;
        else if (enemy.enemyType === 'galaga') points = 200;
        else if (enemy.enemyType === 'red') points = 150;
        
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
        
        // Show score popup
        const scorePopup = this.add.text(enemy.x, enemy.y, '+' + points, {
            fontSize: '14px',
            fill: '#ffff00',
            fontFamily: 'monospace'
        });
        scorePopup.setOrigin(0.5);
        this.tweens.add({
            targets: scorePopup,
            y: enemy.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => scorePopup.destroy()
        });
        
        // Remove from diving enemies if present
        this.divingEnemies = this.divingEnemies.filter(e => e !== enemy);
        
        enemy.destroy();
    }

    playerHit(player, projectile) {
        projectile.destroy();
        this.playerDestroyed();
    }

    playerHitEnemy(player, enemy) {
        this.playerDestroyed();
    }

    playerDestroyed() {
        // Create explosion
        const explosion = this.add.sprite(this.player.x, this.player.y, 'explosion');
        this.time.delayedCall(300, () => explosion.destroy());
        
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);
        
        if (this.lives <= 0) {
            this.gameOver = true;
            this.showGameOver();
        } else {
            // Respawn player
            this.player.setPosition(400, 550);
            this.player.setAlpha(0.5);
            this.time.delayedCall(2000, () => {
                this.player.setAlpha(1);
            });
        }
    }

    showGameOver() {
        const gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'monospace'
        });
        gameOverText.setOrigin(0.5);
        
        const restartText = this.add.text(400, 350, 'Press SPACE to restart', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        });
        restartText.setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    createWave() {
        const formations = [
            { x: 200, y: 100, rows: 2, cols: 8, enemyType: 'green', spacing: 40 },
            { x: 200, y: 180, rows: 2, cols: 8, enemyType: 'red', spacing: 40 },
            { x: 360, y: 60, rows: 1, cols: 4, enemyType: 'galaga', spacing: 80 }
        ];
        
        formations.forEach(formation => {
            for (let row = 0; row < formation.rows; row++) {
                for (let col = 0; col < formation.cols; col++) {
                    const x = formation.x + (col * formation.spacing);
                    const y = formation.y + (row * 30);
                    
                    let texture = formation.enemyType + '-alien-idle';
                    if (formation.enemyType === 'galaga') texture = 'galaga-bee-idle';
                    
                    const enemy = this.physics.add.sprite(x, y, texture);
                    enemy.enemyType = formation.enemyType;
                    enemy.formationX = x;
                    enemy.formationY = y;
                    enemy.idleTexture = texture;
                    enemy.diving = false;
                    enemy.divingTime = 0;
                    enemy.body.setSize(24, 24);
                    
                    this.enemies.add(enemy);
                    this.formationEnemies.push(enemy);
                }
            }
        });
        
        // Add boss if wave > 3
        if (this.wave > 3) {
            const boss = this.physics.add.sprite(400, 80, 'boss-galaga');
            boss.enemyType = 'boss';
            boss.formationX = 400;
            boss.formationY = 80;
            boss.idleTexture = 'boss-galaga';
            boss.diving = false;
            boss.divingTime = 0;
            boss.body.setSize(32, 32);
            this.enemies.add(boss);
            this.formationEnemies.push(boss);
        }
    }

    moveFormation() {
        // Randomly select enemies to dive
        const availableEnemies = this.formationEnemies.filter(enemy => 
            enemy.active && !enemy.diving && Math.random() < 0.3
        );
        
        availableEnemies.forEach(enemy => {
            if (Math.random() < 0.5) {
                enemy.diving = true;
                enemy.divingTime = 0;
                
                let divingTexture = enemy.enemyType + '-alien-diving';
                if (enemy.enemyType === 'galaga') divingTexture = 'galaga-bee-diving';
                else if (enemy.enemyType === 'boss') divingTexture = 'boss-galaga';
                
                enemy.setTexture(divingTexture);
                
                // Create diving path
                const targetX = this.player.x + Phaser.Math.Between(-100, 100);
                const targetY = 500;
                
                this.physics.moveTo(enemy, targetX, targetY, 150);
                this.divingEnemies.push(enemy);
            }
        });
    }

    nextWave() {
        this.wave++;
        this.waveText.setText('Wave: ' + this.wave);
        
        // Show wave clear bonus
        const bonusText = this.add.text(400, 300, 'WAVE CLEAR\n+1000 BONUS', {
            fontSize: '32px',
            fill: '#00ff00',
            fontFamily: 'monospace',
            align: 'center'
        });
        bonusText.setOrigin(0.5);
        
        this.score += 1000;
        this.scoreText.setText('Score: ' + this.score);
        
        this.time.delayedCall(2000, () => {
            bonusText.destroy();
            this.formationEnemies = [];
            this.divingEnemies = [];
            this.createWave();
        });
    }
}

class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
        this.add.text(400, 200, 'GALAGA', {
            fontSize: '64px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        this.add.text(400, 300, 'Arrow Keys or A/D to Move\nSpacebar to Shoot\nP to Pause', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);
        
        this.add.text(400, 400, 'Press SPACE to Start', {
            fontSize: '24px',
            fill: '#ffff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#000033',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [StartScene, GameScene]
};

const game = new Phaser.Game(config);