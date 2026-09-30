// ============================================================
// AI ARENA
// ============================================================


// ============================================================
// Canvas
// ============================================================

const canvas =
  document.getElementById("game");

const ctx =
  canvas.getContext("2d");


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

const menuBtn =
  document.getElementById("menuBtn");

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

const selectedLevelText =
  document.getElementById("selectedLevel");


// ============================================================
// サイズ
// ============================================================

const WORLD_W = 1280;

const WORLD_H = 720;

const GROUND = 620;

const GRAVITY = 1700;

const SPEED = 340;

const JUMP = 650;


// ============================================================
// 現在のLevel
// ============================================================

let currentLevel = 1;


// ============================================================
// マップ
// ============================================================

const LEVELS = {

  1: {

    name: "TRAINING",

    platforms: [

      {
        x: 500,
        y: 510,
        w: 220,
        h: 20
      }

    ],

    ai: .55

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

    ],

    ai: .65

  },


  3: {

    name: "FACTORY",

    platforms: [

      {
        x: 220,
        y: 530,
        w: 170,
        h: 20
      },

      {
        x: 890,
        y: 530,
        w: 170,
        h: 20
      },

      {
        x: 540,
        y: 450,
        w: 200,
        h: 20
      }

    ],

    ai: .73

  },


  4: {

    name: "ROOFTOPS",

    platforms: [

      {
        x: 150,
        y: 500,
        w: 180,
        h: 20
      },

      {
        x: 950,
        y: 500,
        w: 180,
        h: 20
      },

      {
        x: 480,
        y: 390,
        w: 320,
        h: 20
      }

    ],

    ai: .82

  },


  5: {

    name: "FINAL ARENA",

    platforms: [

      {
        x: 160,
        y: 520,
        w: 210,
        h: 20
      },

      {
        x: 910,
        y: 520,
        w: 210,
        h: 20
      },

      {
        x: 420,
        y: 430,
        w: 440,
        h: 20
      }

    ],

    ai: .92

  }

};


let platforms = [];


// ============================================================
// 入力
// ============================================================

const input = {

  left: false,

  right: false,

  jump: false,

  shoot: false

};


// ============================================================
// CPU専用入力
//
// プレイヤーのinputとは別物
// ============================================================

const cpuInput = {

  left: false,

  right: false,

  jump: false,

  shoot: false

};


// ============================================================
// ファイター
// ============================================================

function makeFighter(
  x,
  color,
  direction
) {

  return {

    x: x,

    y: GROUND - 60,

    w: 36,

    h: 60,

    vx: 0,

    vy: 0,

    color: color,

    direction: direction,

    hp: 10,

    ground: false,

    jumpLock: false,

    shootTimer: 0,

    hitTimer: 0

  };

}


let player;

let cpu;


// ============================================================
// 弾
// ============================================================

let bullets = [];


// ============================================================
// パーティクル
// ============================================================

let particles = [];


// ============================================================
// CPU思考
// ============================================================

let cpuThink = 0;


// ============================================================
// マップ読み込み
// ============================================================

function loadLevel(levelNumber) {

  currentLevel = levelNumber;

  const map =
    LEVELS[currentLevel];

  platforms =
    map.platforms.map(
      p => ({ ...p })
    );

}


// ============================================================
// ゲーム開始
// ============================================================

function startGame() {

  console.log(
    "GAME START LEVEL =",
    currentLevel
  );


  loadLevel(currentLevel);


  player =
    makeFighter(
      120,
      "#4da6ff",
      1
    );


  cpu =
    makeFighter(
      WORLD_W - 156,
      "#ff5369",
      -1
    );


  bullets = [];

  particles = [];


  cpuThink = 0;


  input.left = false;
  input.right = false;
  input.jump = false;
  input.shoot = false;


  cpuInput.left = false;
  cpuInput.right = false;
  cpuInput.jump = false;
  cpuInput.shoot = false;


  startScreen.classList.add(
    "hidden"
  );


  resultScreen.classList.add(
    "hidden"
  );


  hud.classList.remove(
    "hidden"
  );


  updateHUD();


  gameRunning = true;


  lastTime =
    performance.now();


  requestAnimationFrame(
    loop
  );

}


// ============================================================
// ゲーム状態
// ============================================================

let gameRunning = false;

let lastTime = 0;


// ============================================================
// レベルボタン
// ============================================================

const levelButtons =
  document.querySelectorAll(
    ".levelButton"
  );


levelButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      function() {

        const number =
          Number(
            this.dataset.level
          );


        if (
          !LEVELS[number]
        ) {

          return;

        }


        currentLevel =
          number;


        levelButtons.forEach(
          b => {

            b.classList.remove(
              "selected"
            );

          }
        );


        this.classList.add(
          "selected"
        );


        selectedLevelText.textContent =
          "Selected: LEVEL " +
          currentLevel;


        console.log(
          "LEVEL SELECTED:",
          currentLevel
        );

      }
    );

  }
);


// ============================================================
// START
// ============================================================

startBtn.addEventListener(
  "click",
  () => {

    startGame();

  }
);


// ============================================================
// 再戦
// ============================================================

restartBtn.addEventListener(
  "click",
  () => {

    startGame();

  }
);


// ============================================================
// メニュー
// ============================================================

menuBtn.addEventListener(
  "click",
  () => {

    gameRunning = false;

    resultScreen.classList.add(
      "hidden"
    );

    hud.classList.add(
      "hidden"
    );

    startScreen.classList.remove(
      "hidden"
    );

  }
);


// ============================================================
// 次のLevel
// ============================================================

nextLevelBtn.addEventListener(
  "click",
  () => {

    if (
      currentLevel < 5
    ) {

      currentLevel++;

    }


    levelButtons.forEach(
      b => {

        b.classList.remove(
          "selected"
        );


        if (
          Number(
            b.dataset.level
          ) === currentLevel
        ) {

          b.classList.add(
            "selected"
          );

        }

      }
    );


    selectedLevelText.textContent =
      "Selected: LEVEL " +
      currentLevel;


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

      input.left = true;

    }


    if (
      key === "d" ||
      key === "arrowright"
    ) {

      input.right = true;

    }


    if (
      key === "w" ||
      key === "arrowup" ||
      key === " "
    ) {

      input.jump = true;

      e.preventDefault();

    }


    if (
      key === "f"
    ) {

      input.shoot = true;

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

      input.left = false;

    }


    if (
      key === "d" ||
      key === "arrowright"
    ) {

      input.right = false;

    }


    if (
      key === "w" ||
      key === "arrowup" ||
      key === " "
    ) {

      input.jump = false;

    }


    if (
      key === "f"
    ) {

      input.shoot = false;

    }

  }
);


// ============================================================
// スマホ
// ============================================================

document
  .querySelectorAll(
    "[data-key]"
  )
  .forEach(
    button => {

      const key =
        button.dataset.key;


      button.addEventListener(
        "pointerdown",
        e => {

          e.preventDefault();

          input[key] = true;

        }
      );


      button.addEventListener(
        "pointerup",
        e => {

          e.preventDefault();

          input[key] = false;

        }
      );


      button.addEventListener(
        "pointercancel",
        () => {

          input[key] = false;

        }
      );

    }
  );


// ============================================================
// マウス射撃
// ============================================================

canvas.addEventListener(
  "pointerdown",
  () => {

    input.shoot = true;

  }
);


window.addEventListener(
  "pointerup",
  () => {

    input.shoot = false;

  }
);


// ============================================================
// CPU AI
// ============================================================

function updateCPU(dt) {

  const difficulty =
    LEVELS[currentLevel].ai;


  const playerCenter =
    player.x +
    player.w / 2;


  const cpuCenter =
    cpu.x +
    cpu.w / 2;


  const difference =
    playerCenter -
    cpuCenter;


  const distance =
    Math.abs(difference);


  cpuThink -= dt;


  if (
    cpuThink <= 0
  ) {

    cpuThink =
      0.15 +
      (1 - difficulty) *
      0.6;


    // 一度リセット
    cpuInput.left = false;

    cpuInput.right = false;

    cpuInput.jump = false;

    cpuInput.shoot = false;


    // ======================================
    // 移動
    // ======================================

    if (
      distance > 500
    ) {

      // プレイヤーへ近づく

      if (
        difference > 0
      ) {

        cpuInput.right = true;

      } else {

        cpuInput.left = true;

      }

    }

    else if (
      distance < 160
    ) {

      // 近すぎたら逃げる

      if (
        difference > 0
      ) {

        cpuInput.left = true;

      } else {

        cpuInput.right = true;

      }

    }

    else {

      // 中距離ではランダムに
      // 攻撃位置を変える

      const random =
        Math.random();


      if (
        random <
        difficulty * .45
      ) {

        if (
          difference > 0
        ) {

          cpuInput.right = true;

        } else {

          cpuInput.left = true;

        }

      }

      else if (
        random < .7
      ) {

        if (
          difference > 0
        ) {

          cpuInput.left = true;

        } else {

          cpuInput.right = true;

        }

      }

    }


    // ======================================
    // 射撃
    // ======================================

    if (
      distance < 700 &&
      Math.random() <
      difficulty
    ) {

      cpuInput.shoot = true;

    }


    // ======================================
    // ジャンプ
    // ======================================

    if (
      cpu.ground
    ) {

      // プレイヤーが高い
      if (
        player.y <
        cpu.y - 60 &&
        distance < 600
      ) {

        cpuInput.jump = true;

      }

      // 時々ジャンプ
      else if (
        Math.random() <
        .08 +
        difficulty * .08
      ) {

        cpuInput.jump = true;

      }

    }

  }


  // ======================================
  // CPU移動
  // ======================================

  let direction = 0;


  if (
    cpuInput.left
  ) {

    direction = -1;

  }


  if (
    cpuInput.right
  ) {

    direction = 1;

  }


  move(
    cpu,
    dt,
    direction,
    cpuInput.jump,
    .75 +
    difficulty * .25
  );


  // CPUはプレイヤーを見る
  if (
    difference > 0
  ) {

    cpu.direction = 1;

  } else {

    cpu.direction = -1;

  }


  // CPU射撃
  if (
    cpuInput.shoot
  ) {

    fire(
      cpu,
      Math.sign(
        difference
      )
    );

  }

}


