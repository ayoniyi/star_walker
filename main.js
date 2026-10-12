import platform from "/images/platform.png";
import platformSmall from "/images/platformSmallTall.png";
import background from "/images/background.png";
import hills from "/images/hills.png";
import spriteRunLeft from "/images/spriteRunLeft.png";
import spriteRunRight from "/images/spriteRunRight.png";
import spriteStandLeft from "/images/spriteStandLeft.png";
import spriteStandRight from "/images/spriteStandRight.png";

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = 576;

const music = document.getElementById("music"); // optional <audio id="music">

/* ------------------------------------------------------------------ */
/* CONFIG – tweak these to tune the game                               */
/* ------------------------------------------------------------------ */
const gravity = 0.5;
const JUMP_SPEED = 13.5; // peak jump is ~175px
const STAGE_LENGTH = 60000; // world px of generated platforms before the finish section
const START_LIVES = 3;
const MAX_LIVES = 5;
const ENEMY_GOAL_RATIO = 0.6; // share of enemies that must be avoided to clear the stage
const GROUND_Y = 452; // original ground height
const LEVEL_STEP = 80; // vertical gap between platform "levels" (always jumpable)
const MAX_LEVEL = 2;

const ENEMY_TYPES = {
  slime: { w: 60, h: 45, damage: 1, points: 25 }, // -1 life
  spike: { w: 56, h: 56, damage: 2, points: 50 }, // -2 lives
  demon: { w: 64, h: 100, damage: Infinity, points: 100 }, // instant game over
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const levelY = (level) => GROUND_Y - level * LEVEL_STEP;
const overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function heartPath(x, y, s) {
  // x = horizontal centre, y = top
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  c.bezierCurveTo(
    x,
    y + s * 0.8,
    x + s * 0.5,
    y + s * 0.6,
    x + s * 0.5,
    y + s * 0.3,
  );
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  c.closePath();
}

function drawEyes(x1, x2, y, r, dir) {
  c.fillStyle = "#fff";
  [x1, x2].forEach((x) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  });
  c.fillStyle = "#111";
  [x1, x2].forEach((x) => {
    c.beginPath();
    c.arc(x + dir * r * 0.35, y, r * 0.5, 0, Math.PI * 2);
    c.fill();
  });
}

/* ------------------------------------------------------------------ */
/* Sound – synthesised with the Web Audio API (no audio files needed)  */
/* ------------------------------------------------------------------ */
let muted = false;
let audioCtx = null;

function getAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone({
  freq,
  end = freq,
  duration = 0.15,
  type = "square",
  volume = 0.15,
  delay = 0,
}) {
  if (muted) return;
  const ctx = getAudio();
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(end, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

const sfx = {
  jump: () => tone({ freq: 280, end: 640, duration: 0.18 }),
  doubleJump: () => tone({ freq: 420, end: 880, duration: 0.18 }),
  life: () => {
    tone({ freq: 660, duration: 0.1, type: "triangle", volume: 0.25 });
    tone({
      freq: 990,
      duration: 0.2,
      type: "triangle",
      volume: 0.25,
      delay: 0.09,
    });
  },
  hit: () =>
    tone({ freq: 260, end: 40, duration: 0.4, type: "sawtooth", volume: 0.3 }),
  pause: () =>
    tone({ freq: 440, end: 330, duration: 0.1, type: "triangle", volume: 0.2 }),
  gameOver: () =>
    [392, 330, 262, 196].forEach((f, i) =>
      tone({
        freq: f,
        duration: 0.3,
        type: "triangle",
        volume: 0.25,
        delay: i * 0.25,
      }),
    ),
  win: () =>
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, duration: 0.25, volume: 0.15, delay: i * 0.15 }),
    ),
};

const soundBtn = document.getElementById("soundBtn");
const soundIcon = document.getElementById("soundIcon");

function updateSoundUI() {
  if (soundIcon) {
    soundIcon.src = muted ? "./soundoff.png" : "./soundon.png";
    soundIcon.alt = muted ? "Sound Off" : "Sound On";
  }
  const modalSoundBtn = document.getElementById("modalSoundBtn");
  if (modalSoundBtn) {
    modalSoundBtn.textContent = muted ? "Sound: Off" : "Sound: On";
  }
}

