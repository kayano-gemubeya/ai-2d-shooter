// ============================================================
// AI ARENA
// 2D 1vs1 SHOOTER
// CPU AI / LEVEL 1-5
// ============================================================


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


// ============================================================
// HTML
// ============================================================

const startScreen =
    document.getElementById("startScreen");

const resultScreen =
    document.getElementById("resultScreen");

const hud =
    document.getElementById("hud");

const startBtn =
    document.getElementById("startBtn");

const restartBtn =
    document.getElementById("restartBtn");

const nextLevelBtn =
    document.getElementById("nextLevelBtn");

const resultTitle =
    document.getElementById("resultTitle");

const resultText =
    document.getElementById("resultText");

const playerHp =
    document.getElementById("playerHp");

const enemyHp =
    document.getElementById("enemyHp");

const playerHpText =
    document.getElementById("playerHpText");

const enemyHpText =
    document.getElementById("enemyHpText");

const levelText =
    document.getElementById("levelText");


// ============================================================
// ワールド
// ============================================================

const WORLD_WIDTH = 1280;

const WORLD_HEIGHT = 720;

const GROUND_Y = 620;

const GRAVITY = 1700;

const PLAYER_SPEED = 340;

const JUMP_POWER = 650;


// ============================================================
// ゲーム状態
// ============================================================

let level = 1;

let gameRunning = false;

let lastTime = 0;

let player;

let cpu;

let bullets = [];

let particles = [];

let platforms = [];


// ============================================================
// プレイヤー入力
// ============================================================

const keys = {

    left: false,

    right: false,

    jump: false,

    shoot: false

};


// ============================================================
// CPU入力
//
// ★ここがプレイヤーと完全に別
// ============================================================

const cpuInput = {

    left: false,

    right: false,

    jump: false,

    shoot: false

};


// ============================================================
// CPU AI設定
// ============================================================

const AI_LEVELS = {

    1: {

        reaction: 0.70,

        accuracy: 0.55,

        speed: 0.75,

        aggression: 0.35

    },

    2: {

        reaction: 0.55,

        accuracy: 0.65,

        speed: 0.82,

        aggression: 0.45

    },

    3: {

        reaction: 0.42,

        accuracy: 0.75,

        speed: 0.90,

        aggression: 0.58

    },

    4: {

        reaction: 0.30,

        accuracy: 0.84,

        speed: 0.96,

        aggression: 0.70

    },

    5: {

        reaction: 0.20,

        accuracy: 0.92,

        speed: 1.00,

        aggression: 0.82

    }

};


// ============================================================
// マップ
//
// 障害物は少なめ
// ============================================================

const MAPS = {

    1: {

        name: "TRAINING",

        platforms: [

            {
                x: 450,
                y: 510,
                w: 180,
                h: 20
            }

        ]

    },


    2: {

        name: "CITY",

        platforms: [

            {
                x: 250,
                y: 520,
                w: 180,
                h: 20
            },

            {
                x: 850,
                y: 520,
                w: 180,
                h: 20
            }

        ]

    },


    3: {

        name: "FACTORY",

        platforms: [

            {
                x: 220,
                y: 520,
                w: 160,
                h: 20
            },

            {
                x: 900,
                y: 520,
                w: 160,
                h: 20
            },

            {
                x: 540,
                y: 440,
                w: 200,
                h: 20
            }

        ]

    },


    4: {

        name: "ROOFTOPS",

        platforms: [

            {
                x: 160,
                y: 500,
                w: 180,
                h: 20
            },

            {
                x: 940,
                y: 500,
                w: 180,
                h: 20
            },

            {
                x: 500,
                y: 390,
                w: 280,
                h: 20
            }

        ]

    },


    5: {

        name: "FINAL ARENA",

        platforms: [

            {
                x: 180,
                y: 520,
                w: 200,
                h: 20
            },

            {
                x: 900,
                y: 520,
                w: 200,
                h: 20
            },

            {
                x: 430,
                y: 430,
                w: 420,
                h: 20
            }

        ]

    }

};


