// Platform Game - Pure JavaScript dengan Level dan Musuh
// Tambahan: Sistem level dan musuh yang bergerak

// Setup Canvas
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
canvas.style.border = '2px solid #333';
document.body.appendChild(canvas);

// Setup styling untuk body
document.body.style.margin = '0';
document.body.style.padding = '20px';
document.body.style.display = 'flex';
document.body.style.justifyContent = 'center';
document.body.style.alignItems = 'center';
document.body.style.minHeight = '100vh';
document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
document.body.style.fontFamily = 'Arial, sans-serif';

const ctx = canvas.getContext('2d');

// Assets - Images
const assets = {
    sky: null,
    ground: null,
    star: null,
    dude: null
};

// Loading status
let assetsLoaded = false;
let loadedCount = 0;
const totalAssets = 4;

// Game variables
let score = 0;
let lives = 3;
let currentLevel = 1;
let gameRunning = false;
let gameState = 'playing'; // 'playing', 'gameOver', 'levelComplete'
let invulnerableTime = 0;

// Player object
const player = {
    x: 100,
    y: 450,
    width: 52,
    height: 64,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    speed: 160,
    jumpPower: 330,
    bounce: 0.2,
    currentFrame: 0,
    animationTimer: 0,
    facing: 'right'
};

// Level configurations
const levelConfigs = {
    1: {
        platforms: [
            { x: 0, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 200, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 400, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 600, y: 550, width: 200, height: 70, type: 'ground' },
            { x: 150, y: 450, width: 120, height: 60, type: 'platform' },
            { x: 350, y: 350, width: 120, height: 60, type: 'platform' },
            { x: 550, y: 250, width: 120, height: 60, type: 'platform' }
        ],
        enemies: [
            { x: 300, y: 500, width: 40, height: 40, type: 'walker', speed: 50, direction: 1, minX: 200, maxX: 400 },
            { x: 500, y: 200, width: 40, height: 40, type: 'walker', speed: 60, direction: -1, minX: 450, maxX: 650 }
        ],
        starCount: 8,
        backgroundColor: '#87CEEB'
    },
    2: {
        platforms: [
            { x: 0, y: 550, width: 150, height: 70, type: 'ground' },
            { x: 250, y: 550, width: 150, height: 70, type: 'ground' },
            { x: 500, y: 550, width: 150, height: 70, type: 'ground' },
            { x: 650, y: 550, width: 150, height: 70, type: 'ground' },
            { x: 100, y: 400, width: 100, height: 40, type: 'platform' },
            { x: 300, y: 300, width: 100, height: 40, type: 'platform' },
            { x: 500, y: 200, width: 100, height: 40, type: 'platform' },
            { x: 700, y: 100, width: 100, height: 40, type: 'platform' },
            { x: 50, y: 150, width: 80, height: 40, type: 'platform' }
        ],
        enemies: [
            { x: 200, y: 500, width: 40, height: 40, type: 'walker', speed: 70, direction: 1, minX: 150, maxX: 350 },
            { x: 450, y: 160, width: 40, height: 40, type: 'walker', speed: 80, direction: -1, minX: 400, maxX: 600 },
            { x: 600, y: 500, width: 40, height: 40, type: 'jumper', speed: 60, direction: 1, minX: 500, maxX: 750, jumpTimer: 0 }
        ],
        starCount: 10,
        backgroundColor: '#FF6B6B'
    },
    3: {
        platforms: [
            { x: 0, y: 550, width: 100, height: 70, type: 'ground' },
            { x: 200, y: 550, width: 100, height: 70, type: 'ground' },
            { x: 400, y: 550, width: 100, height: 70, type: 'ground' },
            { x: 600, y: 550, width: 100, height: 70, type: 'ground' },
            { x: 700, y: 550, width: 100, height: 70, type: 'ground' },
            { x: 50, y: 450, width: 80, height: 30, type: 'platform' },
            { x: 200, y: 350, width: 80, height: 30, type: 'platform' },
            { x: 350, y: 250, width: 80, height: 30, type: 'platform' },
            { x: 500, y: 150, width: 80, height: 30, type: 'platform' },
            { x: 650, y: 50, width: 80, height: 30, type: 'platform' }
        ],
        enemies: [
            { x: 150, y: 500, width: 40, height: 40, type: 'walker', speed: 90, direction: 1, minX: 100, maxX: 300 },
            { x: 450, y: 500, width: 40, height: 40, type: 'walker', speed: 85, direction: -1, minX: 400, maxX: 600 },
            { x: 300, y: 210, width: 40, height: 40, type: 'jumper', speed: 70, direction: 1, minX: 200, maxX: 430, jumpTimer: 0 },
            { x: 550, y: 110, width: 40, height: 40, type: 'jumper', speed: 75, direction: -1, minX: 500, maxX: 730, jumpTimer: 0 }
        ],
        starCount: 12,
        backgroundColor: '#32CD32'
    }
};

