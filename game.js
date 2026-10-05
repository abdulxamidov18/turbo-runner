const W = 390;
const H = 844;

const LANES = [W * 0.27, W * 0.50, W * 0.73];

let player;
let obstacles;
let coins;

let lane = 1;
let score = 0;
let collectedCoins = 0;
let best = Number(localStorage.getItem("turboBest")) || 0;

let speed = 390;
let alive = false;
let started = false;

let scoreText;
let coinText;

let touchX = 0;
let touchY = 0;

let roadLines = [];

const config = {
    type: Phaser.AUTO,
    parent: "game",

    width: W,
    height: H,

    backgroundColor: "#050816",

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
        preload,
        create,
        update
    }
};

new Phaser.Game(config);


// =====================================================
// ЗАГРУЗКА ГРАФИКИ
// =====================================================

function preload() {

    this.load.image(
        "city",
        "city.JPG"
    );

    this.load.spritesheet(
        "sprites",
        "sprites.PNG",
        {
            frameWidth: 160,
            frameHeight: 180
        }
    );

}


// =====================================================
// СОЗДАНИЕ ИГРЫ
// =====================================================

function create() {

    const s = this;

    createBackground(s);
    createRoad(s);

    obstacles = s.physics.add.group();
    coins = s.physics.add.group();

    createPlayer(s);
    createHUD(s);

    createAnimations(s);

    // МОНЕТЫ

    s.physics.add.overlap(
        player,
        coins,
        collectCoin
    );

    // ПРЕПЯТСТВИЯ

    s.physics.add.overlap(
        player,
        obstacles,
        hitObstacle
    );


    // ГЕНЕРАЦИЯ ТРАНСПОРТА

    s.time.addEvent({

        delay: 900,

        loop: true,

        callback: () => {

            if (alive) {

                spawnObstacle(s);

            }

        }

    });


    // ГЕНЕРАЦИЯ МОНЕТ

    s.time.addEvent({

        delay: 520,

        loop: true,

        callback: () => {

            if (alive) {

                spawnCoin(s);

            }

        }

    });


    // УПРАВЛЕНИЕ

    s.input.on(
        "pointerdown",
        p => {

            touchX = p.x;
            touchY = p.y;

        }
    );


    s.input.on(
        "pointerup",
        p => {

            if (!alive) return;

            const dx =
                p.x - touchX;

            const dy =
                p.y - touchY;


            if (
                Math.abs(dx) > 40 &&
                Math.abs(dx) >
                Math.abs(dy)
            ) {

                move(
                    dx > 0 ? 1 : -1
                );

            }

            else if (
                dy < -40
            ) {

                jump();

            }

        }
    );


    showStartScreen(s);

}


// =====================================================
// ФОН
// =====================================================

function createBackground(s) {

    const city =
        s.add.image(
            W / 2,
            H / 2,
            "city"
        );

    city.setDisplaySize(
        W,
        H
    );

    city.setDepth(-20);


    // затемнение,
    // чтобы дорога и объекты читались

    s.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x020617,
        0.15
    )
    .setDepth(-19);

}


// =====================================================
// ДОРОГА
// =====================================================

function createRoad(s) {

    // затемнённая игровая зона

    s.add.rectangle(
        W / 2,
        H / 2 + 80,
        W * 0.78,
        H - 160,
        0x050b18,
        0.42
    )
    .setDepth(-10);


    // светящиеся края

    s.add.rectangle(
        W * 0.105,
        H / 2 + 80,
        4,
        H - 160,
        0x22d3ee,
        0.8
    )
    .setDepth(-8);


    s.add.rectangle(
        W * 0.895,
        H / 2 + 80,
        4,
        H - 160,
        0xf472b6,
        0.8
    )
    .setDepth(-8);


    // разметка

    [
        W * 0.385,
        W * 0.615
    ]
    .forEach(x => {

        for (
            let y = 120;
            y < H + 100;
            y += 105
        ) {

            const line =
                s.add.rectangle(
                    x,
                    y,
                    5,
                    50,
                    0xffffff,
                    0.65
                );

            line.setDepth(-7);

            roadLines.push(line);

        }

    });

}


// =====================================================
// АНИМАЦИЯ ПЕРСОНАЖА
// =====================================================

