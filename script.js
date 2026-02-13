// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let score = 0;
let level = 1;
let lives = 3;
let gameRunning = false;
let ballLaunched = false;

// Ball Object
const ball = {
    x: 200,
    y: 100,
    radius: 6,
    vx: 0,
    vy: 0,
    gravity: 0.3,
    friction: 0.98,
    launched: false
};

// Left Flipper
const leftFlipper = {
    x: 120,
    y: 520,
    length: 60,
    width: 10,
    angle: 0,
    maxAngle: 0.4,
    returnSpeed: 0.15,
    active: false
};

// Right Flipper
const rightFlipper = {
    x: 280,
    y: 520,
    length: 60,
    width: 10,
    angle: 0,
    maxAngle: -0.4,
    returnSpeed: -0.15,
    active: false
};

// Bumpers (collectible objects)
const bumpers = [
    { x: 100, y: 150, radius: 15, points: 100, hit: false },
    { x: 200, y: 150, radius: 15, points: 100, hit: false },
    { x: 300, y: 150, radius: 15, points: 100, hit: false },
    { x: 80, y: 280, radius: 15, points: 150, hit: false },
    { x: 320, y: 280, radius: 15, points: 150, hit: false },
    { x: 150, y: 380, radius: 15, points: 150, hit: false },
    { x: 250, y: 380, radius: 15, points: 150, hit: false }
];

// Walls for bouncing
const walls = [
    { x1: 10, y1: 0, x2: 10, y2: 600 },        // Left wall
    { x1: 390, y1: 0, x2: 390, y2: 600 },      // Right wall
    { x1: 10, y1: 0, x2: 390, y2: 0 },         // Top wall
    { x1: 100, y1: 550, x2: 300, y2: 550 }    // Center barrier
];

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resetBtn').addEventListener('click', resetGame);

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'z') {
        leftFlipper.active = true;
    }
    if (e.key.toLowerCase() === 'm') {
        rightFlipper.active = true;
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (!ballLaunched && gameRunning) {
            launchBall();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() === 'z') {
        leftFlipper.active = false;
    }
    if (e.key.toLowerCase() === 'm') {
        rightFlipper.active = false;
    }
});

// Game Functions
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        ballLaunched = false;
        document.getElementById('gameOverMessage').classList.remove('show');
        resetBall();
    }
}

function resetGame() {
    score = 0;
    level = 1;
    lives = 3;
    gameRunning = false;
    ballLaunched = false;
    resetBall();
    bumpers.forEach(bumper => bumper.hit = false);
    updateDisplay();
    document.getElementById('gameOverMessage').classList.remove('show');
}

function resetBall() {
    ball.x = 200;
    ball.y = 100;
    ball.vx = 0;
    ball.vy = 0;
    ballLaunched = false;
}

function launchBall() {
    ball.vx = (Math.random() - 0.5) * 4;
    ball.vy = -8 - (level * 0.5);
    ballLaunched = true;
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lives').textContent = lives;
}

function updateBall() {
    if (!gameRunning) return;

    // Apply gravity
    ball.vy += ball.gravity;

    // Apply friction
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions
    if (ball.x - ball.radius < 10) {
        ball.x = 10 + ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.8;
    }
    if (ball.x + ball.radius > 390) {
        ball.x = 390 - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.8;
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy) * 0.8;
    }

    // Ball lost
    if (ball.y - ball.radius > 600) {
        lives--;
        updateDisplay();
        if (lives <= 0) {
            gameRunning = false;
            showGameOver();
        } else {
            resetBall();
            ballLaunched = false;
        }
    }

    // Bumper collisions
    bumpers.forEach(bumper => {
        const dx = ball.x - bumper.x;
        const dy = ball.y - bumper.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + bumper.radius) {
            score += bumper.points;
            bumper.hit = true;

            const angle = Math.atan2(dy, dx);
            ball.vx = Math.cos(angle) * 8;
            ball.vy = Math.sin(angle) * 8;

            setTimeout(() => {
                bumper.hit = false;
            }, 200);

            updateDisplay();
        }
    });

    // Center barrier collision
    if (ball.y > 545 && ball.y < 555 && ball.x > 100 && ball.x < 300) {
        ball.vy = -Math.abs(ball.vy) * 0.8;
        score += 50;
        updateDisplay();
    }

    // Flipper collisions
    checkFlipperCollision(leftFlipper);
    checkFlipperCollision(rightFlipper);
}

function checkFlipperCollision(flipper) {
    const flipperAngle = flipper.angle;
    const flipperEndX = flipper.x + Math.cos(flipperAngle) * flipper.length;
    const flipperEndY = flipper.y + Math.sin(flipperAngle) * flipper.length;

    // Check distance from ball to flipper line
    const dx = flipperEndX - flipper.x;
    const dy = flipperEndY - flipper.y;
    const px = ball.x - flipper.x;
    const py = ball.y - flipper.y;

    const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
    const closestX = flipper.x + t * dx;
    const closestY = flipper.y + t * dy;

    const distance = Math.sqrt(
        Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2)
    );

    if (distance < ball.radius + flipper.width / 2) {
        const hitAngle = Math.atan2(ball.y - closestY, ball.x - closestX);
        ball.vx = Math.cos(hitAngle) * 12;
        ball.vy = Math.sin(hitAngle) * 12;
        score += 25;
        updateDisplay();
    }
}

function updateFlippers() {
    // Left flipper
    if (leftFlipper.active && leftFlipper.angle < leftFlipper.maxAngle) {
        leftFlipper.angle += 0.15;
    } else if (!leftFlipper.active && leftFlipper.angle > 0) {
        leftFlipper.angle -= leftFlipper.returnSpeed;
    }
    leftFlipper.angle = Math.max(0, Math.min(leftFlipper.maxAngle, leftFlipper.angle));

    // Right flipper
    if (rightFlipper.active && rightFlipper.angle > rightFlipper.maxAngle) {
        rightFlipper.angle -= 0.15;
    } else if (!rightFlipper.active && rightFlipper.angle < 0) {
        rightFlipper.angle -= rightFlipper.returnSpeed;
    }
    rightFlipper.angle = Math.min(0, Math.max(rightFlipper.maxAngle, rightFlipper.angle));
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw walls
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, 600);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(390, 0);
    ctx.lineTo(390, 600);
    ctx.stroke();

    // Draw center barrier
    ctx.strokeStyle = '#ff006e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 550);
    ctx.lineTo(300, 550);
    ctx.stroke();

    // Draw bumpers
    bumpers.forEach(bumper => {
        ctx.fillStyle = bumper.hit ? '#ffff00' : '#00ff88';
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw ball
    ctx.fillStyle = '#ff006e';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw flippers
    drawFlipper(leftFlipper);
    drawFlipper(rightFlipper);

    // Draw launch zone indicator
    if (!ballLaunched && gameRunning) {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(180, 20, 40, 80);
        ctx.setLineDash([]);
    }
}

function drawFlipper(flipper) {
    const endX = flipper.x + Math.cos(flipper.angle) * flipper.length;
    const endY = flipper.y + Math.sin(flipper.angle) * flipper.length;

    ctx.strokeStyle = flipper.active ? '#ffff00' : '#00d4ff';
    ctx.lineWidth = flipper.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(flipper.x, flipper.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw pivot point
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(flipper.x, flipper.y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function showGameOver() {
    const message = document.getElementById('gameOverMessage');
    message.textContent = `GAME OVER! Final Score: ${score}`;
    message.classList.add('show');
}

// Game loop
function gameLoop() {
    updateBall();
    updateFlippers();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateDisplay();
gameLoop();