// Current level data
let platforms = [];
let enemies = [];
let stars = [];

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState === 'levelComplete') {
        nextLevel();
    }
    if (e.code === 'Space' && gameState === 'gameOver') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Physics constants
const gravity = 300;
const deltaTime = 1/60;

// Asset loading function
function loadAssets() {
    console.log('Loading assets...');
    
    // Load sky background
    assets.sky = new Image();
    assets.sky.onload = () => {
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.sky.onerror = () => {
        console.log('Sky asset not found, using fallback');
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.sky.src = 'assets/sky.png';

    // Load ground/platform
    assets.ground = new Image();
    assets.ground.onload = () => {
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.ground.onerror = () => {
        console.log('Ground asset not found, using fallback');
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.ground.src = 'assets/platform.png';

    // Load star
    assets.star = new Image();
    assets.star.onload = () => {
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.star.onerror = () => {
        console.log('Star asset not found, using fallback');
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.star.src = 'assets/star.png';

    // Load player sprite
    assets.dude = new Image();
    assets.dude.onload = () => {
        loadedCount++;
        console.log('Dude sprite loaded - Actual size:', assets.dude.width, 'x', assets.dude.height);
        checkAllAssetsLoaded();
    };
    assets.dude.onerror = () => {
        console.log('Dude asset not found, using fallback');
        loadedCount++;
        checkAllAssetsLoaded();
    };
    assets.dude.src = 'assets/dude.png';
}

function checkAllAssetsLoaded() {
    if (loadedCount >= totalAssets) {
        assetsLoaded = true;
        gameRunning = true;
        console.log('All assets loaded, starting game...');
        init();
    }
}

// Initialize level
function initLevel(levelNum) {
    const config = levelConfigs[levelNum];
    if (!config) {
        console.log('Level completed! Game finished!');
        gameState = 'gameOver';
        return;
    }

    platforms = [...config.platforms];
    enemies = config.enemies.map(e => ({
        ...e,
        velocityX: e.speed * e.direction,
        velocityY: 0,
        onGround: false,
        jumpTimer: e.jumpTimer || 0
    }));

    createStars(config.starCount);
    
    // Reset player position
    player.x = 100;
    player.y = 450;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = false;

    console.log(`Level ${levelNum} initialized with ${enemies.length} enemies and ${config.starCount} stars`);
}

// Initialize stars
function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: 50 + (i * 60) % (canvas.width - 100),
            y: Math.random() * 200 + 50,
            width: 30,
            height: 30,
            velocityY: 0,
            collected: false,
            bounce: Math.random() * 0.4 + 0.4
        });
    }
}

// Collision detection
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Update player
function updatePlayer() {
    if (gameState !== 'playing') return;

    // Decrease invulnerability time
    if (invulnerableTime > 0) {
        invulnerableTime -= deltaTime;
    }

    // Handle input dan animasi
    if (keys['ArrowLeft']) {
        player.velocityX = -player.speed;
        player.facing = 'left';
        player.animationTimer++;
        if (player.animationTimer > 8) {
            player.currentFrame = (player.currentFrame + 1) % 4;
            player.animationTimer = 0;
        }
    } else if (keys['ArrowRight']) {
        player.velocityX = player.speed;
        player.facing = 'right';
        player.animationTimer++;
        if (player.animationTimer > 8) {
            player.currentFrame = (player.currentFrame + 1) % 4;
            player.animationTimer = 0;
        }
    } else {
        player.velocityX = 0;
        player.currentFrame = 0;
        player.animationTimer = 0;
    }

    if (keys['ArrowUp'] && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }

    // Apply gravity
    player.velocityY += gravity * deltaTime;

    // Update position
    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;

    // World bounds
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }

    // Platform collision
    player.onGround = false;
    
    for (let platform of platforms) {
        if (isColliding(player, platform)) {
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = -player.velocityY * player.bounce;
                player.onGround = true;
            }
        }
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }

    // Check enemy collision
    if (invulnerableTime <= 0) {
        for (let enemy of enemies) {
            if (isColliding(player, enemy)) {
                hitPlayer();
                break;
            }
        }
    }
}