// ============================================================
// レベル読み込み
// ============================================================

function loadMap() {

    platforms =
        MAPS[level].platforms.map(
            p => ({ ...p })
        );

}


// ============================================================
// ファイター作成
// ============================================================

function createFighter(
    x,
    color,
    facing
) {

    return {

        x: x,

        y: GROUND_Y - 60,

        w: 36,

        h: 60,

        vx: 0,

        vy: 0,

        color: color,

        facing: facing,

        hp: 10,

        onGround: false,

        jumpLock: false,

        shootCooldown: 0,

        hitTimer: 0,

        hurtTimer: 0

    };

}


// ============================================================
// ゲーム初期化
// ============================================================

function resetGame() {

    loadMap();


    player =
        createFighter(
            120,
            "#4da6ff",
            1
        );


    cpu =
        createFighter(
            WORLD_WIDTH - 156,
            "#ff5369",
            -1
        );


    bullets = [];

    particles = [];


    cpuThinkTimer = 0;

    cpuStrafeTimer = 0;


    updateHUD();

}


// ============================================================
// CPU思考タイマー
// ============================================================

let cpuThinkTimer = 0;

let cpuStrafeTimer = 0;


// ============================================================
// CPU AI
// ============================================================

function updateCPUAI(dt) {

    const ai =
        AI_LEVELS[level];


    const playerCenter =
        player.x + player.w / 2;


    const cpuCenter =
        cpu.x + cpu.w / 2;


    const dx =
        playerCenter - cpuCenter;


    const distance =
        Math.abs(dx);


    const heightDifference =
        player.y - cpu.y;


    // ------------------------------------------
    // CPUは一定時間ごとに「考える」
    // ------------------------------------------

    cpuThinkTimer -= dt;


    cpuStrafeTimer -= dt;


    if (cpuThinkTimer <= 0) {

        cpuThinkTimer =
            ai.reaction *
            (0.8 + Math.random() * 0.4);


        // まず全部リセット
        cpuInput.left = false;

        cpuInput.right = false;

        cpuInput.jump = false;

        cpuInput.shoot = false;


        // ==================================================
        // ① 距離によって行動
        // ==================================================


        // かなり遠い
        if (distance > 600) {

            if (dx > 0) {

                cpuInput.right = true;

            } else {

                cpuInput.left = true;

            }

        }


        // 遠い
        else if (distance > 350) {

            if (
                Math.random() <
                ai.aggression
            ) {

                if (dx > 0) {

                    cpuInput.right = true;

                } else {

                    cpuInput.left = true;

                }

            }

        }


        // 中距離
        else if (distance > 180) {

            // 一定確率で接近
            if (
                Math.random() <
                ai.aggression
            ) {

                if (dx > 0) {

                    cpuInput.right = true;

                } else {

                    cpuInput.left = true;

                }

            }

        }


        // 近すぎる
        else {

            // CPU自身で距離を取る

            if (dx > 0) {

                cpuInput.left = true;

            } else {

                cpuInput.right = true;

            }

        }


        // ==================================================
        // ② ストレイフ
        // ==================================================

        if (cpuStrafeTimer <= 0) {

            cpuStrafeTimer =
                0.5 +
                Math.random() * 1.3;

        }


        // ==================================================
        // ③ 射撃
        // ==================================================

        if (distance < 750) {

            if (
                Math.random() <
                ai.accuracy
            ) {

                cpuInput.shoot = true;

            }

        }


        // ==================================================
        // ④ ジャンプ
        // ==================================================

        if (cpu.onGround) {

            // プレイヤーが高い
            if (
                heightDifference < -70 &&
                distance < 600
            ) {

                cpuInput.jump = true;

            }


            // プレイヤーに接近しすぎた
            else if (
                distance < 180 &&
                Math.random() < 0.35
            ) {

                cpuInput.jump = true;

            }


            // 時々自分からジャンプ
            else if (
                Math.random() < 0.08
            ) {

                cpuInput.jump = true;

            }

        }

    }


    // ==================================================
    // CPUの向き
    // ==================================================

    if (dx > 0) {

        cpu.facing = 1;

    } else {

        cpu.facing = -1;

    }


    // ==================================================
    // CPUを動かす
    //
    // ★プレイヤーkeysはここでは一切使わない
    // ==================================================

    let direction = 0;


    if (cpuInput.left) {

        direction = -1;

    }


    if (cpuInput.right) {

        direction = 1;

    }


    moveFighter(
        cpu,
        dt,
        direction,
        cpuInput.jump,
        ai.speed
    );


    // ==================================================
    // CPU射撃
    // ==================================================

    if (cpuInput.shoot) {

        const directionToPlayer =
            Math.sign(
                playerCenter -
                cpuCenter
            );


        fireBullet(
            cpu,
            directionToPlayer
        );

    }

}


