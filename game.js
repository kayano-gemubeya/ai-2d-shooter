// ============================================================
// AI ARENA - 2D SHOOTER
// CPU AI + LEVEL 1-5
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const resultScreen = document.getElementById("resultScreen");
const hud = document.getElementById("hud");

const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

const playerHp = document.getElementById("playerHp");
const enemyHp = document.getElementById("enemyHp");
const playerHpText = document.getElementById("playerHpText");
const enemyHpText = document.getElementById("enemyHpText");


// ============================================================
// 基本設定
// ============================================================

const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 720;

const GROUND_Y = 620;

const GRAVITY = 1800;
const PLAYER_SPEED = 350;
const JUMP_POWER = 650;

let W = window.innerWidth;
let H = window.innerHeight;

let gameRunning = false;
let lastTime = 0;

let shots = [];
let particles = [];

let currentLevel = 1;

let audioCtx = null;


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
// レベルデータ
// ============================================================

const LEVELS = {

    1: {
        name: "TRAINING",
        platforms: [
            { x: 400, y: 520, w: 180, h: 20 },
            { x: 700, y: 500, w: 180, h: 20 }
        ],
        ai: {
            reaction: 0.75,
            accuracy: 0.65,
            aggression: 0.45,
            speed: 290
        }
    },

    2: {
        name: "CITY",
        platforms: [
            { x: 280, y: 500, w: 170, h: 20 },
            { x: 830, y: 500, w: 170, h: 20 },
            { x: 555, y: 430, w: 170, h: 20 }
        ],
        ai: {
            reaction: 0.62,
            accuracy: 0.72,
            aggression: 0.55,
            speed: 300
        }
    },

    3: {
        name: "FACTORY",
        platforms: [
            { x: 250, y: 530, w: 150, h: 20 },
            { x: 880, y: 530, w: 150, h: 20 },
            { x: 520, y: 470, w: 240, h: 20 }
        ],
        ai: {
            reaction: 0.50,
            accuracy: 0.78,
            aggression: 0.62,
            speed: 315
        }
    },

    4: {
        name: "ROOFTOPS",
        platforms: [
            { x: 180, y: 500, w: 170, h: 20 },
            { x: 930, y: 500, w: 170, h: 20 },
            { x: 500, y: 390, w: 280, h: 20 }
        ],
        ai: {
            reaction: 0.38,
            accuracy: 0.84,
            aggression: 0.70,
            speed: 330
        }
    },

    5: {
        name: "FINAL ARENA",
        platforms: [
            { x: 200, y: 520, w: 190, h: 20 },
            { x: 890, y: 520, w: 190, h: 20 },
            { x: 450, y: 450, w: 380, h: 20 }
        ],
        ai: {
            reaction: 0.25,
            accuracy: 0.91,
            aggression: 0.82,
            speed: 345
        }
    }

};


// ============================================================
// 現在のマップ
// ============================================================

let platforms = [];

function loadLevel(levelNumber) {

    currentLevel = levelNumber;

    const data = LEVELS[currentLevel];

    platforms = data.platforms.map(p => ({
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h
    }));
}


// ============================================================
// ファイター生成
// ============================================================

function createFighter(x, color, facing) {

    return {

        x: x,
        y: GROUND_Y - 58,

        vx: 0,
        vy: 0,

        w: 34,
        h: 58,

        color: color,
        facing: facing,

        hp: 10,

        onGround: false,

        cooldown: 0,

        hitFlash: 0,

        jumpLock: false,

        // AI専用
        aiDecisionTimer: 0,
        aiDirection: 0,
        aiWantJump: false,
        aiWantShoot: false,

        lastPlayerX: 0,
        lastPlayerY: 0,

        // ダメージを受けた直後
        damageReaction: 0
    };
}


let player;
let cpu;


// ============================================================
// ゲームリセット
// ============================================================