function createAnimations(s) {

    if (
        !s.anims.exists(
            "runner-run"
        )
    ) {

        s.anims.create({

            key:
                "runner-run",

            frames: [
                { key: "sprites", frame: 0 },
                { key: "sprites", frame: 1 },
                { key: "sprites", frame: 2 },
                { key: "sprites", frame: 3 }
            ],

            frameRate: 10,

            repeat: -1

        });

    }

}


// =====================================================
// ПЕРСОНАЖ
// =====================================================

function createPlayer(s) {

    player =
        s.physics.add.sprite(
            LANES[lane],
            H - 115,
            "sprites",
            0
        );


    player.setDisplaySize(
        78,
        110
    );


    player.setDepth(20);


    player.body.setSize(
        75,
        120
    );


    player.body.setAllowGravity(
        false
    );


    player.play(
        "runner-run"
    );

}


// =====================================================
// HUD
// =====================================================

function createHUD(s) {

    // счёт

    const panel =
        s.add.rectangle(
            75,
            52,
            130,
            74,
            0x020617,
            0.82
        );

    panel
        .setStrokeStyle(
            1,
            0x475569
        )
        .setDepth(50);


    scoreText =
        s.add.text(
            20,
            18,
            "0",
            {
                fontSize:
                    "30px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setDepth(51);


    s.add.text(
        20,
        55,
        "РЕКОРД " + best,
        {
            fontSize:
                "12px",

            color:
                "#cbd5e1"
        }
    )
    .setDepth(51);


    // монеты

    const coinCircle =
        s.add.circle(
            323,
            38,
            17,
            0xf59e0b
        );

    coinCircle
        .setStrokeStyle(
            3,
            0xffe066
        )
        .setDepth(50);


    s.add.text(
        323,
        38,
        "★",
        {
            fontSize:
                "14px",

            color:
                "#fff7ae"
        }
    )
    .setOrigin(0.5)
    .setDepth(51);


    coinText =
        s.add.text(
            350,
            27,
            "0",
            {
                fontSize:
                    "18px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setDepth(51);

}


// =====================================================
// ДВИЖЕНИЕ
// =====================================================

function move(direction) {

    if (!alive) return;


    lane =
        Phaser.Math.Clamp(
            lane + direction,
            0,
            2
        );


    player.scene.tweens.add({

        targets:
            player,

        x:
            LANES[lane],

        duration:
            120,

        ease:
            "Sine.easeOut"

    });

}


// =====================================================
// ПРЫЖОК
// =====================================================

function jump() {

    if (!alive) return;

    if (
        player.getData(
            "jumping"
        )
    ) return;


    player.setData(
        "jumping",
        true
    );


    player.stop();


    player.setFrame(
        4
    );


    player.scene.tweens.add({

        targets:
            player,

        y:
            player.y - 125,

        scaleX:
            player.scaleX * 1.08,

        scaleY:
            player.scaleY * 1.08,

        duration:
            270,

        yoyo:
            true,

        ease:
            "Sine.easeOut",

        onComplete:
            () => {

                player.setData(
                    "jumping",
                    false
                );

                player.play(
                    "runner-run"
                );

            }

    });

}


// =====================================================
// МАШИНЫ
// =====================================================

function spawnObstacle(s) {

    const randomLane =
        Phaser.Math.Between(
            0,
            2
        );


    // кадры транспорта
    // 6–11

    const vehicleFrame =
        Phaser.Math.Between(
            6,
            11
        );


    const obstacle =
        s.physics.add.sprite(
            LANES[randomLane],
            -100,
            "sprites",
            vehicleFrame
        );


    obstacle.setDisplaySize(
        92,
        115
    );


    obstacle.setDepth(
        18
    );


    obstacle.body.setAllowGravity(
        false
    );


    obstacle.body.setVelocityY(
        speed
    );


    obstacle.body.setSize(
        110,
        135
    );


    obstacles.add(
        obstacle
    );

}


// =====================================================
// МОНЕТЫ
// =====================================================

function spawnCoin(s) {

    const randomLane =
        Phaser.Math.Between(
            0,
            2
        );


    // frame 15 = монета

    const coin =
        s.physics.add.sprite(
            LANES[randomLane],
            -40,
            "sprites",
            15
        );


    coin.setDisplaySize(
        48,
        54
    );


    coin.setDepth(
        19
    );


    coin.body.setAllowGravity(
        false
    );


    coin.body.setVelocityY(
        speed
    );


    coin.body.setSize(
        60,
        60
    );


    coins.add(
        coin
    );


    // вращение

    s.tweens.add({

        targets:
            coin,

        scaleX:
            coin.scaleX * 0.4,

        duration:
            260,

        yoyo:
            true,

        repeat:
            -1

    });

}


// =====================================================
// СБОР МОНЕТЫ
// =====================================================

function collectCoin(
    player,
    coin
) {

    if (!coin.active) return;


    const s =
        player.scene;


    const x =
        coin.x;

    const y =
        coin.y;


    coin.destroy();


    collectedCoins++;

    score += 75;


    coinText.setText(
        collectedCoins
    );


    // эффект

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const particle =
            s.add.circle(
                x,
                y,
                3,
                0xffd43b
            )
            .setDepth(40);


        const angle =
            Math.PI *
            2 *
            i /
            8;


        s.tweens.add({

            targets:
                particle,

            x:
                x +
                Math.cos(angle) *
                35,

            y:
                y +
                Math.sin(angle) *
                35,

            alpha:
                0,

            duration:
                350,

            onComplete:
                () =>
                    particle.destroy()

        });

    }


    const plus =
        s.add.text(
            x,
            y - 30,
            "+75",
            {
                fontSize:
                    "17px",

                fontStyle:
                    "bold",

                color:
                    "#ffd43b"
            }
        )
        .setOrigin(0.5)
        .setDepth(40);


    s.tweens.add({

        targets:
            plus,

        y:
            y - 70,

        alpha:
            0,

        duration:
            500,

        onComplete:
            () =>
                plus.destroy()

    });

}


// =====================================================
// СТОЛКНОВЕНИЕ
// =====================================================

function hitObstacle(
    player,
    obstacle
) {

    if (!alive) return;


    // во время прыжка
    // разрешаем перепрыгивать

    if (
        player.getData(
            "jumping"
        )
    ) {

        return;

    }


    gameOver(
        player.scene
    );

}


// =====================================================
// UPDATE
// =====================================================

function update(
    time,
    delta
) {

    if (!alive) return;


    score +=
        delta *
        0.012;


    speed =
        Math.min(
            820,
            390 +
            score *
            0.18
        );


    // движение разметки

    roadLines
        .forEach(line => {

            line.y +=
                speed *
                delta /
                1000;


            if (
                line.y >
                H + 60
            ) {

                line.y =
                    110;

            }

        });


    // машины

    obstacles
        .getChildren()
        .forEach(
            obstacle => {

                if (
                    obstacle.active &&
                    obstacle.body
                ) {

                    obstacle.body
                        .setVelocityY(
                            speed
                        );


                    if (
                        obstacle.y >
                        H + 150
                    ) {

                        obstacle.destroy();

                    }

                }

            }
        );


    // монеты

    coins
        .getChildren()
        .forEach(
            coin => {

                if (
                    coin.active &&
                    coin.body
                ) {

                    coin.body
                        .setVelocityY(
                            speed
                        );


                    if (
                        coin.y >
                        H + 80
                    ) {

                        coin.destroy();

                    }

                }

            }
        );


    scoreText.setText(
        Math.floor(score)
    );

}


// =====================================================
// СТАРТОВЫЙ ЭКРАН
// =====================================================

function showStartScreen(s) {

    alive = false;
    started = false;


    const dark =
        s.add.rectangle(
            W / 2,
            H / 2,
            W,
            H,
            0x020617,
            0.68
        )
        .setDepth(100);


    const glow =
        s.add.circle(
            W / 2,
            235,
            120,
            0x2563eb,
            0.18
        )
        .setDepth(101);


    const title =
        s.add.text(
            W / 2,
            180,
            "TURBO",
            {
                fontSize:
                    "60px",

                fontStyle:
                    "bold italic",

                color:
                    "#ffffff",

                stroke:
                    "#020617",

                strokeThickness:
                    8
            }
        )
        .setOrigin(0.5)
        .setDepth(102);


    const title2 =
        s.add.text(
            W / 2,
            240,
            "RUNNER",
            {
                fontSize:
                    "48px",

                fontStyle:
                    "bold italic",

                color:
                    "#fbbf24",

                stroke:
                    "#020617",

                strokeThickness:
                    7
            }
        )
        .setOrigin(0.5)
        .setDepth(102);


    const subtitle =
        s.add.text(
            W / 2,
            310,
            "НОЧНОЙ ГОРОД",
            {
                fontSize:
                    "15px",

                fontStyle:
                    "bold",

                color:
                    "#22d3ee"
            }
        )
        .setOrigin(0.5)
        .setDepth(102);


    const button =
        s.add.rectangle(
            W / 2,
            575,
            250,
            68,
            0xfbbf24
        )
        .setStrokeStyle(
            3,
            0xffe99a
        )
        .setInteractive()
        .setDepth(102);


    const buttonText =
        s.add.text(
            W / 2,
            575,
            "▶  ИГРАТЬ",
            {
                fontSize:
                    "23px",

                fontStyle:
                    "bold",

                color:
                    "#111827"
            }
        )
        .setOrigin(0.5)
        .setDepth(103);


    const help =
        s.add.text(
            W / 2,
            650,
            "← → СВАЙП   •   ↑ ПРЫЖОК",
            {
                fontSize:
                    "13px",

                color:
                    "#e2e8f0"
            }
        )
        .setOrigin(0.5)
        .setDepth(102);


    s.tweens.add({

        targets:
            button,

        scaleX: {
            from: 1,
            to: 1.04
        },

        scaleY: {
            from: 1,
            to: 1.04
        },

        duration:
            700,

        yoyo:
            true,

        repeat:
            -1

    });


    button.on(
        "pointerup",
        () => {

            [
                dark,
                glow,
                title,
                title2,
                subtitle,
                button,
                buttonText,
                help
            ]
            .forEach(
                obj =>
                    obj.destroy()
            );


            started = true;
            alive = true;

        }
    );

}


// =====================================================
// GAME OVER
// =====================================================

function gameOver(s) {

    if (!alive) return;


    alive = false;


    const finalScore =
        Math.floor(score);


    if (
        finalScore >
        best
    ) {

        best =
            finalScore;


        localStorage.setItem(
            "turboBest",
            best
        );

    }


    player.stop();


    s.cameras.main.shake(
        250,
        0.018
    );


    s.cameras.main.flash(
        180,
        255,
        50,
        50
    );


    s.time.delayedCall(
        220,
        () => {

            showGameOver(
                s,
                finalScore
            );

        }
    );

}


// =====================================================
// GAME OVER SCREEN
// =====================================================

function showGameOver(
    s,
    finalScore
) {

    s.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x020617,
        0.84
    )
    .setDepth(150);


    s.add.text(
        W / 2,
        190,
        "GAME",
        {
            fontSize:
                "58px",

            fontStyle:
                "bold italic",

            color:
                "#ffffff",

            stroke:
                "#020617",

            strokeThickness:
                7
        }
    )
    .setOrigin(0.5)
    .setDepth(151);


    s.add.text(
        W / 2,
        250,
        "OVER",
        {
            fontSize:
                "58px",

            fontStyle:
                "bold italic",

            color:
                "#ef4444",

            stroke:
                "#020617",

            strokeThickness:
                7
        }
    )
    .setOrigin(0.5)
    .setDepth(151);


    s.add.rectangle(
        W / 2,
        390,
        290,
        160,
        0x07111f,
        0.96
    )
    .setStrokeStyle(
        2,
        0x475569
    )
    .setDepth(151);


    s.add.text(
        W / 2,
        345,
        "СЧЁТ",
        {
            fontSize:
                "13px",

            color:
                "#94a3b8"
        }
    )
    .setOrigin(0.5)
    .setDepth(152);


    s.add.text(
        W / 2,
        385,
        String(
            finalScore
        ),
        {
            fontSize:
                "40px",

            fontStyle:
                "bold",

            color:
                "#fbbf24"
        }
    )
    .setOrigin(0.5)
    .setDepth(152);


    s.add.text(
        W / 2,
        440,
        "РЕКОРД  " +
        best +
        "     ★ " +
        collectedCoins,
        {
            fontSize:
                "14px",

            color:
                "#ffffff"
        }
    )
    .setOrigin(0.5)
    .setDepth(152);


    const restart =
        s.add.rectangle(
            W / 2,
            555,
            250,
            68,
            0xfbbf24
        )
        .setStrokeStyle(
            3,
            0xffe99a
        )
        .setInteractive()
        .setDepth(152);


    s.add.text(
        W / 2,
        555,
        "↻  ЕЩЁ РАЗ",
        {
            fontSize:
                "22px",

            fontStyle:
                "bold",

            color:
                "#111827"
        }
    )
    .setOrigin(0.5)
    .setDepth(153);


    restart.on(
        "pointerup",
        () => {

            location.reload();

        }
    );

}