// ============================================================
// ファイター移動
// ============================================================

function moveFighter(
    fighter,
    dt,
    direction,
    jump,
    speedMultiplier = 1
) {

    const oldY =
        fighter.y;


    fighter.vx =
        direction *
        PLAYER_SPEED *
        speedMultiplier;


    fighter.x +=
        fighter.vx * dt;


    // マップ外防止
    fighter.x =
        Math.max(
            20,
            Math.min(
                WORLD_WIDTH -
                fighter.w -
                20,
                fighter.x
            )
        );


    // ジャンプ
    if (
        jump &&
        fighter.onGround &&
        !fighter.jumpLock
    ) {

        fighter.vy =
            -JUMP_POWER;

        fighter.onGround =
            false;

        fighter.jumpLock =
            true;

        playJumpSound();

    }


    if (!jump) {

        fighter.jumpLock =
            false;

    }


    // 重力
    fighter.vy +=
        GRAVITY * dt;


    fighter.y +=
        fighter.vy * dt;


    // 地面
    fighter.onGround = false;


    if (
        fighter.y +
        fighter.h >=
        GROUND_Y &&
        oldY +
        fighter.h <=
        GROUND_Y + 10
    ) {

        fighter.y =
            GROUND_Y -
            fighter.h;

        fighter.vy = 0;

        fighter.onGround = true;

    }


    // 足場
    for (const p of platforms) {

        const horizontal =
            fighter.x +
            fighter.w >
            p.x &&
            fighter.x <
            p.x +
            p.w;


        const falling =
            fighter.vy >= 0;


        const landing =
            fighter.y +
            fighter.h >=
            p.y &&
            oldY +
            fighter.h <=
            p.y + 8;


        if (
            horizontal &&
            falling &&
            landing
        ) {

            fighter.y =
                p.y -
                fighter.h;

            fighter.vy = 0;

            fighter.onGround = true;

        }

    }


    if (
        fighter.shootCooldown > 0
    ) {

        fighter.shootCooldown -= dt;

    }


    if (
        fighter.hitTimer > 0
    ) {

        fighter.hitTimer -= dt;

    }

}


// ============================================================
// プレイヤー更新
// ============================================================

function updatePlayer(dt) {

    const direction =
        (keys.right ? 1 : 0) -
        (keys.left ? 1 : 0);


    moveFighter(
        player,
        dt,
        direction,
        keys.jump,
        1
    );


    // プレイヤーはCPUの方向を自動で狙わない
    // 自分とCPUの位置から撃つ方向だけ決定

    if (keys.shoot) {

        const directionToCPU =
            Math.sign(
                cpu.x -
                player.x
            );


        fireBullet(
            player,
            directionToCPU
        );

    }

}


// ============================================================
// 弾
// ============================================================

function fireBullet(
    owner,
    direction
) {

    if (
        owner.shootCooldown > 0
    ) {

        return;

    }


    if (direction === 0) {

        return;

    }


    owner.shootCooldown =
        0.38;


    const bulletX =
        direction > 0
            ? owner.x + owner.w
            : owner.x;


    const bulletY =
        owner.y + 25;


    bullets.push({

        x: bulletX,

        y: bulletY,

        vx: direction * 900,

        owner: owner,

        life: 1.5

    });


    playShootSound();

}