// ============================================================
// 移動
// ============================================================

function move(
  fighter,
  dt,
  direction,
  jump,
  speedMultiplier
) {

  const oldY =
    fighter.y;


  fighter.vx =
    direction *
    SPEED *
    speedMultiplier;


  fighter.x +=
    fighter.vx *
    dt;


  fighter.x =
    Math.max(
      20,
      Math.min(
        WORLD_W -
        fighter.w -
        20,
        fighter.x
      )
    );


  // ジャンプ

  if (
    jump &&
    fighter.ground &&
    !fighter.jumpLock
  ) {

    fighter.vy =
      -JUMP;

    fighter.ground =
      false;

    fighter.jumpLock =
      true;

  }


  if (
    !jump
  ) {

    fighter.jumpLock =
      false;

  }


  // 重力

  fighter.vy +=
    GRAVITY *
    dt;


  fighter.y +=
    fighter.vy *
    dt;


  fighter.ground =
    false;


  // 地面

  if (
    fighter.y +
    fighter.h >=
    GROUND
  ) {

    fighter.y =
      GROUND -
      fighter.h;

    fighter.vy = 0;

    fighter.ground =
      true;

  }


  // 足場

  for (
    const p of platforms
  ) {

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
      p.y + 10;


    if (
      horizontal &&
      falling &&
      landing
    ) {

      fighter.y =
        p.y -
        fighter.h;

      fighter.vy = 0;

      fighter.ground =
        true;

    }

  }


  if (
    fighter.shootTimer > 0
  ) {

    fighter.shootTimer -= dt;

  }


  if (
    fighter.hitTimer > 0
  ) {

    fighter.hitTimer -= dt;

  }

}


// ============================================================
// プレイヤー
// ============================================================

function updatePlayer(dt) {

  const direction =
    (input.right ? 1 : 0) -
    (input.left ? 1 : 0);


  move(
    player,
    dt,
    direction,
    input.jump,
    1
  );


  if (
    input.shoot
  ) {

    fire(
      player,
      Math.sign(
        cpu.x -
        player.x
      )
    );

  }

}


// ============================================================
// 射撃
// ============================================================

function fire(
  shooter,
  direction
) {

  if (
    direction === 0
  ) {

    return;

  }


  if (
    shooter.shootTimer > 0
  ) {

    return;

  }


  shooter.shootTimer =
    .38;


  bullets.push({

    x:
      shooter.x +
      (
        direction > 0
          ? shooter.w
          : 0
      ),

    y:
      shooter.y + 25,

    vx:
      direction * 900,

    owner:
      shooter,

    life:
      1.5

  });

}


// ============================================================
// 弾
// ============================================================