// Update enemies
function updateEnemies() {
    if (gameState !== 'playing') return;

    for (let enemy of enemies) {
        // Apply gravity
        enemy.velocityY += gravity * deltaTime;

        // Update position
        enemy.x += enemy.velocityX * deltaTime;
        enemy.y += enemy.velocityY * deltaTime;

        // Platform collision for enemies
        enemy.onGround = false;
        
        for (let platform of platforms) {
            if (isColliding(enemy, platform)) {
                if (enemy.velocityY > 0 && enemy.y < platform.y) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velocityY = 0;
                    enemy.onGround = true;
                }
            }
        }

        // Ground collision
        if (enemy.y + enemy.height > canvas.height) {
            enemy.y = canvas.height - enemy.height;
            enemy.velocityY = 0;
            enemy.onGround = true;
        }

        // Enemy type specific behavior
        if (enemy.type === 'walker') {
            // Turn around at boundaries
            if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
                enemy.direction *= -1;
                enemy.velocityX = enemy.speed * enemy.direction;
            }
        } else if (enemy.type === 'jumper') {
            // Jumping enemy behavior
            enemy.jumpTimer += deltaTime;
            
            if (enemy.jumpTimer > 2 && enemy.onGround) {
                enemy.velocityY = -200; // Jump
                enemy.jumpTimer = 0;
            }

            // Turn around at boundaries
            if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
                enemy.direction *= -1;
                enemy.velocityX = enemy.speed * enemy.direction;
            }
        }
    }
}

// Update stars
function updateStars() {
    if (gameState !== 'playing') return;

    for (let star of stars) {
        if (!star.collected) {
            star.velocityY += gravity * deltaTime * 0.5;
            star.y += star.velocityY * deltaTime;

            for (let platform of platforms) {
                if (isColliding(star, platform) && star.velocityY > 0) {
                    star.y = platform.y - star.height;
                    star.velocityY = -star.velocityY * star.bounce;
                }
            }

            if (star.y + star.height > canvas.height) {
                star.y = canvas.height - star.height;
                star.velocityY = -star.velocityY * star.bounce;
            }

            if (isColliding(player, star)) {
                collectStar(star);
            }
        }
    }
}

function collectStar(star) {
    star.collected = true;
    score += 10;
    
    let activeStars = stars.filter(s => !s.collected).length;
    if (activeStars === 0) {
        gameState = 'levelComplete';
        console.log('Level completed!');
    }
}

function hitPlayer() {
    lives--;
    invulnerableTime = 2; // 2 seconds of invulnerability
    
    if (lives <= 0) {
        gameState = 'gameOver';
        console.log('Game Over!');
    } else {
        // Reset player position
        player.x = 100;
        player.y = 450;
        player.velocityX = 0;
        player.velocityY = 0;
    }
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > 3) {
        gameState = 'gameOver';
        console.log('Congratulations! You completed all levels!');
        return;
    }
    
    initLevel(currentLevel);
    gameState = 'playing';
}

function restartGame() {
    currentLevel = 1;
    score = 0;
    lives = 3;
    gameState = 'playing';
    invulnerableTime = 0;
    initLevel(currentLevel);
}