// ============================================================
// 弾更新
// ============================================================

function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx * dt;


        bullet.life -= dt;


        let remove =
            bullet.life <= 0;


        // マップ外
        if (
            bullet.x < -50 ||
            bullet.x >
            WORLD_WIDTH + 50
        ) {

            remove = true;

        }


        // 足場
        for (const p of platforms) {

            if (
                bullet.x >= p.x &&
                bullet.x <=
                p.x + p.w &&
                bullet.y >= p.y &&
                bullet.y <=
                p.y + p.h
            ) {

                remove = true;

            }

        }


        // 標的
        const target =
            bullet.owner === player
                ? cpu
                : player;


        if (
            !remove &&
            bullet.x >
                target.x &&
            bullet.x <
                target.x +
                target.w &&
            bullet.y >
                target.y &&
            bullet.y <
                target.y +
                target.h
        ) {

            damage(target);

            remove = true;

        }


        if (remove) {

            bullets.splice(i, 1);

        }

    }

}


// ============================================================
// ダメージ
// ============================================================

function damage(target) {

    target.hp--;

    target.hitTimer =
        0.15;


    // CPUは被弾したらすぐ判断し直す
    if (target === cpu) {

        cpuThinkTimer = 0;

        cpuInput.jump =
            Math.random() < 0.7;

    }


    playHitSound();


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        particles.push({

            x:
                target.x +
                target.w / 2,

            y:
                target.y +
                25,

            vx:
                (Math.random() - 0.5) *
                250,

            vy:
                (Math.random() - 0.5) *
                200,

            life:
                0.35

        });

    }

}


// ============================================================
// パーティクル
// ============================================================

function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];


        p.x +=
            p.vx * dt;


        p.y +=
            p.vy * dt;


        p.vy +=
            500 * dt;


        p.life -= dt;


        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    playerHp.style.width =
        (player.hp * 10) + "%";


    enemyHp.style.width =
        (cpu.hp * 10) + "%";


    playerHpText.textContent =
        player.hp +
        " / 10";


    enemyHpText.textContent =
        cpu.hp +
        " / 10";


    levelText.textContent =
        "LEVEL " +
        level +
        "  " +
        MAPS[level].name;

}


// ============================================================
// 勝敗
// ============================================================

function finishGame() {

    gameRunning = false;


    resultScreen.classList.remove(
        "hidden"
    );


    hud.classList.add(
        "hidden"
    );


    if (
        player.hp > 0 &&
        cpu.hp <= 0
    ) {

        resultTitle.textContent =
            "YOU WIN!";


        if (level < 5) {

            resultText.textContent =
                "LEVEL " +
                level +
                " CLEAR!";


            nextLevelBtn.style.display =
                "inline-block";

        } else {

            resultText.textContent =
                "ALL 5 LEVELS CLEAR!";


            nextLevelBtn.style.display =
                "none";

        }

    } else {

        resultTitle.textContent =
            "YOU LOSE";


        resultText.textContent =
            "CPUに負けました。";


        nextLevelBtn.style.display =
            "none";

    }

}


// ============================================================
// 更新
// ============================================================

function update(dt) {

    updatePlayer(dt);

    updateCPUAI(dt);

    updateBullets(dt);

    updateParticles(dt);

    updateHUD();


    if (
        player.hp <= 0 ||
        cpu.hp <= 0
    ) {

        finishGame();

    }

}


// ============================================================
// 描画
// ============================================================

let screenW =
    window.innerWidth;

let screenH =
    window.innerHeight;


function resize() {

    screenW =
        window.innerWidth;

    screenH =
        window.innerHeight;


    const dpr =
        window.devicePixelRatio ||
        1;


    canvas.width =
        screenW * dpr;


    canvas.height =
        screenH * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

}


