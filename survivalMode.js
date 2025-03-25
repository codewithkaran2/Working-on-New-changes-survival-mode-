// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE
// ============================

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player setup
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 100,
  width: 50,
  height: 50,
  speed: 5,
  baseSpeed: 5,
  health: 100,
  score: 0,
  bullets: [],
  shieldActive: false,
  dashCooldown: 0,
  lastShot: 0
};

// Arrays for enemies, enemy bullets, and power-ups
const enemies = [];
const enemyBullets = [];
const powerUps = [];
const powerUpLifetime = 10000; // ms

// Global timer and wave
let gameStartTime = 0;
let wave = 1;

// Controls using lower-case keys
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Function to update active power-up display
function setActivePowerUp(type, duration = 5000) {
  const powerUpText = document.getElementById("powerUpText");
  powerUpText.textContent = "Power Up: " + type;
  // Clear after duration
  setTimeout(() => {
    powerUpText.textContent = "Power Up: None";
  }, duration);
}

// Spawn an enemy with increasing difficulty based on wave
function spawnEnemy() {
  const enemy = {
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: Math.random() * 2 + 1 + wave * 0.2,
    health: 30 + wave * 5,
    lastShotTime: 0
  };
  enemies.push(enemy);
}

// Spawn a power-up with a lifetime counter
function spawnPowerUp() {
  const types = ["health", "shield", "speed", "bullet"];
  const type = types[Math.floor(Math.random() * types.length)];
  const powerUp = {
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type: type,
    lifetime: powerUpLifetime,
    spawnTime: Date.now()
  };
  powerUps.push(powerUp);
}

// Enemy shooting: each enemy occasionally fires a bullet downward
function enemyShoot(enemy) {
  if (Date.now() - enemy.lastShotTime > 2000 && Math.random() < 0.02) {
    enemyBullets.push({
      x: enemy.x + enemy.width / 2 - 5,
      y: enemy.y + enemy.height,
      width: 10,
      height: 10,
      speed: 4 + wave * 0.3
    });
    enemy.lastShotTime = Date.now();
  }
}

// Shoot a bullet from the player's position
function shootBullet() {
  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 10,
    speed: 6
  });
}

// Dash functionality (increases speed temporarily)
function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000; // cooldown in ms
    setTimeout(() => {
      player.speed = player.baseSpeed;
    }, 300); // dash lasts 300ms
  }
}

// Collision detection
function isColliding(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

// Game Over function to show overlay and stop game loop
function gameOver() {
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

// Main game loop
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update wave and survival timer based on elapsed time
  const elapsedTime = Date.now() - gameStartTime;
  wave = Math.floor(elapsedTime / 30000) + 1; // increase wave every 30 seconds
  const survivalTime = Math.floor(elapsedTime / 1000);

  // Player movement (W, A, S, D)
  if (keys["a"] && player.x > 0) player.x -= player.speed;
  if (keys["d"] && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys["w"] && player.y > 0) player.y -= player.speed;
  if (keys["s"] && player.y + player.height < canvas.height) player.y += player.speed;

  // Shooting with SPACE (limit shooting rate)
  if (keys[" "] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // Shield activation with Q
  player.shieldActive = !!keys["q"];

  // Dash activation with E
  if (keys["e"]) dash();

  // Decrement dash cooldown
  if (player.dashCooldown > 0) {
    player.dashCooldown -= 16;
  }

  // Update player's bullets
  player.bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) player.bullets.splice(index, 1);
  });

  // Update enemies and make them shoot
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (enemy.y > canvas.height) {
      enemies.splice(index, 1);
      return;
    }

    enemyShoot(enemy);

    // Collision: enemy hits player
    if (isColliding(player, enemy)) {
      if (!player.shieldActive) player.health -= 10;
      enemies.splice(index, 1);
      return;
    }

    // Player bullets collide with enemy
    player.bullets.forEach((bullet, bIndex) => {
      if (isColliding(bullet, enemy)) {
        enemy.health -= 20;
        player.bullets.splice(bIndex, 1);
        if (enemy.health <= 0) {
          player.score += 10;
          enemies.splice(index, 1);
        }
      }
    });
  });

  // Update enemy bullets
  enemyBullets.forEach((bullet, index) => {
    bullet.y += bullet.speed;
    if (isColliding(bullet, player)) {
      if (!player.shieldActive) player.health -= 10;
      enemyBullets.splice(index, 1);
    } else if (bullet.y > canvas.height) {
      enemyBullets.splice(index, 1);
    }
  });

  // Update power-ups (lifetime and collection)
  const currentTime = Date.now();
  powerUps.forEach((powerUp, index) => {
    const elapsed = currentTime - powerUp.spawnTime;
    const remaining = Math.max(0, powerUpLifetime - elapsed);
    powerUp.lifetime = remaining;
    if (remaining <= 0) {
      powerUps.splice(index, 1);
      return;
    }
    if (isColliding(player, powerUp)) {
      if (powerUp.type === "health") {
        player.health = Math.min(100, player.health + 20);
      } else if (powerUp.type === "shield") {
        player.shieldActive = true;
      } else if (powerUp.type === "speed") {
        player.speed += 2;
      } else if (powerUp.type === "bullet") {
        player.bullets.forEach(b => b.speed += 2);
      }
      setActivePowerUp(powerUp.type);
      powerUps.splice(index, 1);
    }
  });

  // Draw player
  ctx.fillStyle = "blue";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw player's bullets
  ctx.fillStyle = "red";
  player.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemies
  ctx.fillStyle = "green";
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Draw enemy bullets
  ctx.fillStyle = "orange";
  enemyBullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw power-ups with countdown timer (in seconds)
  powerUps.forEach(powerUp => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    const seconds = (powerUp.lifetime / 1000).toFixed(1);
    ctx.fillText(seconds + "s", powerUp.x + 2, powerUp.y + powerUp.height / 2);
  });

  // UI elements
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Health: ${player.health}`, 10, 30);
  ctx.fillText(`Score: ${player.score}`, 10, 60);
  ctx.fillText(`Wave: ${wave}`, 10, 90);
  ctx.fillText(`Time: ${Math.floor((Date.now() - gameStartTime) / 1000)}s`, 10, 120);

  // Check for Game Over
  if (player.health <= 0) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    gameOver();
    return;
  }

  requestAnimationFrame(update);
}

// Initialize game: start timers and the game loop.
function initGame() {
  setInterval(spawnEnemy, 2000);
  setInterval(spawnPowerUp, 10000);
  update();
}

// Called when Survival Mode starts
function survivalStartGame() {
  console.log("Survival mode starting...");
  // Ensure the start overlay is hidden and canvas is visible
  document.getElementById("startScreen").classList.add("hidden");
  canvas.style.display = "block";
  
  // Reset player values
  player.x = canvas.width / 2 - 25;
  player.y = canvas.height - 100;
  player.health = 100;
  player.score = 0;
  player.bullets = [];
  player.shieldActive = false;
  player.speed = player.baseSpeed;
  
  // Clear enemies, enemy bullets, and power-ups
  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  
  // Reset timers and wave
  gameStartTime = Date.now();
  wave = 1;
  
  // Hide Player 2 controls (solo mode)
  const controls = document.getElementById("playerControls");
  if (controls && controls.children.length > 1) {
    controls.children[1].style.display = "none";
  }
  
  initGame();
}