// Drawing functions
function drawBackground() {
    const config = levelConfigs[currentLevel];
    const bgColor = config ? config.backgroundColor : '#87CEEB';
    
    if (assets.sky && assets.sky.complete && assets.sky.naturalHeight !== 0) {
        ctx.drawImage(assets.sky, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPlatforms() {
    for (let platform of platforms) {
        if (assets.ground && assets.ground.complete && assets.ground.naturalHeight !== 0) {
            ctx.drawImage(assets.ground, 
                platform.x, platform.y, 
                platform.width, platform.height);
        } else {
            // Fallback platform
            if (platform.type === 'ground') {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.fillStyle = '#228B22';
                ctx.fillRect(platform.x, platform.y, platform.width, 8);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            } else {
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(platform.x, platform.y, platform.width, 6);
                ctx.strokeStyle = '#8B7355';
                ctx.lineWidth = 1;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        if (enemy.type === 'walker') {
            // Walker enemy - red square with eyes
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
            ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 8, 6, 6);
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.fillRect(enemy.x + 10, enemy.y + 10, 2, 2);
            ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 10, 2, 2);
            
            // Mouth
            ctx.fillStyle = '#000000';
            ctx.fillRect(enemy.x + 12, enemy.y + 24, enemy.width - 24, 4);
            
        } else if (enemy.type === 'jumper') {
            // Jumper enemy - green circle with spikes
            ctx.fillStyle = '#00AA00';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Spikes
            ctx.fillStyle = '#006600';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const spikeX = enemy.x + enemy.width/2 + Math.cos(angle) * (enemy.width/2 - 5);
                const spikeY = enemy.y + enemy.height/2 + Math.sin(angle) * (enemy.height/2 - 5);
                const tipX = enemy.x + enemy.width/2 + Math.cos(angle) * (enemy.width/2 + 5);
                const tipY = enemy.y + enemy.height/2 + Math.sin(angle) * (enemy.height/2 + 5);
                
                ctx.beginPath();
                ctx.moveTo(spikeX, spikeY);
                ctx.lineTo(tipX, tipY);
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2 - 8, enemy.y + enemy.height/2 - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2 + 8, enemy.y + enemy.height/2 - 5, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawPlayer() {
    // Add flashing effect during invulnerability
    if (invulnerableTime > 0 && Math.floor(invulnerableTime * 10) % 2 === 0) {
        return; // Skip drawing to create flashing effect
    }

    if (assets.dude && assets.dude.complete && assets.dude.naturalHeight !== 0) {
        const spriteWidth = assets.dude.width;
        const spriteHeight = assets.dude.height;
        
        const totalFrames = 9;
        const frameWidth = Math.floor(spriteWidth / totalFrames);
        const frameHeight = spriteHeight;
        
        let frameX = 0;
        let frameY = 0;
        
        if (player.velocityX === 0) {
            frameX = 4 * frameWidth;
            frameY = 0;
        } else {
            if (player.facing === 'left') {
                frameX = player.currentFrame * frameWidth;
                frameY = 0;
            } else {
                frameX = (5 + player.currentFrame) * frameWidth;
                frameY = 0;
            }
        }
        
        if (frameX >= spriteWidth) {
            frameX = 4 * frameWidth;
        }
        
        try {
            ctx.drawImage(
                assets.dude,
                frameX, frameY,
                frameWidth, frameHeight,
                player.x, player.y,
                player.width, player.height
            );
        } catch (error) {
            console.error('Error drawing sprite:', error);
            drawFallbackPlayer();
        }
    } else {
        drawFallbackPlayer();
    }
}

function drawFallbackPlayer() {
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(player.x + 8, player.y + 4, player.width - 16, 20);
    
    ctx.fillStyle = '#000';
    if (player.facing === 'left') {
        ctx.fillRect(player.x + 10, player.y + 10, 3, 3);
        ctx.fillRect(player.x + 16, player.y + 10, 3, 3);
    } else {
        ctx.fillRect(player.x + player.width - 19, player.y + 10, 3, 3);
        ctx.fillRect(player.x + player.width - 13, player.y + 10, 3, 3);
    }
    
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x + 6, player.y + 24, player.width - 12, 24);
    
    ctx.fillStyle = '#FFE4B5';
    ctx.fillRect(player.x + 2, player.y + 28, 8, 16);
    ctx.fillRect(player.x + player.width - 10, player.y + 28, 8, 16);
    
    ctx.fillStyle = '#000080';
    ctx.fillRect(player.x + 8, player.y + 48, 8, 16);
    ctx.fillRect(player.x + player.width - 16, player.y + 48, 8, 16);
}

function drawStars() {
    for (let star of stars) {
        if (!star.collected) {
            if (assets.star && assets.star.complete && assets.star.naturalHeight !== 0) {
                ctx.drawImage(assets.star, star.x, star.y, star.width, star.height);
            } else {
                // Fallback star
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                let centerX = star.x + star.width / 2;
                let centerY = star.y + star.height / 2;
                let radius = star.width / 2;
                
                for (let i = 0; i < 5; i++) {
                    let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    let x = centerX + Math.cos(angle) * radius;
                    let y = centerY + Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

function drawUI() {
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 16, 32);
    
    ctx.fillStyle = '#FFF';
    ctx.fillText('Score: ' + score, 14, 30);
    
    // Lives
    ctx.fillStyle = '#000';
    ctx.fillText('Lives: ' + lives, 16, 62);
    
    ctx.fillStyle = '#FFF';
    ctx.fillText('Lives: ' + lives, 14, 60);
    
    // Level
    ctx.fillStyle = '#000';
    ctx.fillText('Level: ' + currentLevel, 16, 92);
    
    ctx.fillStyle = '#FFF';
    ctx.fillText('Level: ' + currentLevel, 14, 90);
    
    // Stars remaining
    const starsLeft = stars.filter(s => !s.collected).length;
    ctx.fillStyle = '#000';
    ctx.fillText('Stars: ' + starsLeft, 200, 32);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Stars: ' + starsLeft, 198, 30);
}

function drawGameOver() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Over text
    ctx.fillStyle = '#FFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    
    if (currentLevel > 3) {
        ctx.fillText('SELAMAT!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Anda telah menyelesaikan semua level!', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Skor Akhir: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    } else {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Skor Akhir: ' + score, canvas.width / 2, canvas.height / 2);
    }
    
    ctx.font = '18px Arial';
    ctx.fillText('Tekan SPASI untuk bermain lagi', canvas.width / 2, canvas.height / 2 + 80);
    ctx.textAlign = 'left';
}

function drawLevelComplete() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Level Complete text
    ctx.fillStyle = '#00FF00';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL SELESAI!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText('Level ' + currentLevel + ' berhasil diselesaikan!', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Skor: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    
    ctx.font = '18px Arial';
    if (currentLevel < 3) {
        ctx.fillText('Tekan SPASI untuk level berikutnya', canvas.width / 2, canvas.height / 2 + 80);
    } else {
        ctx.fillText('Tekan SPASI untuk menyelesaikan game', canvas.width / 2, canvas.height / 2 + 80);
    }
    ctx.textAlign = 'left';
}

function drawInstructions() {
    // Instructions panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 200, canvas.height - 120, 190, 110);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.fillText('Kontrol:', canvas.width - 190, canvas.height - 100);
    ctx.fillText('← → : Bergerak', canvas.width - 190, canvas.height - 80);
    ctx.fillText('↑ : Lompat', canvas.width - 190, canvas.height - 60);
    ctx.fillText('Kumpulkan semua bintang!', canvas.width - 190, canvas.height - 40);
    ctx.fillText('Hindari musuh merah & hijau!', canvas.width - 190, canvas.height - 20);
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        updateStars();
    }
    
    // Draw everything
    drawBackground();
    drawPlatforms();
    drawStars();
    drawEnemies();
    drawPlayer();
    drawUI();
    drawInstructions();
    
    // Draw overlays based on game state
    if (gameState === 'gameOver') {
        drawGameOver();
    } else if (gameState === 'levelComplete') {
        drawLevelComplete();
    }
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Initialize game
function init() {
    console.log('Initializing game...');
    initLevel(currentLevel);
    gameLoop();
    console.log('Game started!');
}

// Start loading assets
loadAssets();

// Debug info (can be removed in production)
console.log('Platform Game initialized');
console.log('Canvas size:', canvas.width, 'x', canvas.height);
console.log('Use arrow keys to move, up arrow to jump');
console.log('Collect all stars to complete each level!');

// Add window resize handler for responsive canvas (optional)
window.addEventListener('resize', () => {
    // Keep the canvas centered
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
});

// Prevent arrow key scrolling on the page
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

// Add pause functionality (optional)
let gamePaused = false;
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
        gamePaused = !gamePaused;
        if (!gamePaused && gameRunning) {
            gameLoop();
        }
    }
});

// Performance monitoring (optional - can be removed)
let lastTime = 0;
let frameCount = 0;
let fps = 0;

function updateFPS(currentTime) {
    frameCount++;
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Enhanced game loop with FPS monitoring
function enhancedGameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    updateFPS(currentTime);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    if (gameState === 'playing') {
        updatePlayer();
        updateEnemies();
        updateStars();
    }
    
    // Draw everything
    drawBackground();
    drawPlatforms();
    drawStars();
    drawEnemies();
    drawPlayer();
    drawUI();
    drawInstructions();
    
    // Draw FPS (optional debug info)
    if (fps > 0) {
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText('FPS: ' + fps, canvas.width - 60, 20);
    }
    
    // Draw overlays based on game state
    if (gameState === 'gameOver') {
        drawGameOver();
    } else if (gameState === 'levelComplete') {
        drawLevelComplete();
    }
    
    // Continue the loop
    requestAnimationFrame(enhancedGameLoop);
}

// Replace the basic gameLoop with enhanced version if needed
// Uncomment the line below to use enhanced game loop with FPS counter
// gameLoop = enhancedGameLoop;