window.addEventListener(
    "resize",
    resize
);


resize();


function sx(x) {

    return (
        x *
        screenW /
        WORLD_WIDTH
    );

}


function sy(y) {

    return (
        y *
        screenH /
        WORLD_HEIGHT
    );

}


// ============================================================
// 背景
// ============================================================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            screenH
        );


    gradient.addColorStop(
        0,
        "#111a35"
    );


    gradient.addColorStop(
        1,
        "#26395d"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        screenW,
        screenH
    );


    // 背景の建物
    ctx.fillStyle =
        "rgba(255,255,255,0.04)";


    for (
        let i = 0;
        i < 16;
        i++
    ) {

        const x =
            i *
            screenW /
            15;


        const height =
            80 +
            (i % 5) * 25;


        ctx.fillRect(
            x,
            screenH - height,
            60,
            height
        );

    }

}


// ============================================================
// マップ
// ============================================================

function drawMap() {

    // 地面
    ctx.fillStyle =
        "#121a2a";


    ctx.fillRect(
        0,
        sy(GROUND_Y),
        screenW,
        screenH
    );


    // 地面ライン
    ctx.fillStyle =
        "#71829e";


    ctx.fillRect(
        0,
        sy(GROUND_Y),
        screenW,
        5
    );


    // 足場
    for (const p of platforms) {

        ctx.fillStyle =
            "#536985";


        ctx.fillRect(
            sx(p.x),
            sy(p.y),
            sx(p.w),
            sy(p.h)
        );


        ctx.fillStyle =
            "#91a6c4";


        ctx.fillRect(
            sx(p.x),
            sy(p.y),
            sx(p.w),
            4
        );

    }

}


// ============================================================
// キャラクター
// ============================================================

function drawFighter(fighter) {

    const x =
        sx(fighter.x);

    const y =
        sy(fighter.y);

    const w =
        sx(fighter.w);

    const h =
        sy(fighter.h);


    ctx.save();


    if (
        fighter.hitTimer > 0
    ) {

        ctx.globalAlpha =
            0.45;

    }


    // 体
    ctx.fillStyle =
        fighter.color;


    ctx.fillRect(
        x,
        y,
        w,
        h
    );


    // 頭
    ctx.fillStyle =
        "#f2c8aa";


    ctx.beginPath();


    ctx.arc(
        x + w / 2,
        y + 13,
        10,
        0,
        Math.PI * 2
    );


    ctx.fill();


    // 銃
    ctx.fillStyle =
        "#0c1018";


    if (
        fighter.facing > 0
    ) {

        ctx.fillRect(
            x + w,
            y + 24,
            28,
            7
        );

    } else {

        ctx.fillRect(
            x - 28,
            y + 24,
            28,
            7
        );

    }


    ctx.restore();

}


// ============================================================
// 弾描画
// ============================================================

function drawBullets() {

    for (const bullet of bullets) {

        ctx.fillStyle =
            "#ffe681";


        ctx.beginPath();


        ctx.arc(
            sx(bullet.x),
            sy(bullet.y),
            4,
            0,
            Math.PI * 2
        );


        ctx.fill();

    }

}


// ============================================================
// パーティクル
// ============================================================

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life / 0.35
            );


        ctx.fillStyle =
            "#ffd86b";


        ctx.fillRect(
            sx(p.x),
            sy(p.y),
            4,
            4
        );

    }


    ctx.globalAlpha = 1;

}


// ============================================================
// 描画
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        screenW,
        screenH
    );


    drawBackground();

    drawMap();

    drawFighter(player);

    drawFighter(cpu);

    drawBullets();

    drawParticles();

}


// ============================================================
// ゲームループ
// ============================================================

