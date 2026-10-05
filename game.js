const W = 390;
const H = 844;

const lanes = [W * 0.27, W * 0.5, W * 0.73];

let player;
let obstacles;
let coins;
let roadLines = [];

let lane = 1;
let score = 0;
let best = Number(localStorage.getItem("turboBest")) || 0;
let speed = 370;
let alive = false;
let started = false;

let scoreText;
let bestText;

let startX = 0;
let startY = 0;

const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: W,
    height: H,
    backgroundColor: "#07111f",

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

    // =========================
    // НОЧНОЙ ГОРОД
    // =========================

    s.add.rectangle(W / 2, H / 2, W, H, 0x07111f);

    // здания слева / справа
    for (let y = 80; y < H; y += 110) {

        s.add.rectangle(
            25,
            y,
            50,
            95,
            0x101c2c
        );

        s.add.rectangle(
            W - 25,
            y + 40,
            50,
            100,
            0x101c2c
        );

        // окна
        s.add.rectangle(
            18,
            y - 15,
            7,
            10,
            0xfacc15
        );

        s.add.rectangle(
            W - 18,
            y + 20,
            7,
            10,
            0x38bdf8
        );
    }


    // =========================
    // ДОРОГА
    // =========================

    s.add.rectangle(
        W / 2,
        H / 2,
        W * 0.78,
        H,
        0x111827
    );

    // края дороги
    s.add.rectangle(
        W * 0.11,
        H / 2,
        5,
        H,
        0x64748b
    );

    s.add.rectangle(
        W * 0.89,
        H / 2,
        5,
        H,
        0x64748b
    );


    // =========================
    // РАЗМЕТКА
    // =========================

    [W * 0.385, W * 0.615].forEach(x => {

        for (let y = -50; y < H + 100; y += 100) {

            const line = s.add.rectangle(
                x,
                y,
                5,
                48,
                0x94a3b8
            );

            roadLines.push(line);
        }

    });


    // =========================
    // ГРУППЫ
    // =========================

    obstacles = s.physics.add.group();
    coins = s.physics.add.group();


    // =========================
    // ПЕРСОНАЖ
    // =========================

    player = createRunner(s);

    s.physics.add.existing(player);

    player.body.setSize(38, 62);

    player.body.setAllowGravity(false);

    player.body.setCollideWorldBounds(true);


    // =========================
    // HUD
    // =========================

    scoreText = s.add.text(
        20,
        20,
        "0",
        {
            fontSize: "32px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    ).setDepth(20);


    bestText = s.add.text(
        20,
        58,
        "РЕКОРД " + best,
        {
            fontSize: "14px",
            color: "#94a3b8"
        }
    ).setDepth(20);


    // =========================
    // COLLISION
    // =========================

    s.physics.add.overlap(
        player,
        coins,
        (p, coin) => {

            coin.destroy();

            score += 50;

            // маленький эффект
            const pop = s.add.text(
                player.x,
                player.y - 60,
                "+50",
                {
                    fontSize: "18px",
                    color: "#facc15",
                    fontStyle: "bold"
                }
            )
            .setOrigin(0.5)
            .setDepth(30);

            s.tweens.add({
                targets: pop,
                y: pop.y - 40,
                alpha: 0,
                duration: 500,
                onComplete: () => pop.destroy()
            });

        }
    );


    s.physics.add.overlap(
        player,
        obstacles,
        () => {

            if (!player.getData("jumping")) {
                gameOver(s);
            }

        }
    );


    // =========================
    // SPAWN
    // =========================

    s.time.addEvent({

        delay: 900,

        loop: true,

        callback: () => {

            if (alive) spawnObstacle(s);

        }

    });


    s.time.addEvent({

        delay: 520,

        loop: true,

        callback: () => {

            if (alive) spawnCoin(s);

        }

    });


    // =========================
    // SWIPE
    // =========================

    s.input.on("pointerdown", p => {

        startX = p.x;
        startY = p.y;

    });


    s.input.on("pointerup", p => {

        if (!started) return;

        const dx = p.x - startX;
        const dy = p.y - startY;

        if (
            Math.abs(dx) > 40 &&
            Math.abs(dx) > Math.abs(dy)
        ) {

            move(dx > 0 ? 1 : -1);

        }

        else if (dy < -40) {

            jump();

        }

    });


    // клавиатура для теста на ПК

    s.input.keyboard.on(
        "keydown-LEFT",
        () => move(-1)
    );

    s.input.keyboard.on(
        "keydown-RIGHT",
        () => move(1)
    );

    s.input.keyboard.on(
        "keydown-UP",
        () => jump()
    );


    // =========================
    // START SCREEN
    // =========================

    showStartScreen(s);

}


function createRunner(s) {

    const container = s.add.container(
        lanes[lane],
        H - 125
    );

    // тень
    const shadow = s.add.ellipse(
        0,
        34,
        48,
        14,
        0x000000,
        0.35
    );

    // ноги
    const leg1 = s.add.rectangle(
        -9,
        20,
        10,
        28,
        0x172554
    );

    const leg2 = s.add.rectangle(
        9,
        20,
        10,
        28,
        0x172554
    );

    // тело
    const body = s.add.rectangle(
        0,
        -8,
        38,
        48,
        0x2563eb
    );

    // полоска на куртке
    const stripe = s.add.rectangle(
        0,
        -8,
        30,
        6,
        0x38bdf8
    );

    // голова
    const head = s.add.circle(
        0,
        -43,
        16,
        0xf1c7a5
    );

    // волосы
    const hair = s.add.rectangle(
        0,
        -54,
        28,
        9,
        0x111827
    );

    container.add([
        shadow,
        leg1,
        leg2,
        body,
        stripe,
        head,
        hair
    ]);

    container.setSize(42, 75);

    container.setDepth(10);

    // бег ног
    s.tweens.add({

        targets: leg1,

        angle: {
            from: -15,
            to: 15
        },

        duration: 150,

        yoyo: true,

        repeat: -1

    });


    s.tweens.add({

        targets: leg2,

        angle: {
            from: 15,
            to: -15
        },

        duration: 150,

        yoyo: true,

        repeat: -1

    });


    return container;

}


function showStartScreen(s) {

    alive = false;
    started = false;

    const dark = s.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x020617,
        0.72
    )
    .setDepth(50);


    const title = s.add.text(
        W / 2,
        H / 2 - 150,
        "TURBO\nRUNNER",
        {
            fontSize: "48px",
            color: "#ffffff",
            fontStyle: "bold",
            align: "center",
            lineSpacing: -5
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    const subtitle = s.add.text(
        W / 2,
        H / 2 - 55,
        "Уходи от препятствий.\nСобирай монеты.",
        {
            fontSize: "16px",
            color: "#94a3b8",
            align: "center"
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    const button = s.add.rectangle(
        W / 2,
        H / 2 + 55,
        230,
        65,
        0x2563eb
    )
    .setInteractive()
    .setDepth(51);


    const buttonText = s.add.text(
        W / 2,
        H / 2 + 55,
        "▶  ИГРАТЬ",
        {
            fontSize: "21px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    )
    .setOrigin(0.5)
    .setDepth(52);


    const controls = s.add.text(
        W / 2,
        H / 2 + 140,
        "← → свайп     ↑ прыжок",
        {
            fontSize: "14px",
            color: "#64748b"
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    button.on("pointerup", () => {

        dark.destroy();
        title.destroy();
        subtitle.destroy();
        button.destroy();
        buttonText.destroy();
        controls.destroy();

        alive = true;
        started = true;

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

        duration: 130,

        ease: "Sine.easeOut"

    });

}


function jump() {

    if (!alive) return;

    if (player.getData("jumping")) return;

    player.setData(
        "jumping",
        true
    );


    player.scene.tweens.add({

        targets: player,

        y: player.y - 115,

        scaleX: 1.08,
        scaleY: 1.08,

        duration: 260,

        yoyo: true,

        ease: "Sine.easeOut",

        onComplete: () => {

            player.setData(
                "jumping",
                false
            );

        }

    });

}


function spawnObstacle(s) {

    const randomLane =
        Phaser.Math.Between(0, 2);


    const container = s.add.container(
        lanes[randomLane],
        -70
    );


    // тень
    const shadow = s.add.ellipse(
        0,
        28,
        62,
        18,
        0x000000,
        0.35
    );


    // машина / барьер
    const body = s.add.rectangle(
        0,
        0,
        58,
        64,
        0xef4444
    );


    const window = s.add.rectangle(
        0,
        -15,
        38,
        18,
        0x172554
    );


    const light1 = s.add.circle(
        -18,
        22,
        5,
        0xfef08a
    );


    const light2 = s.add.circle(
        18,
        22,
        5,
        0xfef08a
    );


    container.add([
        shadow,
        body,
        window,
        light1,
        light2
    ]);


    container.setSize(
        54,
        60
    );


    s.physics.add.existing(container);

    container.body.setAllowGravity(false);

    container.body.setVelocityY(speed);

    container.setDepth(8);

    obstacles.add(container);

}


function spawnCoin(s) {

    const randomLane =
        Phaser.Math.Between(0, 2);


    const coin = s.add.container(
        lanes[randomLane],
        -30
    );


    const outer = s.add.circle(
        0,
        0,
        15,
        0xf59e0b
    );


    const inner = s.add.circle(
        0,
        0,
        10,
        0xfacc15
    );


    const mark = s.add.text(
        0,
        0,
        "★",
        {
            fontSize: "12px",
            color: "#fff7ae"
        }
    )
    .setOrigin(0.5);


    coin.add([
        outer,
        inner,
        mark
    ]);


    coin.setSize(
        28,
        28
    );


    s.physics.add.existing(coin);

    coin.body.setAllowGravity(false);

    coin.body.setVelocityY(speed);

    coin.setDepth(7);

    coins.add(coin);


    s.tweens.add({

        targets: coin,

        scaleX: {
            from: 1,
            to: 0.35
        },

        duration: 260,

        yoyo: true,

        repeat: -1

    });

}


function update(time, delta) {

    if (!alive) return;


    // движение дороги
    roadLines.forEach(line => {

        line.y += speed * delta / 1000;

        if (line.y > H + 50) {

            line.y = -50;

        }

    });


    score += delta * 0.012;


    speed = Math.min(
        760,
        370 + score * 0.20
    );


    obstacles
        .getChildren()
        .forEach(o => {

            if (
                o.body &&
                o.active
            ) {

                o.body.setVelocityY(speed);

                if (o.y > H + 100) {

                    o.destroy();

                }

            }

        });


    coins
        .getChildren()
        .forEach(c => {

            if (
                c.body &&
                c.active
            ) {

                c.body.setVelocityY(speed);

                if (c.y > H + 60) {

                    c.destroy();

                }

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


    const dark = s.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x020617,
        0.75
    )
    .setDepth(50);


    s.add.text(
        W / 2,
        H / 2 - 110,
        "ЗАБЕГ\nОКОНЧЕН",
        {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
            align: "center"
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    s.add.text(
        W / 2,
        H / 2,
        "СЧЁТ  " +
        finalScore +
        "\n\nРЕКОРД  " +
        best,
        {
            fontSize: "20px",
            color: "#facc15",
            align: "center"
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    const button = s.add.rectangle(
        W / 2,
        H / 2 + 130,
        240,
        65,
        0x2563eb
    )
    .setInteractive()
    .setDepth(51);


    s.add.text(
        W / 2,
        H / 2 + 130,
        "↻  ЕЩЁ РАЗ",
        {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold"
        }
    )
    .setOrigin(0.5)
    .setDepth(52);


    button.on(
        "pointerup",
        () => location.reload()
    );

}