function updateBullets(dt) {

  for (
    let i =
      bullets.length - 1;
    i >= 0;
    i--
  ) {

    const bullet =
      bullets[i];


    bullet.x +=
      bullet.vx *
      dt;


    bullet.life -=
      dt;


    let remove =
      bullet.life <= 0;


    // 足場

    for (
      const p of platforms
    ) {

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

      target.hp--;

      target.hitTimer =
        .12;


      if (
        target === cpu
      ) {

        // 被弾したらすぐ再判断
        cpuThink = 0;

      }


      remove = true;

    }


    if (
      bullet.x < -100 ||
      bullet.x >
      WORLD_W + 100
    ) {

      remove = true;

    }


    if (
      remove
    ) {

      bullets.splice(
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
    (
      player.hp * 10
    ) + "%";


  enemyHp.style.width =
    (
      cpu.hp * 10
    ) + "%";


  playerHpText.textContent =
    player.hp +
    " / 10";


  enemyHpText.textContent =
    cpu.hp +
    " / 10";


  levelText.textContent =
    "LEVEL " +
    currentLevel +
    "  " +
    LEVELS[currentLevel].name;

}


// ============================================================
// 勝敗
// ============================================================

function endGame() {

  gameRunning =
    false;


  hud.classList.add(
    "hidden"
  );


  resultScreen.classList.remove(
    "hidden"
  );


  if (
    player.hp > 0 &&
    cpu.hp <= 0
  ) {

    resultTitle.textContent =
      "YOU WIN!";


    if (
      currentLevel < 5
    ) {

      resultText.textContent =
        "LEVEL " +
        currentLevel +
        " CLEAR!";


      nextLevelBtn.style.display =
        "block";

    }

    else {

      resultText.textContent =
        "ALL LEVELS CLEAR!";


      nextLevelBtn.style.display =
        "none";

    }

  }

  else {

    resultTitle.textContent =
      "YOU LOSE";


    resultText.textContent =
      "CPUに10回ダメージを与える前に倒されました。";


    nextLevelBtn.style.display =
      "none";

  }

}


// ============================================================
// 更新
// ============================================================

function update(dt) {

  updatePlayer(dt);

  updateCPU(dt);

  updateBullets(dt);

  updateHUD();


  if (
    player.hp <= 0 ||
    cpu.hp <= 0
  ) {

    endGame();

  }

}


// ============================================================
// 描画サイズ
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


  canvas.style.width =
    screenW + "px";

  canvas.style.height =
    screenH + "px";


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
    WORLD_W
  );

}


function sy(y) {

  return (
    y *
    screenH /
    WORLD_H
  );

}


// ============================================================
// 描画
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
    "#10182f"
  );


  gradient.addColorStop(
    1,
    "#30496f"
  );


  ctx.fillStyle =
    gradient;


  ctx.fillRect(
    0,
    0,
    screenW,
    screenH
  );

}


function drawMap() {

  // 地面

  ctx.fillStyle =
    "#111927";


  ctx.fillRect(
    0,
    sy(GROUND),
    screenW,
    screenH
  );


  ctx.fillStyle =
    "#7185a3";


  ctx.fillRect(
    0,
    sy(GROUND),
    screenW,
    5
  );


  // 足場

  for (
    const p of platforms
  ) {

    ctx.fillStyle =
      "#536a89";


    ctx.fillRect(
      sx(p.x),
      sy(p.y),
      sx(p.w),
      sy(p.h)
    );


    ctx.fillStyle =
      "#9db1ce";


    ctx.fillRect(
      sx(p.x),
      sy(p.y),
      sx(p.w),
      4
    );

  }

}


function drawFighter(
  fighter
) {

  const x =
    sx(fighter.x);

  const y =
    sy(fighter.y);

  const w =
    sx(fighter.w);


  ctx.save();


  if (
    fighter.hitTimer > 0
  ) {

    ctx.globalAlpha =
      .4;

  }


  // 体

  ctx.fillStyle =
    fighter.color;


  ctx.fillRect(
    x,
    y,
    w,
    sy(fighter.h)
  );


  // 頭

  ctx.fillStyle =
    "#f0c5a4";


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
    "#0a0e16";


  if (
    fighter.direction > 0
  ) {

    ctx.fillRect(
      x + w,
      y + 24,
      28,
      7
    );

  }

  else {

    ctx.fillRect(
      x - 28,
      y + 24,
      28,
      7
    );

  }


  ctx.restore();

}


function drawBullets() {

  for (
    const b of bullets
  ) {

    ctx.fillStyle =
      "#ffe27a";


    ctx.beginPath();


    ctx.arc(
      sx(b.x),
      sy(b.y),
      4,
      0,
      Math.PI * 2
    );


    ctx.fill();

  }

}


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

}


// ============================================================
// ゲームループ
// ============================================================

function loop(time) {

  if (
    !gameRunning
  ) {

    return;

  }


  const dt =
    Math.min(
      .033,
      (time -
        lastTime) /
        1000
    );


  lastTime =
    time;


  update(dt);

  draw();


  requestAnimationFrame(
    loop
  );

}


// ============================================================
// 初期状態
// ============================================================

loadLevel(1);

player =
  makeFighter(
    120,
    "#4da6ff",
    1
  );

cpu =
  makeFighter(
    WORLD_W - 156,
    "#ff5369",
    -1
  );

updateHUD();

draw();