function toggleMute() {
  getAudio();
  muted = !muted;
  if (music) {
    music.muted = muted;
    if (muted) {
      music.pause();
    } else if (state === "playing") {
      playMusic();
    }
  }
  updateSoundUI();
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    toggleMute();
  });
}

function playMusic() {
  if (music && !muted) music.play().catch(() => {});
}
function stopMusic(reset = false) {
  if (!music) return;
  music.pause();
  if (reset) music.currentTime = 0;
}

/* ------------------------------------------------------------------ */
/* Assets – loaded once, game starts when all are ready                */
/* ------------------------------------------------------------------ */
const pending = [];
function createImage(src) {
  const image = new Image();
  pending.push(
    new Promise((resolve) => {
      image.onload = image.onerror = resolve;
    }),
  );
  image.src = src;
  return image;
}

const assets = {
  platform: createImage(platform),
  platformSmall: createImage(platformSmall),
  background: createImage(background),
  hills: createImage(hills),
  standRight: createImage(spriteStandRight),
  standLeft: createImage(spriteStandLeft),
  runRight: createImage(spriteRunRight),
  runLeft: createImage(spriteRunLeft),
};

/* ------------------------------------------------------------------ */
/* Game state                                                          */
/* ------------------------------------------------------------------ */
let state = "title"; // title | playing | paused | gameover | complete
let player;
let platforms = [];
let enemies = [];
let pickups = [];
let genericObjects = [];
let lastKey;
let scrollOffset = 0; // how far the world has scrolled
let bestDistance = 0; // furthest distance reached (px) – drives the score
let bonusScore = 0;
let lives = START_LIVES;
let enemiesAvoided = 0;
let enemyGoal = 1;
let finishX = 0; // world x of the finish flag
let gameOverReason = "";
let tick = 0;
let button = null; // on-canvas button rect for the current overlay
let buttonHover = false;

const keys = {
  right: { pressed: false },
  left: { pressed: false },
};

const getScore = () => Math.floor(bestDistance / 10) + bonusScore;

/* ------------------------------------------------------------------ */
/* Classes                                                             */
/* ------------------------------------------------------------------ */
class Player {
  constructor() {
    this.speed = 10;
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 66;
    this.height = 150;
    this.frames = 0;
    this.sprites = {
      stand: {
        right: assets.standRight,
        left: assets.standLeft,
        cropWidth: 177,
        width: 66,
        frames: 60,
      },
      run: {
        right: assets.runRight,
        left: assets.runLeft,
        cropWidth: 341,
        width: 127.85,
        frames: 30,
      },
    };
    this.kind = "stand";
    this.facing = "right";
    this.currentSprite = this.sprites.stand.right;
    this.currentCropWidth = 177;
    this.onGround = false;
    this.coyote = 0; // frames after leaving a ledge where jumping is still allowed
    this.jumps = 2; // double jump counter: resets on landing
    this.invulnerable = 0; // frames of damage immunity
  }

  setSprite(kind, facing) {
    if (kind === this.kind && facing === this.facing) return;
    const s = this.sprites[kind];
    this.kind = kind;
    this.facing = facing;
    this.currentSprite = s[facing];
    this.currentCropWidth = s.cropWidth;
    this.width = s.width;
    this.frames = 0;
  }

  get hitbox() {
    const inset = this.width * 0.2;
    return {
      x: this.position.x + inset,
      y: this.position.y + 10,
      w: this.width - inset * 2,
      h: this.height - 10,
    };
  }

  draw() {
    c.save();
    if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0)
      c.globalAlpha = 0.35;
    c.drawImage(
      this.currentSprite,
      this.currentCropWidth * this.frames, // crop x: loops through sprite-sheet frames
      0,
      this.currentCropWidth,
      400, // crop height
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
    c.restore();
  }

