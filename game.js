const W = 390, H = 844;
const lanes = [W * 0.25, W * 0.5, W * 0.75];

let player, obstacles, coins;
let score = 0;
let best = +localStorage.getItem("turboBest") || 0;
let lane = 1;
let speed = 360;
let alive = true;
let scoreText, bestText;
let startX = 0, startY = 0;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  backgroundColor: "#0b1220",

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },

  scene: {
    create,
    update
  }
};

new Phaser.Game(config);

function create() {
  const s = this;

  // Дорога
  s.add.rectangle(W / 2, H / 2, W * 0.78, H, 0x111827);

  s.add.rectangle(W * 0.11, H / 2, 4, H, 0x334155);
  s.add.rectangle(W * 0.89, H / 2, 4, H, 0x334155);

  // Разметка
  [W * 0.375, W * 0.625].forEach(x => {
    for (let y = 0; y < H; y += 70) {
      s.add.rectangle(x, y, 4, 34, 0x64748b);
    }
  });

  obstacles = s.physics.add.group();
  coins = s.physics.add.group();

  // Игрок
  player = s.add.rectangle(
    lanes[lane],
    H - 120,
    46,
    62,
    0x38bdf8
  );

  s.physics.add.existing(player);

  player.body.setCollideWorldBounds(true);
  player.body.setSize(42, 58);
  player.body.setAllowGravity(false);

  // Интерфейс
  scoreText = s.add.text(
    18,
    18,
    "0",
    {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold"
    }
  );

  bestText = s.add.text(
    18,
    54,
    "Рекорд: " + best,
    {
      fontSize: "15px",
      color: "#94a3b8"
    }
  );

  // Столкновения
  s.physics.add.overlap(player, coins, (p, coin) => {
    coin.destroy();
    score += 50;
  });

  s.physics.add.overlap(player, obstacles, () => {
    gameOver(s);
  });

  // Генерация препятствий
  s.time.addEvent({
    delay: 820,
    loop: true,
    callback: () => spawnObstacle(s)
  });

  // Генерация монет
  s.time.addEvent({
    delay: 520,
    loop: true,
    callback: () => spawnCoin(s)
  });

  // Управление клавиатурой
  s.input.keyboard.on("keydown-LEFT", () => move(-1));
  s.input.keyboard.on("keydown-RIGHT", () => move(1));
  s.input.keyboard.on("keydown-UP", () => jump());

  // Свайпы
  s.input.on("pointerdown", p => {
    startX = p.x;
    startY = p.y;
  });

  s.input.on("pointerup", p => {

    const dx = p.x - startX;
    const dy = p.y - startY;

    if (
      Math.abs(dx) > 45 &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      move(dx > 0 ? 1 : -1);
    }

    else if (dy < -45) {
      jump();
    }
  });
}

function move(direction) {

  if (!alive) return;

  lane = Phaser.Math.Clamp(
    lane + direction,
    0,
    2
  );

  player.scene.tweens.add({
    targets: player,
    x: lanes[lane],
    duration: 110,
    ease: "Sine.easeOut"
  });
}

function jump() {

  if (!alive) return;

  if (player.getData("jumping")) return;

  player.setData("jumping", true);

  player.scene.tweens.add({

    targets: player,

    y: player.y - 105,

    duration: 230,

    yoyo: true,

    ease: "Sine.easeOut",

    onComplete: () => {
      player.setData("jumping", false);
    }
  });
}

function spawnObstacle(s) {

  if (!alive) return;

  const randomLane =
    Phaser.Math.Between(0, 2);

  const obstacle =
    s.add.rectangle(
      lanes[randomLane],
      -40,
      58,
      62,
      0xef4444
    );

  s.physics.add.existing(obstacle);

  obstacle.body.setAllowGravity(false);

  obstacle.body.setVelocityY(speed);

  obstacles.add(obstacle);
}

function spawnCoin(s) {

  if (!alive) return;

  const randomLane =
    Phaser.Math.Between(0, 2);

  const coin =
    s.add.circle(
      lanes[randomLane],
      -25,
      13,
      0xfacc15
    );

  s.physics.add.existing(coin);

  coin.body.setAllowGravity(false);

  coin.body.setVelocityY(speed);

  coins.add(coin);
}

function update(time, delta) {

  if (!alive) return;

  score += delta * 0.012;

  speed = Math.min(
    720,
    360 + score * 0.25
  );

  obstacles.getChildren().forEach(o => {

    o.body.setVelocityY(speed);

    if (o.y > H + 80) {
      o.destroy();
    }
  });

  coins.getChildren().forEach(c => {

    c.body.setVelocityY(speed);

    if (c.y > H + 50) {
      c.destroy();
    }
  });

  scoreText.setText(
    Math.floor(score)
  );
}

function gameOver(s) {

  if (!alive) return;

  alive = false;

  const finalScore =
    Math.floor(score);

  if (finalScore > best) {

    best = finalScore;

    localStorage.setItem(
      "turboBest",
      best
    );
  }

  s.physics.pause();

  s.add.rectangle(
    W / 2,
    H / 2,
    320,
    260,
    0x020617,
    0.94
  );

  s.add.text(
    W / 2,
    H / 2 - 80,
    "ЗАБЕГ ОКОНЧЕН",
    {
      fontSize: "25px",
      color: "#ffffff",
      fontStyle: "bold"
    }
  ).setOrigin(0.5);

  s.add.text(
    W / 2,
    H / 2 - 25,
    "Счёт: " +
    finalScore +
    "\nРекорд: " +
    best,
    {
      fontSize: "21px",
      color: "#facc15",
      align: "center"
    }
  ).setOrigin(0.5);

  const button =
    s.add.rectangle(
      W / 2,
      H / 2 + 70,
      220,
      58,
      0x2563eb
    )
    .setInteractive();

  s.add.text(
    W / 2,
    H / 2 + 70,
    "ИГРАТЬ СНОВА",
    {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    }
  ).setOrigin(0.5);

  button.on(
    "pointerup",
    () => location.reload()
  );
}