function gameLoop(time) {

    if (!gameRunning) {

        return;

    }


    const dt =
        Math.min(
            0.033,
            (time - lastTime) / 1000
        );


    lastTime =
        time;


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


// ============================================================
// レベル選択
// ============================================================

const levelButtons =
    document.querySelectorAll(".levelButton");


levelButtons.forEach(button => {

    button.addEventListener("click", function(e) {

        e.preventDefault();
        e.stopPropagation();


        const selectedLevel =
            Number(this.dataset.level);


        // 選択されたレベルを保存
        level = selectedLevel;


        // 見た目を変更
        levelButtons.forEach(b => {
            b.classList.remove("selected");
        });


        this.classList.add("selected");


        console.log(
            "Selected Level:",
            level
        );

    });

});


// ============================================================
// スタート
// ============================================================

function startGame() {

    resetGame();


    startScreen.classList.add(
        "hidden"
    );


    resultScreen.classList.add(
        "hidden"
    );


    hud.classList.remove(
        "hidden"
    );


    gameRunning = true;


    lastTime =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );

}


startBtn.addEventListener(
    "click",
    startGame
);


// ============================================================
// 再戦
// ============================================================

restartBtn.addEventListener(
    "click",
    () => {

        resultScreen.classList.add(
            "hidden"
        );


        hud.classList.remove(
            "hidden"
        );


        startGame();

    }
);


// ============================================================
// 次のレベル
// ============================================================

nextLevelBtn.addEventListener(
    "click",
    () => {

        if (level < 5) {

            level++;

        }


        resultScreen.classList.add(
            "hidden"
        );


        hud.classList.remove(
            "hidden"
        );


        startGame();

    }
);


// ============================================================
// キーボード
// ============================================================

window.addEventListener(
    "keydown",
    e => {

        const key =
            e.key.toLowerCase();


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            keys.left = true;

        }


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            keys.right = true;

        }


        if (
            key === "w" ||
            key === "arrowup" ||
            key === " "
        ) {

            keys.jump = true;

            e.preventDefault();

        }


        if (key === "f") {

            keys.shoot = true;

        }

    }
);


window.addEventListener(
    "keyup",
    e => {

        const key =
            e.key.toLowerCase();


        if (
            key === "a" ||
            key === "arrowleft"
        ) {

            keys.left = false;

        }


        if (
            key === "d" ||
            key === "arrowright"
        ) {

            keys.right = false;

        }


        if (
            key === "w" ||
            key === "arrowup" ||
            key === " "
        ) {

            keys.jump = false;

        }


        if (key === "f") {

            keys.shoot = false;

        }

    }
);


// ============================================================
// マウス射撃
// ============================================================

canvas.addEventListener(
    "pointerdown",
    () => {

        keys.shoot = true;

        initAudio();

    }
);


window.addEventListener(
    "pointerup",
    () => {

        keys.shoot = false;

    }
);


// ============================================================
// スマホ
// ============================================================

document
    .querySelectorAll("[data-key]")
    .forEach(button => {

        const key =
            button.dataset.key;


        button.addEventListener(
            "pointerdown",
            e => {

                e.preventDefault();

                keys[key] = true;

                initAudio();

            }
        );


        button.addEventListener(
            "pointerup",
            e => {

                e.preventDefault();

                keys[key] = false;

            }
        );


        button.addEventListener(
            "pointercancel",
            () => {

                keys[key] = false;

            }
        );


        button.addEventListener(
            "pointerleave",
            () => {

                keys[key] = false;

            }
        );

    });


// ============================================================
// サウンド
// ============================================================

let audioContext = null;


function initAudio() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

}


function beep(
    frequency,
    duration,
    type,
    volume
) {

    if (!audioContext) {

        return;

    }


    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        type;


    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime +
        duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();


    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


function playShootSound() {

    beep(
        160,
        0.05,
        "square",
        0.035
    );

}


function playHitSound() {

    beep(
        80,
        0.08,
        "sawtooth",
        0.05
    );

}


function playJumpSound() {

    beep(
        350,
        0.06,
        "triangle",
        0.025
    );

}


// ============================================================
// 初期化
// ============================================================

loadMap();

resetGame();

draw();