function resetGame() {

    loadLevel(currentLevel);

    player = createFighter(
        150,
        "#4da6ff",
        1
    );

    cpu = createFighter(
        WORLD_WIDTH - 190,
        "#ff5c70",
        -1
    );

    shots = [];
    particles = [];

    updateHud();
}


// ============================================================
// 画面サイズ
// ============================================================

function resize() {

    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}

window.addEventListener("resize", resize);

resize();


function sx(x) {
    return x * (W / WORLD_WIDTH);
}


function sy(y) {
    return y * (H / WORLD_HEIGHT);
}


// ============================================================
// スタート
// ============================================================

function startGame() {

    resetGame();

    startScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    hud.classList.remove("hidden");

    gameRunning = true;

    lastTime = performance.now();

    initSound();

    requestAnimationFrame(gameLoop);
}


document.getElementById("startBtn").onclick = startGame;
document.getElementById("restartBtn").onclick = startGame;


// ============================================================
// レベル選択UI
// ============================================================

// HTMLを大幅に変更しなくてもいいように、
// JavaScriptからレベル選択ボタンを追加する。

const levelBox = document.createElement("div");

levelBox.id = "levelSelect";

levelBox.style.marginTop = "18px";
levelBox.style.display = "flex";
levelBox.style.flexWrap = "wrap";
levelBox.style.justifyContent = "center";
levelBox.style.gap = "8px";

for (let i = 1; i <= 5; i++) {

    const button = document.createElement("button");

    button.textContent = "LEVEL " + i;

    button.style.padding = "8px 12px";
    button.style.fontSize = "13px";

    button.onclick = () => {

        currentLevel = i;

        document.querySelectorAll("#levelSelect button")
            .forEach(b => {
                b.style.opacity = "0.55";
            });

        button.style.opacity = "1";
    };

    levelBox.appendChild(button);
}

startScreen.querySelector(".panel").appendChild(levelBox);


// ============================================================
// キーボード
// ============================================================

function handleKey(e, down) {

    const key = e.key.toLowerCase();

    if (key === "a" || key === "arrowleft") {
        keys.left = down;
    }

    if (key === "d" || key === "arrowright") {
        keys.right = down;
    }

    if (
        key === "w" ||
        key === "arrowup" ||
        key === " "
    ) {
        keys.jump = down;
    }

    if (key === "f") {
        keys.shoot = down;
    }

    if (
        key === "arrowleft" ||
        key === "arrowright" ||
        key === "arrowup" ||
        key === " "
    ) {
        e.preventDefault();
    }
}


window.addEventListener(
    "keydown",
    e => handleKey(e, true)
);

window.addEventListener(
    "keyup",
    e => handleKey(e, false)
);


// ============================================================
// マウス射撃
// ============================================================

canvas.addEventListener(
    "pointerdown",
    () => {

        keys.shoot = true;

        initSound();
    }
);


window.addEventListener(
    "pointerup",
    () => {
        keys.shoot = false;
    }
);


// ============================================================
// スマホボタン
// ============================================================

