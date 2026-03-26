'use strict';
(function () {

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const T     = 16;       // tile size (pixels)
const SW    = 256;      // screen width
const SH    = 240;      // screen height
const SCALE = 3;        // CSS display scale
const GV    = 0.40;     // gravity per frame
const JV    = -8.2;     // jump velocity (negative = up)
const SPD   = 2.2;      // walk speed px/frame
const LT    = 180;      // level time seconds (3 min)
const HUD_H = 16;       // HUD bar height

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS
// ═══════════════════════════════════════════════════════════════════════════
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
canvas.width  = SW;
canvas.height = SH;
canvas.style.width  = (SW * SCALE) + 'px';
canvas.style.height = (SH * SCALE) + 'px';
ctx.imageSmoothingEnabled = false;

// ═══════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════
const K  = {};   // keys held
const KD = {};   // keys just-pressed this frame

addEventListener('keydown', e => {
  if (!K[e.code]) KD[e.code] = true;
  K[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
    e.preventDefault();
});
addEventListener('keyup', e => { K[e.code] = false; });

function clearJust() { for (const k in KD) delete KD[k]; }

const inp = {
  left:   () => K['ArrowLeft']  || K['KeyA'],
  right:  () => K['ArrowRight'] || K['KeyD'],
  jumpH:  () => K['ArrowUp']    || K['KeyZ'] || K['Space'],
  jumpD:  () => KD['ArrowUp']   || KD['KeyZ'] || KD['Space'],
  startD: () => KD['Enter'],
};

// ═══════════════════════════════════════════════════════════════════════════
// PIXEL DRAW HELPER  (integer coords, no anti-aliasing)
// ═══════════════════════════════════════════════════════════════════════════
function px(color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w || 1, h || 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE: SQUIRREL  (16×16, hitbox 12×14 centred inside)
// dir: 1=right, -1=left   frame: 0=stand 1=walk-a 2=stand 3=walk-b 4=jump
// ═══════════════════════════════════════════════════════════════════════════
function drawSquirrel(x, y, dir, frame) {
  x = x | 0; y = y | 0;
  if (dir < 0) {
    ctx.save();
    ctx.translate(x + 8, y);
    ctx.scale(-1, 1);
    ctx.translate(-8, 0);
    x = 0; y = 0;
  }

  // --- tail (behind body) ---
  px('#b06818', x+1, y+3, 5, 9);
  px('#d09030', x+2, y+2, 5, 9);
  px('#e0a840', x+2, y+2, 3, 4);   // highlight
  px('#d09030', x+1, y+5, 5, 5);

  // --- body ---
  px('#c87428', x+5, y+6,  9, 8);
  px('#f0c878', x+6, y+8,  6, 5);  // belly

  // --- head ---
  px('#c87428', x+7, y+2,  8, 6);
  px('#b06020', x+7, y+2,  8, 1);  // top shadow

  // --- ear ---
  px('#c87428', x+7, y+0,  3, 3);
  px('#d08060', x+8, y+1,  1, 1);  // ear inner pink

  // --- snout / nose ---
  px('#f0c878', x+12, y+5, 3, 2);
  px('#b05020', x+13, y+6, 2, 1);

  // --- eye ---
  px('#000000', x+10, y+4, 2, 2);
  px('#ffffff', x+11, y+4, 1, 1);  // shine

  // --- legs & feet ---
  if (frame === 4) {
    // jumping — legs tucked
    px('#c87428', x+6,  y+13, 3, 2);
    px('#c87428', x+10, y+13, 3, 2);
    px('#8b5010', x+5,  y+14, 4, 1);
    px('#8b5010', x+10, y+14, 4, 1);
  } else {
    const f = frame & 1;
    // back leg
    px('#c87428', x+5,  y+13, 4, f === 0 ? 3 : 2);
    px('#8b5010', x+4,  y+14 + (f === 0 ? 1 : 0), 5, 2);
    // front leg
    px('#c87428', x+10, y+13, 4, f === 1 ? 3 : 2);
    px('#8b5010', x+10, y+14 + (f === 1 ? 1 : 0), 5, 2);
  }

  if (dir < 0) ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE: MOUSE  (16×16)
// blink: true = eyes closed (nibbling animation)
// ═══════════════════════════════════════════════════════════════════════════
function drawMouse(x, y, blink) {
  x = x | 0; y = y | 0;
  const mg = '#909090', lm = '#bcbcbc', ep = '#d08080', er = '#cc2020';

  // ears
  px(mg, x+2,  y+0, 4, 4); px(ep, x+3,  y+1, 2, 2);
  px(mg, x+10, y+0, 4, 4); px(ep, x+11, y+1, 2, 2);

  // head
  px(mg, x+2, y+3, 12, 7);
  px(lm, x+3, y+4, 10, 5);

  // eyes
  if (!blink) {
    px(er, x+4,  y+5, 2, 2); px('#ffffff', x+5,  y+5, 1, 1);
    px(er, x+10, y+5, 2, 2); px('#ffffff', x+11, y+5, 1, 1);
  } else {
    px(mg, x+4,  y+6, 2, 1);
    px(mg, x+10, y+6, 2, 1);
  }

  // nose
  px('#ff8888', x+7, y+7, 2, 2);
  px('#cc4444', x+7, y+8, 2, 1);

  // whiskers
  px('#606060', x+0,  y+7, 2, 1); px('#606060', x+0,  y+8, 1, 1);
  px('#606060', x+14, y+7, 2, 1); px('#606060', x+15, y+8, 1, 1);

  // body
  px(mg, x+3, y+9,  10, 6);
  px(lm, x+4, y+10,  8, 4);

  // tail (curled right)
  px(lm, x+14, y+10, 2, 1);
  px(lm, x+15, y+9,  2, 4);
  px(lm, x+14, y+13, 2, 1);

  // legs
  px(mg, x+4, y+14, 3, 2);
  px(mg, x+9, y+14, 3, 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE: CHEESE  (12×9)
// ═══════════════════════════════════════════════════════════════════════════
function drawCheese(x, y) {
  x = x | 0; y = y | 0;
  px('#f0d820', x,   y,   12, 9);
  px('#f8e840', x+1, y+1, 10, 7);
  // holes
  px('#b89000', x+2, y+2, 3, 3);
  px('#b89000', x+7, y+5, 3, 2);
  px('#b89000', x+3, y+6, 2, 2);
  // shadow edges
  px('#c8a000', x,    y+8, 12, 1);
  px('#c8a000', x+11, y,    1, 8);
}

// ═══════════════════════════════════════════════════════════════════════════
// TILE RENDERERS
// ═══════════════════════════════════════════════════════════════════════════
function drawGroundTile(x, y) {
  // grass strip
  px('#3aaa28', x, y, T, 3);
  px('#2c7c18', x, y, T, 1);
  px('#4ec038', x+2,  y, 1, 4);
  px('#4ec038', x+7,  y, 1, 3);
  px('#4ec038', x+12, y, 1, 4);
  // soil
  px('#7c5018', x, y+3, T, T-3);
  px('#5e3a08', x+3,  y+6,  3, 2);
  px('#5e3a08', x+10, y+10, 2, 2);
  px('#9a6828', x+7,  y+5,  2, 1);
}

function drawSubTile(x, y) {
  px('#6a4010', x, y, T, T);
  px('#583008', x+3,  y+3, 3, 2);
  px('#583008', x+10, y+9, 2, 3);
  px('#7a5020', x+1,  y+11, 2, 2);
}

function drawPlatTile(x, y) {
  // grass cap
  px('#60c040', x, y, T, 4);
  px('#48a030', x, y, T, 2);
  px('#48a030', x+3,  y, 1, 4);
  px('#48a030', x+9,  y, 1, 3);
  px('#48a030', x+14, y, 1, 4);
  // wood body
  px('#c09040', x, y+4, T, T-4);
  px('#a07030', x, y+4, T, 2);
  px('#a07030', x+4,  y+6, 1, 9);
  px('#a07030', x+10, y+6, 1, 8);
  px('#d0a850', x+2,  y+6, 2, 8);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLOUDS  (parallax background decoration)
// ═══════════════════════════════════════════════════════════════════════════
const CLOUDS = [];
for (let i = 0; i < 18; i++) {
  CLOUDS.push({
    x: i * 250 + (i * 37 % 120),
    y: 22 + (i * 17 % 50),
    w: 36 + (i * 13 % 30),
  });
}

function drawClouds(camX, levelPxW) {
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = '#ffffff';
  for (const cl of CLOUDS) {
    let sx = ((cl.x - camX * 0.25) % levelPxW + levelPxW) % levelPxW;
    sx = sx | 0;
    px('#ffffff', sx,    cl.y+4,  cl.w,    8);
    px('#ffffff', sx+4,  cl.y,    cl.w-8,  12);
    px('#ffffff', sx+8,  cl.y-4,  cl.w-16, 8);
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL DATA
// Each row string is exactly LEVEL_W characters.
// Tiles: ' '=air  'G'=ground  'D'=subground  'P'=one-way platform
// ═══════════════════════════════════════════════════════════════════════════
const LEVEL_W = 110;  // tiles wide
function row(s) {
  // pad / truncate to LEVEL_W
  return s.length >= LEVEL_W ? s.slice(0, LEVEL_W)
    : s + ' '.repeat(LEVEL_W - s.length);
}

const LEVEL1 = {
  bg: '#5c94fc',
  rows: [
    row(''),                                                                                            // 0
    row(''),                                                                                            // 1
    row('                                  PPPP                     PPPP                       PPPP'), // 2
    row('           PPPP                                 PPPP                  PPPP'),                  // 3
    row('   PPPP                 PPPP                          PPPP                    PPPP'),          // 4
    row('                PPPP          PPPP        PPPP               PPPP                     PPPP'),  // 5
    row('      PPPP                                        PPPP              PPPP'),                    // 6
    row('            PPPP      PPPP           PPPP                  PPPP            PPPP       PPPP'), // 7
    row('   PPPP                      PPPP          PPPP                                  PPPP'),      // 8
    row('         PPPP     PPPP                              PPPP        PPPP                   PPPP'),// 9
    row('               PPPP     PPPP      PPPP                    PPPP        PPPP'),                 // 10
    row(''),                                                                                            // 11
    row('GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG'), // 12
    row('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'), // 13
    row('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'), // 14
  ],
  playerStart: [2 * T, 12 * T - 14],   // x, y (player top-left when standing on ground)
  mousePos:    [(LEVEL_W - 5) * T, 12 * T - 16],
};

// ═══════════════════════════════════════════════════════════════════════════
// MAP CLASS
// ═══════════════════════════════════════════════════════════════════════════
class TileMap {
  constructor(ld) {
    this.bg    = ld.bg;
    this.rows  = ld.rows;
    this.H     = ld.rows.length;  // 15
    this.W     = LEVEL_W;         // 110
    this.pxW   = this.W * T;
  }

  at(col, row) {
    if (row < 0 || row >= this.H || col < 0 || col >= this.W) return null;
    const c = this.rows[row][col];
    return (c && c !== ' ') ? c : null;
  }

  solid(col, row)  { const c = this.at(col, row); return c === 'G' || c === 'D'; }
  oneway(col, row) { return this.at(col, row) === 'P'; }

  draw(camX) {
    // sky
    ctx.fillStyle = this.bg;
    ctx.fillRect(0, 0, SW, SH);

    drawClouds(camX, this.pxW);

    const c0 = Math.max(0, (camX / T) | 0);
    const c1 = Math.min(this.W - 1, c0 + (SW / T | 0) + 2);

    for (let row = 0; row < this.H; row++) {
      for (let col = c0; col <= c1; col++) {
        const t = this.at(col, row);
        if (!t) continue;
        const sx = (col * T - (camX | 0)) | 0;
        const sy = row * T;
        if      (t === 'G') drawGroundTile(sx, sy);
        else if (t === 'D') drawSubTile(sx, sy);
        else if (t === 'P') drawPlatTile(sx, sy);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CLASS
// Hitbox: w=12, h=14   sprite is 16×16 drawn at offset (-2, -2)
// ═══════════════════════════════════════════════════════════════════════════
class Player {
  constructor(x, y) {
    this.x  = x; this.y  = y;
    this.w  = 12; this.h = 14;
    this.vx = 0;  this.vy = 0;
    this.onGround = false;
    this.dir  = 1;   // 1=right, -1=left
    this.frame = 0;
    this.ftick      = 0;
    this.dead       = false;
    this.jumpBuffer = 0;   // frames: remembered jump press (input buffer)
    this.coyoteTime = 0;   // frames: grace period after walking off edge
  }

  update(map, jumpPressed) {
    if (this.dead) {
      this.vy += GV;
      this.y  += this.vy;
      return;
    }

    // horizontal
    let moveX = 0;
    if (inp.left())  { moveX = -SPD; this.dir = -1; }
    if (inp.right()) { moveX =  SPD; this.dir =  1; }
    this.vx = moveX;

    // --- jump buffer: remember press for up to 10 frames ---
    if (jumpPressed) this.jumpBuffer = 10;
    else if (this.jumpBuffer > 0) this.jumpBuffer--;

    // --- coyote time: allow jump for 6 frames after leaving ground ---
    if (this.onGround) {
      this.coyoteTime = 6;
    } else if (this.coyoteTime > 0) {
      this.coyoteTime--;
    }

    // --- trigger jump when buffer + coyote time both active ---
    if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
      this.vy         = JV;
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
      this.onGround   = false;
    }

    // gravity
    this.vy += GV;
    if (this.vy > 14) this.vy = 14;

    // move + collide
    this.x += this.vx;
    this.x = Math.max(0, this.x);  // left wall
    this._resolveX(map);

    const prevBottom = this.y + this.h;
    this.y += this.vy;
    this.onGround = false;
    this._resolveY(map, prevBottom);

    // fell off bottom
    if (this.y > SH + 80) this.dead = true;

    // animation
    if (this.onGround && moveX !== 0) {
      if (++this.ftick > 7) { this.ftick = 0; this.frame = (this.frame + 1) % 4; }
    } else {
      this.frame = this.onGround ? 0 : 4;
    }
  }

  _resolveX(map) {
    const top   = (this.y / T) | 0;
    const bot   = ((this.y + this.h - 1) / T) | 0;
    const left  = (this.x / T) | 0;
    const right = ((this.x + this.w - 1) / T) | 0;
    for (let row = top; row <= bot; row++) {
      if (this.vx >= 0 && map.solid(right, row)) {
        this.x = right * T - this.w; this.vx = 0; break;
      }
      if (this.vx <= 0 && map.solid(left, row)) {
        this.x = (left + 1) * T;    this.vx = 0; break;
      }
    }
  }

  _resolveY(map, prevBottom) {
    const left  = ((this.x + 1) / T) | 0;
    const right = ((this.x + this.w - 2) / T) | 0;
    const top   = (this.y / T) | 0;
    const bot   = ((this.y + this.h - 1) / T) | 0;

    if (this.vy >= 0) {
      // falling: check solid + one-way platforms
      for (let col = left; col <= right; col++) {
        if (map.solid(col, bot)) {
          this.y = bot * T - this.h;
          this.vy = 0; this.onGround = true; return;
        }
        if (map.oneway(col, bot) && prevBottom <= bot * T) {
          this.y = bot * T - this.h;
          this.vy = 0; this.onGround = true; return;
        }
      }
    } else {
      // rising: only solid blocks
      for (let col = left; col <= right; col++) {
        if (map.solid(col, top)) {
          this.y = (top + 1) * T; this.vy = 0; return;
        }
      }
    }
  }

  draw(camX) {
    const sx = (this.x - (camX | 0) - 2) | 0;
    const sy = (this.y - 2) | 0;
    drawSquirrel(sx, sy, this.dir, this.frame);
  }

  overlaps(ox, oy, ow, oh) {
    return this.x < ox + ow && this.x + this.w > ox &&
           this.y < oy + oh && this.y + this.h > oy;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOUSE ENEMY (the goal)
// ═══════════════════════════════════════════════════════════════════════════
class MouseGoal {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 16; this.h = 16;
    this.frame = 0;
    this.ftick = 0;
  }
  update() {
    if (++this.ftick > 35) { this.ftick = 0; this.frame ^= 1; }
  }
  draw(camX) {
    const sx = (this.x - (camX | 0)) | 0;
    const sy = this.y | 0;
    drawMouse(sx, sy, this.frame === 1);
    drawCheese(sx + 18, sy + 4);

    // off-screen arrow indicator
    if (sx + 20 < 0 || sx > SW) {
      const arrowRight = sx + 20 >= SW;
      const ax = arrowRight ? SW - 14 : 4;
      ctx.fillStyle = '#f8f820';
      ctx.font = '10px monospace';
      ctx.fillText(arrowRight ? '>' : '<', ax, (SH / 2) | 0);
      ctx.fillText(arrowRight ? '>' : '<', ax, ((SH / 2) | 0) + 10);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMERA  (smooth follow, clamped to level bounds)
// ═══════════════════════════════════════════════════════════════════════════
class Camera {
  constructor(mapPxW) {
    this.x    = 0;
    this.maxX = mapPxW - SW;
  }
  follow(player) {
    const target = player.x - SW / 3;
    this.x += (target - this.x) * 0.14;
    if (this.x < 0) this.x = 0;
    if (this.x > this.maxX) this.x = this.maxX;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════════════════════════
function drawHUD(timeLeft) {
  // black bar
  px('#000010', 0, 0, SW, HUD_H);
  px('#111128', 0, HUD_H - 1, SW, 1);

  // timer
  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  const timeStr = 'TIME ' + mins + ':' + String(secs).padStart(2, '0');
  ctx.font = '8px monospace';
  ctx.fillStyle = timeLeft < 30 ? '#f83800' : timeLeft < 60 ? '#f8b800' : '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(timeStr, 4, 11);

  // level
  ctx.fillStyle = '#f8f860';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL 1', SW / 2, 11);

  // objective
  ctx.fillStyle = '#80e880';
  ctx.textAlign = 'right';
  ctx.fillText('FIND THE MOUSE!', SW - 4, 11);

  ctx.textAlign = 'left';
}

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAY SCREENS
// ═══════════════════════════════════════════════════════════════════════════
function drawOverlay(title, sub, titleColor) {
  ctx.fillStyle = 'rgba(0,0,16,0.72)';
  ctx.fillRect(0, 75, SW, 90);
  ctx.font = '16px monospace';
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'center';
  ctx.fillText(title, SW / 2, 112);
  ctx.font = '8px monospace';
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText(sub, SW / 2, 132);
  ctx.textAlign = 'left';
}

function drawTitleScreen(t) {
  ctx.fillStyle = LEVEL1.bg;
  ctx.fillRect(0, 0, SW, SH);
  drawClouds(t * 12, LEVEL_W * T);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#f8f800';
  ctx.textAlign = 'center';
  ctx.fillText('松鼠大作战', SW / 2, 72);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#ffffc0';
  ctx.fillText('SQUIRREL QUEST', SW / 2, 88);

  ctx.font = '8px monospace';
  ctx.fillStyle = '#c0ffc0';
  ctx.fillText('找到偷吃奶酪的老鼠!', SW / 2, 114);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('每关限时 3 分钟', SW / 2, 128);

  const blink = (t * 2 | 0) % 2 === 0;
  ctx.fillStyle = blink ? '#ffffff' : '#808080';
  ctx.fillText('按 ENTER 开始', SW / 2, 156);

  // preview sprites
  ctx.textAlign = 'left';
  drawSquirrel(68, 186, 1, (t * 4 | 0) % 4);
  drawMouse(148, 186, (t * 1.4 | 0) % 2 === 1);
  drawCheese(168, 190);
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════
let state  = 'title';   // 'title' | 'play' | 'win' | 'lose'
let map, player, mouse, cam;
let timeLeft, timeAcc, titleT;

function initGame() {
  map      = new TileMap(LEVEL1);
  player   = new Player(...LEVEL1.playerStart);
  mouse    = new MouseGoal(...LEVEL1.mousePos);
  cam      = new Camera(map.pxW);
  timeLeft = LT;
  timeAcc  = 0;
  cam.x    = 0;
}

function update(dt) {
  switch (state) {
    case 'title':
      titleT += dt;
      if (inp.startD()) { initGame(); state = 'play'; }
      break;

    case 'play':
      timeAcc += dt;
      if (timeAcc >= 1) { timeAcc -= 1; timeLeft = Math.max(0, timeLeft - 1); }

      player.update(map, inp.jumpD());
      mouse.update();
      cam.follow(player);

      if (player.overlaps(mouse.x, mouse.y, mouse.w, mouse.h)) {
        state = 'win';
      } else if (timeLeft <= 0 || player.dead) {
        state = 'lose';
      }
      break;

    case 'win':
    case 'lose':
      if (inp.startD()) { state = 'title'; titleT = 0; }
      break;
  }

  clearJust();
}

function draw() {
  switch (state) {
    case 'title':
      drawTitleScreen(titleT);
      break;

    case 'play':
      map.draw(cam.x);
      mouse.draw(cam.x);
      player.draw(cam.x);
      drawHUD(timeLeft);
      break;

    case 'win':
      map.draw(cam.x);
      mouse.draw(cam.x);
      player.draw(cam.x);
      drawHUD(timeLeft);
      drawOverlay('YOU WIN!', '奶酪被夺回了!  ENTER 继续', '#f8e020');
      break;

    case 'lose':
      map.draw(cam.x);
      mouse.draw(cam.x);
      player.draw(cam.x);
      drawHUD(timeLeft);
      const reason = timeLeft <= 0 ? '时间到!  老鼠跑掉了!' : '松鼠掉下去了!';
      drawOverlay('GAME OVER', reason + '  ENTER 重试', '#f83800');
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════
let lastTs = 0;
titleT = 0;

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(ts => { lastTs = ts; requestAnimationFrame(loop); });

})();