  update() {
    this.frames = (this.frames + 1) % this.sprites[this.kind].frames;
    if (this.invulnerable > 0) this.invulnerable--;

    const prevBottom = this.position.y + this.height;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y = Math.min(this.velocity.y + gravity, 20); // accelerate, with a terminal velocity

    // land on top of platforms (one-way: you can jump up through them)
    this.onGround = false;
    const bottom = this.position.y + this.height;
    const hb = this.hitbox;
    for (const p of platforms) {
      if (
        prevBottom <= p.position.y + 1 &&
        bottom >= p.position.y &&
        hb.x + hb.w > p.position.x &&
        hb.x < p.position.x + p.width
      ) {
        this.position.y = p.position.y - this.height;
        this.velocity.y = 0;
        this.onGround = true;
      }
    }
    this.coyote = this.onGround ? 7 : Math.max(0, this.coyote - 1);
    if (this.onGround) this.jumps = 2;
  }
}

class Platform {
  constructor({ x, y, image }) {
    this.position = { x, y };
    this.image = image;
  }
  get width() {
    return this.image.width || 580;
  }
  get height() {
    return this.image.height || 125;
  }
  draw() {
    if (this.position.x > canvas.width || this.position.x + this.width < 0)
      return; // off-screen
    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

class GenericObject {
  // scenery – tiles horizontally so the stage can be longer than the image
  constructor({ x, y, image, parallax }) {
    this.position = { x, y };
    this.image = image;
    this.parallax = parallax; // fraction of the scroll speed
  }
  draw() {
    const w = this.image.width;
    if (!w) return;
    let x = this.position.x % w;
    if (x > 0) x -= w;
    for (; x < canvas.width; x += w)
      c.drawImage(this.image, x, this.position.y);
  }
}

class Enemy {
  constructor({ platform: p, type, speed }) {
    const cfg = ENEMY_TYPES[type];
    this.type = type;
    this.width = cfg.w;
    this.height = cfg.h;
    this.damage = cfg.damage;
    this.points = cfg.points;
    this.platform = p;
    this.speed = speed;
    this.margin = p.width > 400 ? 100 : 60; // keeps the platform edges safe to land on
    this.offset = rand(
      this.margin,
      Math.max(this.margin, p.width - this.margin - this.width),
    );
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.angle = 0;
    this.hit = false; // has damaged the player
    this.counted = false; // has been scored as "avoided"
    this.position = { x: 0, y: 0 };
    this.sync();
  }

  sync() {
    // enemies are positioned relative to their platform, so they scroll with it
    this.position.x = this.platform.position.x + this.offset;
    this.position.y = this.platform.position.y - this.height;
  }

  get hitbox() {
    return {
      x: this.position.x + 4,
      y: this.position.y + 4,
      w: this.width - 8,
      h: this.height - 4,
    };
  }

  update() {
    const min = this.margin;
    const max = Math.max(min, this.platform.width - this.margin - this.width);
    this.offset += this.dir * this.speed;
    if (this.offset <= min) {
      this.offset = min;
      this.dir = 1;
    } else if (this.offset >= max) {
      this.offset = max;
      this.dir = -1;
    }
    this.angle += this.dir * 0.12;
    this.sync();
  }

  draw() {
    const { x, y } = this.position;
    const w = this.width;
    const h = this.height;
    if (x > canvas.width || x + w < 0) return;
    c.save();
    if (this.type === "slime") {
      c.fillStyle = "#3ddc84";
      c.beginPath();
      c.ellipse(x + w / 2, y + h, w / 2, h, 0, Math.PI, 0);
      c.fill();
      drawEyes(x + w * 0.32, x + w * 0.68, y + h * 0.45, 6, this.dir);
    } else if (this.type === "spike") {
      c.translate(x + w / 2, y + h / 2);
      c.rotate(this.angle);
      const r = w * 0.36;
      c.fillStyle = "#ff8c1a";
      for (let i = 0; i < 8; i++) {
        c.rotate(Math.PI / 4);
        c.beginPath();
        c.moveTo(-8, -r + 2);
        c.lineTo(0, -w / 2);
        c.lineTo(8, -r + 2);
        c.fill();
      }
      c.fillStyle = "#d9381e";
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
    } else {
      // demon – instant game over
      c.fillStyle = "#3b1556";
      c.fillRect(x, y + 14, w, h - 14);
      c.fillStyle = "#c1121f";
      c.beginPath();
      c.moveTo(x + 4, y + 18);
      c.lineTo(x + 14, y);
      c.lineTo(x + 26, y + 18);
      c.fill();
      c.beginPath();
      c.moveTo(x + w - 4, y + 18);
      c.lineTo(x + w - 14, y);
      c.lineTo(x + w - 26, y + 18);
      c.fill();
      c.fillStyle = "#ff3030";
      c.fillRect(x + 14, y + 34, 10, 8);
      c.fillRect(x + w - 24, y + 34, 10, 8);
    }
    c.restore();
  }
}

class LifePickup {
  constructor({ anchor, dx, dy }) {
    this.anchor = anchor; // platform it is positioned relative to
    this.dx = dx;
    this.dy = dy;
    this.size = 34;
    this.phase = rand(0, Math.PI * 2);
    this.collected = false;
    this.position = { x: 0, y: 0 };
    this.sync();
  }
  sync() {
    this.position.x = this.anchor.position.x + this.dx;
    this.position.y =
      this.anchor.position.y + this.dy + Math.sin(tick / 15 + this.phase) * 6; // gentle bob
  }
  get hitbox() {
    return {
      x: this.position.x - this.size / 2,
      y: this.position.y,
      w: this.size,
      h: this.size,
    };
  }
  draw() {
    if (this.collected) return;
    const { x, y } = this.position;
    if (x < -40 || x > canvas.width + 40) return;
    c.save();
    c.shadowColor = "#ff3b5c";
    c.shadowBlur = 14;
    c.fillStyle = "#ff3b5c";
    heartPath(x, y, this.size);
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = "#fff";
    c.stroke();
    c.restore();
  }
}

/* ------------------------------------------------------------------ */
/* Stage generation – gets harder the further along (d: 0 → 1)         */
/* ------------------------------------------------------------------ */
function spawnEnemies(p, d) {
  const big = p.width > 400;
  const count = big && d > 0.6 && Math.random() < 0.35 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    let type = "slime";
    if (d > 0.2 && Math.random() < 0.3 + d * 0.3) type = "spike";
    if (big && d > 0.5 && Math.random() < (d - 0.4) * 0.7) type = "demon";
    enemies.push(
      new Enemy({
        platform: p,
        type,
        speed: 1.2 + d * 2.8 + Math.random() * 0.8,
      }),
    );
  }
}

function buildStage() {
  platforms = [];
  enemies = [];
  pickups = [];

  const add = (x, level, image) => {
    const p = new Platform({ x, y: levelY(level), image });
    platforms.push(p);
    return p;
  };

  let x = -1;
  let level = 0;
  // safe runway at the start
  for (let i = 0; i < 2; i++) {
    const p = add(x, 0, assets.platform);
    x += p.width - 3;
  }

  let prev = platforms[1];
  while (x < STAGE_LENGTH) {
    const d = x / STAGE_LENGTH;
    const nextLevel =
      Math.random() < 0.55
        ? clamp(level + randInt(-2, 1), 0, MAX_LEVEL)
        : level;
    const maxGap = (130 + d * 260) * (nextLevel > level ? 0.75 : 1); // gaps widen over time
    const gap = rand(60 + d * 50, maxGap);
    const small = Math.random() < 0.1 + d * 0.5; // narrow platforms become more common

    // a heart hovering over the gap – grabbed mid-jump
    if (Math.random() < 0.2) {
      pickups.push(
        new LifePickup({
          anchor: prev,
          dx: x - prev.position.x + gap / 2,
          dy: -200,
        }),
      );
    }

    x += gap;
    const p = add(x, nextLevel, small ? assets.platformSmall : assets.platform);

    if (Math.random() < 0.2 + d * 0.5) spawnEnemies(p, d);
    if (Math.random() < 0.35 - d * 0.15) {
      // low hearts can be walked into, high hearts need a jump
      pickups.push(
        new LifePickup({
          anchor: p,
          dx: p.width / 2 + rand(-60, 60),
          dy: Math.random() < 0.5 ? -110 : -240,
        }),
      );
    }

    level = nextLevel;
    prev = p;
    x += p.width - 3;
  }

  // finish section
  x += 100;
  for (let i = 0; i < 3; i++) {
    const p = add(x, 0, assets.platform);
    x += p.width - 3;
  }
  finishX = x - 400;
  enemyGoal = Math.max(1, Math.floor(enemies.length * ENEMY_GOAL_RATIO));
}

function init() {
  player = new Player();
  genericObjects = [
    new GenericObject({
      x: -1,
      y: -1,
      image: assets.background,
      parallax: 0.2,
    }),
    new GenericObject({ x: -1, y: -1, image: assets.hills, parallax: 0.4 }),
  ];
  scrollOffset = 0;
  bestDistance = 0;
  bonusScore = 0;
  enemiesAvoided = 0;
  lives = START_LIVES;
  tick = 0;
  buildStage();
}

/* ------------------------------------------------------------------ */
/* Modal UI System (Welcome, Pause, Game Over, Stage Complete)         */
/* ------------------------------------------------------------------ */
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalButtons = document.getElementById("modalButtons");

function hideModal() {
  if (modalOverlay) modalOverlay.style.display = "none";
}

function showModal(mode) {
  if (!modalOverlay || !modalTitle || !modalContent || !modalButtons) return;

  if (mode === "title") {
    modalTitle.textContent = "Welcome to SpaceWalker";
    modalContent.innerHTML = `
      <p class="modal-desc">Reach the flag and avoid the cosmic enemies!</p>
      <div class="modal-instructions">
        <div class="instruction-row">
          <span>Move Character</span>
          <div class="instruction-keys"><span class="key-tag">A / D</span> <span style="font-size:0.8rem; color:#666;">or</span> <span class="key-tag">← / →</span></div>
        </div>
        <div class="instruction-row">
          <span>Jump / Double Jump</span>
          <div class="instruction-keys"><span class="key-tag">W</span> <span class="key-tag">↑</span> <span class="key-tag">Space</span> <span style="font-size:0.75rem; color:#64748b;">(2x)</span></div>
        </div>
        <div class="instruction-row">
          <span>Pause Game</span>
          <div class="instruction-keys"><span class="key-tag">P</span> <span class="key-tag">Esc</span></div>
        </div>
        <div class="instruction-row">
          <span>Mute / Sound</span>
          <div class="instruction-keys"><span class="key-tag">M</span></div>
        </div>
        <div class="instruction-row">
          <span>Extra Lives & Score</span>
          <span class="heart-icon">♥ Heart Pickups</span>
        </div>
      </div>
    `;
    modalButtons.innerHTML = `
      <button class="modal-button secondary-button" id="modalSoundBtn">${muted ? "Sound: Off" : "Sound: On"}</button>
      <button class="modal-button primary-button" id="modalPrimaryBtn">Start Game</button>
    `;

    document.getElementById("modalPrimaryBtn")?.addEventListener("click", () => {
      startGame();
    });
    document.getElementById("modalSoundBtn")?.addEventListener("click", () => {
      toggleMute();
    });
  } else if (mode === "paused") {
    modalTitle.textContent = "Game Paused";
    modalContent.innerHTML = `
      <div class="modal-stats">
        <div class="stat-row"><span>SCORE:</span> <span class="stat-val">${getScore()}</span></div>
        <div class="stat-row"><span>ENEMIES AVOIDED:</span> <span class="stat-val">${enemiesAvoided} / ${enemyGoal}</span></div>
        <div class="stat-row"><span>LIVES REMAINING:</span> <span class="stat-val">${lives} / ${MAX_LIVES}</span></div>
      </div>
      <p class="modal-hint">Press <strong>P</strong> or <strong>Esc</strong> to resume, <strong>M</strong> to mute</p>
    `;
    modalButtons.innerHTML = `
      <button class="modal-button secondary-button" id="modalRestartBtn">Restart</button>
      <button class="modal-button primary-button" id="modalPrimaryBtn">Resume</button>
    `;

    document.getElementById("modalPrimaryBtn")?.addEventListener("click", () => {
      resumeGame();
    });
    document.getElementById("modalRestartBtn")?.addEventListener("click", () => {
      restart();
    });
  } else if (mode === "gameover") {
    modalTitle.textContent = "Game Over";
    modalContent.innerHTML = `
      <p style="margin-top: 0; color: #d90429; font-weight: bold; margin-bottom: 0.8rem;">${gameOverReason}</p>
      <div class="modal-stats">
        <div class="stat-row"><span>FINAL SCORE:</span> <span class="stat-val">${getScore()}</span></div>
        <div class="stat-row"><span>ENEMIES AVOIDED:</span> <span class="stat-val">${enemiesAvoided} / ${enemyGoal}</span></div>
        <div class="stat-row"><span>DISTANCE REACHED:</span> <span class="stat-val">${Math.floor(bestDistance)} px</span></div>
      </div>
    `;
    modalButtons.innerHTML = `
      <button class="modal-button primary-button" id="modalPrimaryBtn">Try Again</button>
    `;

    document.getElementById("modalPrimaryBtn")?.addEventListener("click", () => {
      restart();
    });
  } else if (mode === "complete") {
    modalTitle.textContent = "Stage Completed!";
    modalContent.innerHTML = `
      <p class="modal-desc">Congratulations! You reached the flag safely!</p>
      <div class="modal-stats">
        <div class="stat-row"><span>FINAL SCORE:</span> <span class="stat-val">${getScore()}</span></div>
        <div class="stat-row"><span>ENEMIES AVOIDED:</span> <span class="stat-val">${enemiesAvoided} / ${enemies.length}</span></div>
        <div class="stat-row"><span>REMAINING LIVES:</span> <span class="stat-val">${lives}</span></div>
      </div>
      <p class="modal-hint">More stages coming soon...</p>
    `;
    modalButtons.innerHTML = `
      <button class="modal-button primary-button" id="modalPrimaryBtn">Play Again</button>
    `;

    document.getElementById("modalPrimaryBtn")?.addEventListener("click", () => {
      restart();
    });
  }

  modalOverlay.style.display = "block";
}

/* ------------------------------------------------------------------ */
/* Game flow                                                           */
/* ------------------------------------------------------------------ */
function startGame() {
  getAudio(); // unlock audio inside a user gesture
  state = "playing";
  hideModal();
  playMusic();
}
function restart() {
  init();
  startGame();
}
function pauseGame() {
  if (state !== "playing") return;
  state = "paused";
  stopMusic();
  sfx.pause();
  showModal("paused");
}
function resumeGame() {
  if (state !== "paused") return;
  state = "playing";
  hideModal();
  sfx.pause();
  playMusic();
}
function togglePause() {
  if (state === "playing") pauseGame();
  else if (state === "paused") resumeGame();
}
function endGame(reason) {
  state = "gameover";
  gameOverReason = reason;
  stopMusic(true);
  sfx.gameOver();
  showModal("gameover");
}
function completeStage() {
  state = "complete";
  stopMusic(true);
  sfx.win();
  showModal("complete");
}
function onButton() {
  if (state === "title") startGame();
  else if (state === "paused") resumeGame();
  else restart(); // gameover / complete
}

function scrollWorld(amount) {
  scrollOffset += amount;
  platforms.forEach((p) => (p.position.x -= amount));
  genericObjects.forEach((g) => (g.position.x -= amount * g.parallax));
}

function hurt(enemy) {
  if (player.invulnerable > 0) return;
  enemy.hit = true;
  lives = enemy.damage === Infinity ? 0 : lives - enemy.damage;
  sfx.hit();
  if (lives <= 0) {
    lives = 0;
    endGame(
      enemy.damage === Infinity ? "A demon got you!" : "You ran out of lives!",
    );
  } else {
    player.invulnerable = 120; // brief immunity + little hop
    player.velocity.y = -9;
  }
}

function fall() {
  lives--;
  sfx.hit();
  if (lives <= 0) {
    lives = 0;
    endGame("You fell into a pit!");
    return;
  }
  // respawn on the last platform that started behind the player
  let target = platforms[0];
  for (const p of platforms) {
    if (
      p.position.x + p.width / 2 < player.position.x &&
      p.position.x > target.position.x
    )
      target = p;
  }
  scrollWorld(target.position.x + 60 - player.position.x);
  player.position.y = target.position.y - player.height - 5;
  player.velocity.x = 0;
  player.velocity.y = 0;
  player.invulnerable = 150;
  player.jumps = 2;
}

function jump() {
  if (player.coyote > 0) {
    player.velocity.y = -JUMP_SPEED;
    player.coyote = 0;
    player.jumps = 1;
    sfx.jump();
  } else if (player.jumps > 0) {
    player.velocity.y = -JUMP_SPEED;
    player.jumps = 0;
    sfx.doubleJump();
  }
}

function handleInput() {
  let dir = 0;
  if (keys.right.pressed && keys.left.pressed)
    dir = lastKey === "right" ? 1 : -1;
  else if (keys.right.pressed) dir = 1;
  else if (keys.left.pressed) dir = -1;

  player.velocity.x = 0;
  if (dir === 1) {
    if (player.position.x < 400) player.velocity.x = player.speed;
    else scrollWorld(player.speed); // player stays put, world moves
  } else if (dir === -1) {
    if (
      player.position.x > 100 ||
      (scrollOffset <= 0 && player.position.x > 0)
    ) {
      player.velocity.x = -player.speed;
    } else if (scrollOffset > 0) {
      scrollWorld(-player.speed);
    }
  }

  if (dir !== 0) player.setSprite("run", dir === 1 ? "right" : "left");
  else player.setSprite("stand", player.facing);
}

function update() {
  tick++;
  handleInput();
  player.update();
  enemies.forEach((e) => e.update());
  pickups.forEach((p) => p.sync());
  bestDistance = Math.max(bestDistance, scrollOffset + player.position.x - 100);

  const hb = player.hitbox;

  // hearts: +1 life (up to the max) and bonus score
  for (const p of pickups) {
    if (!p.collected && overlap(hb, p.hitbox)) {
      p.collected = true;
      lives = Math.min(MAX_LIVES, lives + 1);
      bonusScore += 100;
      sfx.life();
    }
  }

  // enemies: collision + "avoided" tracking
  for (const e of enemies) {
    if (!e.counted && e.position.x + e.width < player.position.x - 60) {
      e.counted = true;
      if (!e.hit) {
        enemiesAvoided++;
        bonusScore += e.points;
      }
    }
    if (overlap(hb, e.hitbox)) hurt(e);
    if (state !== "playing") return;
  }

  // fell off the bottom of the screen
  if (player.position.y > canvas.height + 80) {
    fall();
    return;
  }

  // stage end: reach the flag having avoided enough enemies
  const worldX = scrollOffset + player.position.x + player.width / 2;
  if (worldX >= finishX) {
    if (enemiesAvoided >= enemyGoal) completeStage();
    else
      endGame(
        `Only ${enemiesAvoided} of the ${enemyGoal} required enemies avoided!`,
      );
  }
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */
function drawFinish() {
  const x = finishX - scrollOffset;
  if (x < -120 || x > canvas.width + 120) return;
  const base = levelY(0);
  c.save();
  c.fillStyle = "#eee";
  c.fillRect(x, base - 220, 8, 220);
  c.fillStyle = "#e63946";
  c.beginPath();
  c.moveTo(x + 8, base - 220);
  c.lineTo(x + 100, base - 190);
  c.lineTo(x + 8, base - 160);
  c.fill();
  c.restore();
}

function drawHUD() {
  const progress = clamp(bestDistance / (finishX - 100), 0, 1);
  const tier = ["Easy", "Medium", "Hard", "Brutal"][
    Math.min(3, Math.floor(progress * 4))
  ];
  const cx = canvas.width / 2;

  c.save();
  c.shadowColor = "rgba(0,0,0,0.7)";
  c.shadowBlur = 4;

  // score + lives (left)
  c.textAlign = "left";
  c.fillStyle = "#fff";
  c.font = "bold 22px 'Wheaton-reg', Arial, sans-serif";
  c.fillText(`Score: ${getScore()}`, 20, 36);
  for (let i = 0; i < MAX_LIVES; i++) {
    heartPath(34 + i * 34, 48, 26);
    if (i < lives) {
      c.fillStyle = "#ff3b5c";
      c.fill();
    } else {
      c.strokeStyle = "#fff";
      c.lineWidth = 2;
      c.stroke();
    }
  }

  // stage progress (centre)
  c.textAlign = "center";
  c.fillStyle = "#fff";
  c.font = "bold 15px 'Wheaton-reg', Arial, sans-serif";
  c.fillText(`Stage 1 · ${tier}`, cx, 24);
  c.fillStyle = "rgba(0,0,0,0.45)";
  c.fillRect(cx - 150, 34, 300, 12);
  c.fillStyle = "#ffd166";
  c.fillRect(cx - 150, 34, 300 * progress, 12);

  // enemies avoided (right)
  c.textAlign = "right";
  c.fillStyle = "#fff";
  c.font = "bold 18px 'Wheaton-reg', Arial, sans-serif";
  c.fillText(
    `Enemies avoided: ${enemiesAvoided}/${enemyGoal}`,
    canvas.width - 20,
    32,
  );
  c.font = "13px 'Wheaton-reg', Arial, sans-serif";
  c.fillStyle = "#97beff";
  c.fillText("P: pause   M: mute", canvas.width - 20, 54);
  c.restore();
}

function drawOverlay() {
  // Modal screens are rendered via HTML/DOM using modal styles
}

function render() {
  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);
  genericObjects.forEach((g) => g.draw());
  platforms.forEach((p) => p.draw());
  drawFinish();
  pickups.forEach((p) => p.draw());
  enemies.forEach((e) => e.draw());
  player.draw();
  drawHUD();
  drawOverlay();
}

/* ------------------------------------------------------------------ */
/* Main loop – fixed 60Hz logic so speed is identical on any monitor   */
/* ------------------------------------------------------------------ */
const STEP = 1000 / 60;
let lastTime = 0;
let acc = 0;

function loop(time) {
  requestAnimationFrame(loop);
  acc += Math.min(time - lastTime, 100);
  lastTime = time;
  while (acc >= STEP) {
    if (state === "playing") update();
    acc -= STEP;
  }
  render();
}

Promise.all(pending).then(() => {
  init();
  showModal("title");
  requestAnimationFrame(loop);
});

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */
addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key))
    e.preventDefault();

  if (key === "m") {
    toggleMute();
    return;
  }
  if (key === "p" || key === "escape") {
    togglePause();
    return;
  }
  if (key === "enter" || (key === " " && state !== "playing")) {
    if (state !== "playing") onButton();
    return;
  }

  switch (key) {
    case "w":
    case "arrowup":
    case " ":
      if (!e.repeat && state === "playing") jump();
      break;
    case "a":
    case "arrowleft":
      keys.left.pressed = true;
      lastKey = "left";
      break;
    case "d":
    case "arrowright":
      keys.right.pressed = true;
      lastKey = "right";
      break;
  }
});

addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "w":
    case "arrowup":
    case " ":
      if (player && player.velocity.y < -5) player.velocity.y *= 0.45; // release early = shorter hop
      break;
    case "a":
    case "arrowleft":
      keys.left.pressed = false;
      break;
    case "d":
    case "arrowright":
      keys.right.pressed = false;
      break;
  }
});

function inButton(e) {
  if (!button) return false;
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;
  return (
    mx >= button.x &&
    mx <= button.x + button.w &&
    my >= button.y &&
    my <= button.y + button.h
  );
}

canvas.addEventListener("mousemove", (e) => {
  buttonHover = inButton(e);
  canvas.style.cursor = buttonHover ? "pointer" : "default";
});
canvas.addEventListener("click", (e) => {
  if (inButton(e)) onButton();
});

// auto-pause if the tab/window loses focus; release held keys
addEventListener("blur", () => {
  keys.left.pressed = false;
  keys.right.pressed = false;
  pauseGame();
});
addEventListener("resize", () => {
  canvas.width = window.innerWidth;
});