document
    .querySelectorAll("[data-key]")
    .forEach(button => {

        const key = button.dataset.key;

        button.addEventListener(
            "pointerdown",
            e => {

                e.preventDefault();

                keys[key] = true;

                initSound();
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

    });


// ============================================================
// サウンド
// ============================================================

function initSound() {

    if (!audioCtx) {

        audioCtx = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}


function beep(
    frequency,
    duration,
    type = "square",
    volume = 0.04
) {

    if (!audioCtx) return;

    const oscillator =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    oscillator.type = type;

    oscillator.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        volume,
        audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();

    oscillator.stop(
        audioCtx.currentTime + duration
    );
}


function shootSound() {

    beep(180, 0.05, "sawtooth", 0.035);
}


function hitSound() {

    beep(90, 0.09, "square", 0.05);
}


function jumpSound() {

    beep(390, 0.07, "triangle", 0.025);
}


// ============================================================
// 衝突判定
// ============================================================

function overlap(a, b) {

    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}


// ============================================================
// 地面・足場
// ============================================================

function checkGround(fighter, oldY) {

    fighter.onGround = false;

    const bottom =
        fighter.y + fighter.h;

    // 地面
    if (
        bottom >= GROUND_Y &&
        oldY + fighter.h <= GROUND_Y + 5
    ) {

        fighter.y =
            GROUND_Y - fighter.h;

        fighter.vy = 0;

        fighter.onGround = true;

        return;
    }


    // 足場
    for (const p of platforms) {

        const horizontal =
            fighter.x + fighter.w > p.x &&
            fighter.x < p.x + p.w;

        const fallingOnto =
            bottom >= p.y &&
            oldY + fighter.h <= p.y + 6;

        if (horizontal && fallingOnto) {

            fighter.y =
                p.y - fighter.h;

            fighter.vy = 0;

            fighter.onGround = true;

            return;
        }
    }
}


// ============================================================
// ファイター移動
// ============================================================

function moveFighter(
    fighter,
    dt,
    direction,
    jump
) {

    const oldY = fighter.y;

    fighter.vx =
        direction * PLAYER_SPEED;

    fighter.x +=
        fighter.vx * dt;


    // マップ外に出ない
    fighter.x =
        Math.max(
            20,
            Math.min(
                WORLD_WIDTH - fighter.w - 20,
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

        fighter.onGround = false;

        fighter.jumpLock = true;

        jumpSound();
    }


    if (!jump) {
        fighter.jumpLock = false;
    }


    // 重力
    fighter.vy +=
        GRAVITY * dt;

    fighter.y +=
        fighter.vy * dt;


    checkGround(
        fighter,
        oldY
    );


    if (fighter.cooldown > 0) {
        fighter.cooldown -= dt;
    }

    if (fighter.hitFlash > 0) {
        fighter.hitFlash -= dt;
    }

    if (fighter.damageReaction > 0) {
        fighter.damageReaction -= dt;
    }
}


// ============================================================
// 射撃
// ============================================================

function fire(fighter, direction) {

    if (fighter.cooldown > 0) {
        return;
    }

    if (direction === 0) {
        return;
    }

    fighter.cooldown = 0.42;

    const bulletX =
        direction > 0
            ? fighter.x + fighter.w + 4
            : fighter.x - 4;

    const bulletY =
        fighter.y + 24;


    shots.push({

        x: bulletX,

        y: bulletY,

        vx: direction * 900,

        owner: fighter,

        radius: 5,

        life: 1.5
    });


    shootSound();
}


// ============================================================
// ダメージ
// ============================================================

function damage(target) {

    target.hp--;

    target.hitFlash = 0.12;

    target.damageReaction = 0.3;

    hitSound();


    for (let i = 0; i < 10; i++) {

        particles.push({

            x:
                target.x +
                target.w / 2,

            y:
                target.y + 20,

            vx:
                (Math.random() - 0.5) * 220,

            vy:
                (Math.random() - 0.5) * 200,

            life: 0.4
        });
    }
}


// ============================================================
// CPU AI
// ============================================================

function updateAI(dt) {

    const settings =
        LEVELS[currentLevel].ai;


    // --------------------------------------------------------
    // プレイヤーとの距離
    // --------------------------------------------------------

    const playerCenter =
        player.x + player.w / 2;

    const cpuCenter =
        cpu.x + cpu.w / 2;

    const dx =
        playerCenter - cpuCenter;

    const distance =
        Math.abs(dx);


    const verticalDistance =
        player.y - cpu.y;


    // --------------------------------------------------------
    // CPUは一定時間ごとに「考える」
    // --------------------------------------------------------

    cpu.aiDecisionTimer -= dt;


    if (cpu.aiDecisionTimer <= 0) {

        cpu.aiDecisionTimer =
            settings.reaction *
            (0.75 + Math.random() * 0.5);


        // ====================================================
        // CPUの基本行動
        // ====================================================

        let direction = 0;


        // プレイヤーがかなり遠い
        if (distance > 500) {

            direction =
                Math.sign(dx);
        }


        // 中距離
        else if (distance > 280) {

            // 攻撃しながら近づくことがある
            if (
                Math.random() <
                settings.aggression
            ) {

                direction =
                    Math.sign(dx);

            } else {

                direction = 0;
            }
        }


        // 近距離
        else {

            // 近づきすぎたら距離を取る
            if (distance < 150) {

                direction =
                    -Math.sign(dx);

            } else {

                // 少しランダムに動く
                const random =
                    Math.random();

                if (
                    random <
                    settings.aggression
                ) {

                    direction =
                        Math.sign(dx);

                } else if (
                    random < 0.5
                ) {

                    direction =
                        -Math.sign(dx);

                } else {

                    direction = 0;
                }
            }
        }


        // ====================================================
        // CPUの射撃判断
        // ====================================================

        let wantsShoot = false;


        if (
            distance < 700
        ) {

            const chance =
                settings.accuracy;


            if (
                Math.random() <
                chance
            ) {

                wantsShoot = true;
            }
        }


        // ====================================================
        // 高低差がある場合
        // ====================================================

        let wantsJump = false;


        if (cpu.onGround) {

            // プレイヤーが上にいる
            if (
                verticalDistance < -60 &&
                distance < 500
            ) {

                wantsJump = true;
            }


            // プレイヤーが遠くて
            // 高い場所に移動したい
            else if (
                distance > 400 &&
                Math.random() < 0.25
            ) {

                wantsJump = true;
            }


            // 被弾した直後はジャンプして逃げる
            else if (
                cpu.damageReaction > 0 &&
                Math.random() < 0.55
            ) {

                wantsJump = true;
            }
        }


        // ====================================================
        // 足場を見てジャンプ
        // ====================================================

        const nextPlatform =
            findUsefulPlatform(cpu);


        if (
            nextPlatform &&
            cpu.onGround &&
            Math.random() < 0.35
        ) {

            wantsJump = true;
        }


        cpu.aiDirection =
            direction;

        cpu.aiWantJump =
            wantsJump;

        cpu.aiWantShoot =
            wantsShoot;
    }


    // ========================================================
    // 実際にAIを動かす
    // ========================================================

    moveFighter(
        cpu,
        dt,
        cpu.aiDirection,
        cpu.aiWantJump
    );


    // ========================================================
    // AIの向き
    // ========================================================

    if (dx > 0) {

        cpu.facing = 1;

    } else if (dx < 0) {

        cpu.facing = -1;
    }


    // ========================================================
    // AI射撃
    // ========================================================

    if (cpu.aiWantShoot) {

        let aimDirection =
            Math.sign(dx);


        // 精度によるミス
        const accuracy =
            settings.accuracy;


        if (
            Math.random() >
            accuracy
        ) {

            // わざと逆方向に撃つこともある
            if (Math.random() < 0.5) {
                aimDirection *= -1;
            }
        }


        fire(
            cpu,
            aimDirection
        );
    }
}


// ============================================================
// CPUが使えそうな足場を探す
// ============================================================

function findUsefulPlatform(fighter) {

    let closest = null;

    let bestDistance = Infinity;


    for (const p of platforms) {

        // 現在地より少し上にある足場
        if (
            p.y < fighter.y &&
            Math.abs(
                p.x -
                fighter.x
            ) < 450
        ) {

            const distance =
                Math.abs(
                    (p.x + p.w / 2) -
                    (fighter.x + fighter.w / 2)
                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                closest = p;
            }
        }
    }


    return closest;
}


// ============================================================
// 弾更新
// ============================================================

function updateShots(dt) {

    for (
        let i = shots.length - 1;
        i >= 0;
        i--
    ) {

        const shot =
            shots[i];


        shot.x +=
            shot.vx * dt;

        shot.life -= dt;


        let remove =
            shot.life <= 0 ||
            shot.x < -30 ||
            shot.x > WORLD_WIDTH + 30;


        // ----------------------------------------------------
        // 足場との衝突
        // ----------------------------------------------------

        if (!remove) {

            for (const p of platforms) {

                if (
                    shot.x > p.x &&
                    shot.x < p.x + p.w &&
                    shot.y > p.y &&
                    shot.y < p.y + p.h
                ) {

                    remove = true;

                    break;
                }
            }
        }


        // ----------------------------------------------------
        // プレイヤー / CPUとの衝突
        // ----------------------------------------------------

        const target =
            shot.owner === player
                ? cpu
                : player;


        if (
            !remove &&
            shot.x > target.x &&
            shot.x < target.x + target.w &&
            shot.y > target.y &&
            shot.y < target.y + target.h
        ) {

            damage(target);

            remove = true;
        }


        if (remove) {
            shots.splice(i, 1);
        }
    }
}


// ============================================================
// パーティクル
// ============================================================

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
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


        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


// ============================================================
// ゲーム更新
// ============================================================

function update(dt) {

    // --------------------------------------------------------
    // プレイヤー
    // --------------------------------------------------------

    const direction =
        (keys.right ? 1 : 0) -
        (keys.left ? 1 : 0);


    moveFighter(
        player,
        dt,
        direction,
        keys.jump
    );


    // --------------------------------------------------------
    // プレイヤー射撃
    // --------------------------------------------------------

    if (keys.shoot) {

        const directionToCPU =
            Math.sign(
                (cpu.x + cpu.w / 2) -
                (player.x + player.w / 2)
            );


        fire(
            player,
            directionToCPU
        );
    }


    // --------------------------------------------------------
    // CPU
    // --------------------------------------------------------

    updateAI(dt);


    // --------------------------------------------------------
    // 弾
    // --------------------------------------------------------

    updateShots(dt);


    // --------------------------------------------------------
    // パーティクル
    // --------------------------------------------------------

    updateParticles(dt);


    // --------------------------------------------------------
    // HP
    // --------------------------------------------------------

    updateHud();


    // --------------------------------------------------------
    // 勝敗
    // --------------------------------------------------------

    if (
        player.hp <= 0 ||
        cpu.hp <= 0
    ) {

        endGame();
    }
}


// ============================================================
// HUD
// ============================================================

function updateHud() {

    playerHp.style.width =
        (player.hp * 10) + "%";

    enemyHp.style.width =
        (cpu.hp * 10) + "%";


    playerHpText.textContent =
        player.hp + " / 10";

    enemyHpText.textContent =
        cpu.hp + " / 10";


    // レベル表示
    let levelText =
        document.getElementById(
            "levelText"
        );


    if (!levelText) {

        levelText =
            document.createElement("div");

        levelText.id =
            "levelText";

        levelText.style.position =
            "absolute";

        levelText.style.left =
            "50%";

        levelText.style.top =
            "70px";

        levelText.style.transform =
            "translateX(-50%)";

        levelText.style.color =
            "white";

        levelText.style.fontWeight =
            "bold";

        levelText.style.fontSize =
            "14px";

        levelText.style.pointerEvents =
            "none";

        document
            .getElementById("gameWrap")
            .appendChild(levelText);
    }


    levelText.textContent =
        "LEVEL " +
        currentLevel +
        "  -  " +
        LEVELS[currentLevel].name;
}


// ============================================================
// ゲーム終了
// ============================================================

function endGame() {

    gameRunning = false;

    resultScreen.classList.remove(
        "hidden"
    );


    const playerWon =
        cpu.hp <= 0 &&
        player.hp > 0;


    if (playerWon) {

        resultTitle.textContent =
            "YOU WIN!";

        if (currentLevel < 5) {

            resultText.textContent =
                "LEVEL " +
                currentLevel +
                " CLEAR!";

        } else {

            resultText.textContent =
                "ALL LEVELS CLEAR!";
        }

    } else {

        resultTitle.textContent =
            "YOU LOSE";

        resultText.textContent =
            "CPUに負けました。もう一度挑戦しよう！";
    }
}


// ============================================================
// 背景描画
// ============================================================

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );


    gradient.addColorStop(
        0,
        "#10182f"
    );

    gradient.addColorStop(
        1,
        "#293a60"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    // 建物
    ctx.fillStyle =
        "rgba(255,255,255,0.035)";


    for (
        let i = 0;
        i < 20;
        i++
    ) {

        const width =
            45 + (i % 4) * 20;

        const height =
            70 + (i % 5) * 30;


        ctx.fillRect(
            i * 75 * (W / WORLD_WIDTH),
            H * 0.86 - height,
            width * (W / WORLD_WIDTH),
            height
        );
    }
}


// ============================================================
// マップ描画
// ============================================================

function drawMap() {

    // 地面

    ctx.fillStyle =
        "#151e31";

    ctx.fillRect(
        0,
        sy(GROUND_Y),
        W,
        H - sy(GROUND_Y)
    );


    ctx.fillStyle =
        "#536680";

    ctx.fillRect(
        0,
        sy(GROUND_Y),
        W,
        6
    );


    // 足場

    for (const p of platforms) {

        ctx.fillStyle =
            "#596b88";

        ctx.fillRect(
            sx(p.x),
            sy(p.y),
            sx(p.w),
            sy(p.h)
        );


        ctx.fillStyle =
            "#8195b7";

        ctx.fillRect(
            sx(p.x),
            sy(p.y),
            sx(p.w),
            4
        );
    }
}


// ============================================================
// キャラクター描画
// ============================================================

function drawFighter(fighter) {

    const x =
        sx(fighter.x);

    const y =
        sy(fighter.y);

    const width =
        sx(fighter.w);

    const height =
        sy(fighter.h);


    ctx.save();


    if (
        fighter.hitFlash > 0
    ) {

        ctx.globalAlpha =
            0.5;
    }


    // 本体
    ctx.fillStyle =
        fighter.color;

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    // 頭
    ctx.fillStyle =
        "#f4d1b5";

    ctx.beginPath();

    ctx.arc(
        x + width / 2,
        y + 13 * (W / WORLD_WIDTH),
        10 * (W / WORLD_WIDTH),
        0,
        Math.PI * 2
    );

    ctx.fill();


    // 銃
    ctx.fillStyle =
        "#101522";


    if (fighter.facing > 0) {

        ctx.fillRect(
            x + width,
            y + 23 * (W / WORLD_WIDTH),
            28 * (W / WORLD_WIDTH),
            6 * (W / WORLD_WIDTH)
        );

    } else {

        ctx.fillRect(
            x - 28 * (W / WORLD_WIDTH),
            y + 23 * (W / WORLD_WIDTH),
            28 * (W / WORLD_WIDTH),
            6 * (W / WORLD_WIDTH)
        );
    }


    ctx.restore();
}


// ============================================================
// 弾描画
// ============================================================

function drawShots() {

    for (const shot of shots) {

        ctx.fillStyle =
            "#fff3a1";

        ctx.beginPath();

        ctx.arc(
            sx(shot.x),
            sy(shot.y),
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


// ============================================================
// パーティクル描画
// ============================================================

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life / 0.4
            );

        ctx.fillStyle =
            "#ffd66b";

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
// 全体描画
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    drawBackground();

    drawMap();

    drawFighter(player);

    drawFighter(cpu);

    drawShots();

    drawParticles();
}


// ============================================================
// ゲームループ
// ============================================================

function gameLoop(now) {

    if (!gameRunning) {
        return;
    }


    const dt =
        Math.min(
            0.033,
            (now - lastTime) / 1000
        );


    lastTime = now;


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// 初期化
// ============================================================

loadLevel(1);

resetGame();

draw();
