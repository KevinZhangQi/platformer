'use strict';
(function () {

const T=16,SW=256,SH=240,SCALE=3,GV=0.40,JV=-8.2,SPD=2.2,LT=180,HUD_H=16,LEVEL_W=110;

// ── 离屏Canvas（游戏渲染到OC，再1:1缩放到display canvas）──────────────────
const display = document.getElementById('game');
display.width  = SW * SCALE;
display.height = SH * SCALE;
display.style.width  = '';
display.style.height = '';
const dctx = display.getContext('2d');
dctx.imageSmoothingEnabled = false;

const OC  = document.createElement('canvas');
OC.width  = SW; OC.height = SH;
const ctx = OC.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ── 输入 ──────────────────────────────────────────────────────────────────
const K={}, KD={};
addEventListener('keydown', e=>{
  if(!K[e.code]) KD[e.code]=true;
  K[e.code]=true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
addEventListener('keyup', e=>{ K[e.code]=false; });
function clearJust(){ for(const k in KD) delete KD[k]; }
const inp={
  left:  ()=>K.ArrowLeft ||K.KeyA,
  right: ()=>K.ArrowRight||K.KeyD,
  jumpH: ()=>K.ArrowUp   ||K.KeyZ||K.Space,
  startD:()=>KD.Enter,
};

// ── 像素绘制 ──────────────────────────────────────────────────────────────
function px(c,x,y,w,h){ ctx.fillStyle=c; ctx.fillRect(x|0,y|0,w||1,h||1); }

// ── 6只猫的调色板 ─────────────────────────────────────────────────────────
const CAT_PALS=[
  {name:'橘 猫', bd:'#e07828', bl:'#f8d090', ey:'#508828', er:'#d06028', sk:'#c05010'},
  {name:'黑 猫', bd:'#202020', bl:'#484040', ey:'#20c858', er:'#500828', sk:'#181818'},
  {name:'白 猫', bd:'#f0f0f8', bl:'#ffffff', ey:'#60b0f8', er:'#ffc8d8', sk:'#d8d8e8'},
  {name:'花 猫', bd:'#c8c0b8', bl:'#f0eee8', ey:'#d08820', er:'#ffb0a0', sk:'#302010'},
  {name:'蓝 猫', bd:'#7090b8', bl:'#a8c0d8', ey:'#d8a820', er:'#5878a8', sk:'#506888'},
  {name:'棕 猫', bd:'#804020', bl:'#d09060', ey:'#40b888', er:'#603010', sk:'#502808'},
];

// ── 猫咪精灵（16×16，hitbox 12×14）────────────────────────────────────────
function drawCat(x,y,dir,frame,pal){
  x=x|0; y=y|0;
  if(dir<0){ ctx.save(); ctx.translate(x+8,y); ctx.scale(-1,1); ctx.translate(-8,0); x=0;y=0; }
  const {bd,bl,ey,er,sk}=pal;
  // 尾巴（左侧，身后）
  px(bd,x+0,y+5,2,6); px(bd,x+1,y+4,2,7); px(bd,x+0,y+10,3,2);
  // 身体
  px(bd,x+3,y+7,10,5);
  px(bl,x+5,y+8,6,3);   // 肚皮
  // 头
  px(bd,x+5,y+2,9,6);
  px(sk,x+5,y+2,9,1);   // 头顶暗色
  // 耳朵
  px(bd,x+6,y+0,3,3); px(er,x+7,y+1,1,1);
  px(bd,x+11,y+0,3,3); px(er,x+12,y+1,1,1);
  // 眼睛
  px(ey,x+7,y+3,2,2);  px('#fff',x+7,y+3,1,1);  px('#000',x+8,y+4,1,1);
  px(ey,x+11,y+3,2,2); px('#fff',x+11,y+3,1,1); px('#000',x+12,y+4,1,1);
  // 鼻子 & 胡须
  px('#ffaaaa',x+10,y+6,2,1); px('#cc5555',x+10,y+6,1,1);
  px('#b0b0b0',x+3,y+5,2,1); px('#b0b0b0',x+3,y+6,2,1);
  // 腿
  const f=frame&1;
  if(frame===4){
    px(bd,x+4,y+11,3,2); px(bd,x+9,y+11,3,2);
  } else {
    px(bd,x+4,y+11,3,f===0?3:2); px(bl,x+3,y+12+(f===0?1:0),4,2);
    px(bd,x+9,y+11,3,f===1?3:2); px(bl,x+9,y+12+(f===1?1:0),4,2);
  }
  if(dir<0) ctx.restore();
}

// ── 老鼠精灵 ──────────────────────────────────────────────────────────────
function drawMouse(x,y,blink){
  x=x|0;y=y|0;
  const mg='#909090',lm='#bcbcbc',ep='#d08080',er='#cc2020';
  px(mg,x+2,y+0,4,4); px(ep,x+3,y+1,2,2);
  px(mg,x+10,y+0,4,4); px(ep,x+11,y+1,2,2);
  px(mg,x+2,y+3,12,7); px(lm,x+3,y+4,10,5);
  if(!blink){
    px(er,x+4,y+5,2,2); px('#fff',x+5,y+5,1,1);
    px(er,x+10,y+5,2,2); px('#fff',x+11,y+5,1,1);
  } else {
    px(mg,x+4,y+6,2,1); px(mg,x+10,y+6,2,1);
  }
  px('#ff8888',x+7,y+7,2,2); px('#cc4444',x+7,y+8,2,1);
  px('#606060',x+0,y+7,2,1); px('#606060',x+14,y+7,2,1);
  px(mg,x+3,y+9,10,6); px(lm,x+4,y+10,8,4);
  px(lm,x+14,y+10,2,1); px(lm,x+15,y+9,2,4); px(lm,x+14,y+13,2,1);
  px(mg,x+4,y+14,3,2); px(mg,x+9,y+14,3,2);
}

function drawCheese(x,y){
  x=x|0;y=y|0;
  px('#f0d820',x,y,12,9); px('#f8e840',x+1,y+1,10,7);
  px('#b89000',x+2,y+2,3,3); px('#b89000',x+7,y+5,3,2); px('#b89000',x+3,y+6,2,2);
  px('#c8a000',x,y+8,12,1); px('#c8a000',x+11,y,1,8);
}

// ── 瓦片渲染 ──────────────────────────────────────────────────────────────
function drawGroundTile(x,y){
  px('#3aaa28',x,y,T,3); px('#2c7c18',x,y,T,1);
  px('#4ec038',x+2,y,1,4); px('#4ec038',x+7,y,1,3); px('#4ec038',x+12,y,1,4);
  px('#7c5018',x,y+3,T,T-3);
  px('#5e3a08',x+3,y+6,3,2); px('#5e3a08',x+10,y+10,2,2); px('#9a6828',x+7,y+5,2,1);
}
function drawSubTile(x,y){
  px('#6a4010',x,y,T,T);
  px('#583008',x+3,y+3,3,2); px('#583008',x+10,y+9,2,3); px('#7a5020',x+1,y+11,2,2);
}
function drawPlatTile(x,y){
  px('#60c040',x,y,T,4); px('#48a030',x,y,T,2);
  px('#48a030',x+3,y,1,4); px('#48a030',x+9,y,1,3); px('#48a030',x+14,y,1,4);
  px('#c09040',x,y+4,T,T-4); px('#a07030',x,y+4,T,2);
  px('#a07030',x+4,y+6,1,9); px('#a07030',x+10,y+6,1,8); px('#d0a850',x+2,y+6,2,8);
}

// ── 云朵 ──────────────────────────────────────────────────────────────────
const CLOUDS=[];
for(let i=0;i<18;i++) CLOUDS.push({x:i*250+(i*37%120), y:22+(i*17%50), w:36+(i*13%30)});
function drawClouds(camX,lpxW){
  ctx.save(); ctx.globalAlpha=0.82;
  for(const cl of CLOUDS){
    const sx=((cl.x-camX*0.25)%lpxW+lpxW)%lpxW|0;
    px('#ffffff',sx,cl.y+4,cl.w,8); px('#ffffff',sx+4,cl.y,cl.w-8,12); px('#ffffff',sx+8,cl.y-4,cl.w-16,8);
  }
  ctx.restore();
}

// ── 关卡数据 ──────────────────────────────────────────────────────────────
// 跳跃高度≈84px≈5格，所以平台放在第7-11行（第12行是地面）
function makePRow(cols){
  const a=new Array(LEVEL_W).fill(' ');
  for(const c of cols) for(let i=0;i<4;i++) if(c+i<LEVEL_W) a[c+i]='P';
  return a.join('');
}
function makeGRow(ch){ return ch.repeat(LEVEL_W); }

const LEVEL1={
  bg:'#5c94fc',
  rows:[
    makeGRow(' '),                                // 0
    makeGRow(' '),                                // 1
    makeGRow(' '),                                // 2
    makeGRow(' '),                                // 3
    makeGRow(' '),                                // 4
    makeGRow(' '),                                // 5
    makeGRow(' '),                                // 6
    makePRow([62,88]),                            // 7  最高平台
    makePRow([28,46,65,83,99]),                   // 8  高平台
    makePRow([14,33,52,70,85]),                   // 9  中高平台
    makePRow([8,22,40,58,75,92]),                 // 10 中平台
    makePRow([5,17,34,50,67,82,97]),              // 11 低平台（地面上一格）
    makeGRow('G'),                                // 12 地面
    makeGRow('D'),                                // 13
    makeGRow('D'),                                // 14
  ],
  playerStart:[2*T, 12*T-14],
  mousePos:[(LEVEL_W-5)*T, 12*T-16],
};

// ── 地图类 ────────────────────────────────────────────────────────────────
class TileMap{
  constructor(ld){
    this.bg=ld.bg; this.rows=ld.rows; this.H=ld.rows.length; this.W=LEVEL_W; this.pxW=this.W*T;
  }
  at(col,row){
    if(row<0||row>=this.H||col<0||col>=this.W) return null;
    const c=this.rows[row][col]; return(c&&c!==' ')?c:null;
  }
  solid(col,row){ const c=this.at(col,row); return c==='G'||c==='D'; }
  oneway(col,row){ return this.at(col,row)==='P'; }
  draw(camX){
    ctx.fillStyle=this.bg; ctx.fillRect(0,0,SW,SH);
    drawClouds(camX,this.pxW);
    const c0=Math.max(0,(camX/T)|0), c1=Math.min(this.W-1,c0+(SW/T|0)+2);
    for(let row=0;row<this.H;row++) for(let col=c0;col<=c1;col++){
      const t=this.at(col,row); if(!t) continue;
      const sx=(col*T-(camX|0))|0, sy=row*T;
      if(t==='G') drawGroundTile(sx,sy);
      else if(t==='D') drawSubTile(sx,sy);
      else if(t==='P') drawPlatTile(sx,sy);
    }
  }
}

// ── 玩家类 ────────────────────────────────────────────────────────────────
class Player{
  constructor(x,y,pal){
    this.x=x; this.y=y; this.w=12; this.h=14;
    this.vx=0; this.vy=0; this.onGround=false;
    this.dir=1; this.frame=0; this.ftick=0; this.dead=false;
    this.jumpBuffer=0; this.coyoteTime=0; this.jumpHeld=false;
    this.pal=pal;
  }
  update(map){
    if(this.dead){ this.vy+=GV; this.y+=this.vy; return; }
    let moveX=0;
    if(inp.left()){ moveX=-SPD; this.dir=-1; }
    if(inp.right()){ moveX=SPD; this.dir=1; }
    this.vx=moveX;
    const jumpNow=inp.jumpH(), jumpJust=jumpNow&&!this.jumpHeld;
    this.jumpHeld=jumpNow;
    if(jumpJust) this.jumpBuffer=10; else if(this.jumpBuffer>0) this.jumpBuffer--;
    if(this.onGround) this.coyoteTime=6; else if(this.coyoteTime>0) this.coyoteTime--;
    if(this.jumpBuffer>0&&this.coyoteTime>0){
      this.vy=JV; this.jumpBuffer=0; this.coyoteTime=0; this.onGround=false;
    }
    this.vy+=GV; if(this.vy>14) this.vy=14;
    this.x+=this.vx; this.x=Math.max(0,this.x); this._resolveX(map);
    const prevBottom=this.y+this.h;
    this.y+=this.vy; this.onGround=false; this._resolveY(map,prevBottom);
    if(this.y>SH+80) this.dead=true;
    if(this.onGround&&moveX!==0){
      if(++this.ftick>7){ this.ftick=0; this.frame=(this.frame+1)%4; }
    } else { this.frame=this.onGround?0:4; }
  }
  _resolveX(map){
    const top=(this.y/T)|0, bot=((this.y+this.h-1)/T)|0;
    const left=(this.x/T)|0, right=((this.x+this.w-1)/T)|0;
    for(let row=top;row<=bot;row++){
      if(this.vx>=0&&map.solid(right,row)){ this.x=right*T-this.w; this.vx=0; break; }
      if(this.vx<=0&&map.solid(left,row)){ this.x=(left+1)*T; this.vx=0; break; }
    }
  }
  _resolveY(map,prevBottom){
    const left=((this.x+1)/T)|0, right=((this.x+this.w-2)/T)|0;
    const top=(this.y/T)|0, bot=((this.y+this.h-1)/T)|0;
    if(this.vy>=0){
      for(let col=left;col<=right;col++){
        if(map.solid(col,bot)){ this.y=bot*T-this.h; this.vy=0; this.onGround=true; return; }
        if(map.oneway(col,bot)&&prevBottom<=bot*T){ this.y=bot*T-this.h; this.vy=0; this.onGround=true; return; }
      }
    } else {
      for(let col=left;col<=right;col++){
        if(map.solid(col,top)){ this.y=(top+1)*T; this.vy=0; return; }
      }
    }
  }
  draw(camX){
    drawCat((this.x-(camX|0)-2)|0,(this.y-2)|0,this.dir,this.frame,this.pal);
  }
  overlaps(ox,oy,ow,oh){
    return this.x<ox+ow&&this.x+this.w>ox&&this.y<oy+oh&&this.y+this.h>oy;
  }
}

// ── 老鼠目标 ──────────────────────────────────────────────────────────────
class MouseGoal{
  constructor(x,y){ this.x=x;this.y=y;this.w=16;this.h=16;this.frame=0;this.ftick=0; }
  update(){ if(++this.ftick>35){ this.ftick=0; this.frame^=1; } }
  draw(camX){
    const sx=(this.x-(camX|0))|0, sy=this.y|0;
    drawMouse(sx,sy,this.frame===1); drawCheese(sx+18,sy+4);
    if(sx+20<0||sx>SW){
      const right=sx+20>=SW;
      ctx.fillStyle='#f8f820'; ctx.font='10px monospace';
      ctx.fillText(right?'>':'<', right?SW-14:4, (SH/2)|0);
      ctx.fillText(right?'>':'<', right?SW-14:4, ((SH/2)|0)+10);
    }
  }
}

// ── 摄像机 ────────────────────────────────────────────────────────────────
class Camera{
  constructor(pxW){ this.x=0; this.maxX=pxW-SW; }
  follow(p){ this.x+=(p.x-SW/3-this.x)*0.14; this.x=Math.max(0,Math.min(this.x,this.maxX)); }
}

// ── HUD ───────────────────────────────────────────────────────────────────
function drawHUD(t,pal){
  px('#000010',0,0,SW,HUD_H); px('#111128',0,HUD_H-1,SW,1);
  // 小猫图标
  ctx.save(); ctx.translate(2,1); ctx.scale(0.7,0.7); drawCat(0,0,1,0,pal); ctx.restore();
  const mins=Math.floor(t/60), secs=Math.floor(t%60);
  ctx.font='8px monospace';
  ctx.fillStyle=t<30?'#f83800':t<60?'#f8b800':'#ffffff';
  ctx.textAlign='left'; ctx.fillText('TIME '+mins+':'+(secs<10?'0':'')+secs,14,11);
  ctx.fillStyle='#f8f860'; ctx.textAlign='center'; ctx.fillText('LEVEL 1',SW/2,11);
  ctx.fillStyle='#80e880'; ctx.textAlign='right'; ctx.fillText('找到老鼠!',SW-4,11);
  ctx.textAlign='left';
}

// ── 选角界面 ──────────────────────────────────────────────────────────────
function drawSelectScreen(sel,t){
  ctx.fillStyle='#3060c0'; ctx.fillRect(0,0,SW,SH);
  drawClouds(t*8, LEVEL_W*T);
  ctx.font='10px monospace'; ctx.fillStyle='#f8f820'; ctx.textAlign='center';
  ctx.fillText('选择你的猫咪',SW/2,16);
  const cW=82,cH=88, gx=5,gy=26;
  for(let i=0;i<6;i++){
    const col=i%3, row=Math.floor(i/3);
    const cx=gx+col*cW, cy=gy+row*cH;
    const pal=CAT_PALS[i], selected=i===sel;
    // 边框
    px(selected?'#f8f820':'#1840a0',cx,cy,cW,cH);
    px(selected?'#2050d0':'#142880',cx+2,cy+2,cW-4,cH-4);
    // 猫咪（2x放大）
    ctx.save();
    ctx.translate(cx+cW/2-16, cy+14);
    ctx.scale(2,2);
    drawCat(0,0,1,(t*3|0)%4,pal);
    ctx.restore();
    // 名字
    ctx.font='7px monospace';
    ctx.fillStyle=selected?'#f8f820':'#a0c0f0';
    ctx.textAlign='center';
    ctx.fillText(pal.name, cx+cW/2, cy+cH-6);
  }
  ctx.font='7px monospace'; ctx.fillStyle='#80c0ff'; ctx.textAlign='center';
  ctx.fillText('← → ↑ ↓ 切换    ENTER 确认', SW/2, SH-6);
  ctx.textAlign='left';
}

// ── 标题界面 ──────────────────────────────────────────────────────────────
function drawTitleScreen(t){
  ctx.fillStyle=LEVEL1.bg; ctx.fillRect(0,0,SW,SH);
  drawClouds(t*12, LEVEL_W*T);
  ctx.font='18px monospace'; ctx.fillStyle='#f8f800'; ctx.textAlign='center';
  ctx.fillText('猫咪大作战',SW/2,70);
  ctx.font='9px monospace'; ctx.fillStyle='#ffffc0';
  ctx.fillText('CAT QUEST',SW/2,86);
  ctx.font='8px monospace'; ctx.fillStyle='#c0ffc0';
  ctx.fillText('找到偷吃奶酪的老鼠!',SW/2,112);
  ctx.fillStyle='#ffffff'; ctx.fillText('每关限时 3 分钟',SW/2,126);
  ctx.fillStyle=(t*2|0)%2===0?'#ffffff':'#606060';
  ctx.fillText('按 ENTER 开始',SW/2,154);
  ctx.textAlign='left';
  // 展示3只猫
  for(let i=0;i<3;i++){
    ctx.save(); ctx.translate(50+i*60, 172); ctx.scale(2,2);
    drawCat(0,0,1,(t*3+i|0)%4,CAT_PALS[i]);
    ctx.restore();
  }
  drawMouse(185,178,(t*1.4|0)%2===1); drawCheese(204,182);
}

// ── 遮罩弹窗 ──────────────────────────────────────────────────────────────
function drawOverlay(title,sub,col){
  ctx.fillStyle='rgba(0,0,16,0.75)'; ctx.fillRect(0,72,SW,96);
  ctx.font='16px monospace'; ctx.fillStyle=col; ctx.textAlign='center';
  ctx.fillText(title,SW/2,110);
  ctx.font='8px monospace'; ctx.fillStyle='#e0e0e0';
  ctx.fillText(sub,SW/2,130);
  ctx.textAlign='left';
}

// ── 游戏状态 ──────────────────────────────────────────────────────────────
let state='title', map, player, mouse, cam;
let timeLeft, timeAcc, titleT=0, selCat=0;

function initGame(catIdx){
  map=new TileMap(LEVEL1);
  player=new Player(...LEVEL1.playerStart, CAT_PALS[catIdx]);
  mouse=new MouseGoal(...LEVEL1.mousePos);
  cam=new Camera(map.pxW);
  timeLeft=LT; timeAcc=0; cam.x=0;
}

function update(dt){
  switch(state){
    case 'title':
      titleT+=dt;
      if(inp.startD()){ state='select'; }
      break;
    case 'select':
      titleT+=dt;
      if(KD.ArrowLeft ||KD.KeyA) selCat=(selCat+5)%6;
      if(KD.ArrowRight||KD.KeyD) selCat=(selCat+1)%6;
      if(KD.ArrowUp)              selCat=(selCat+3)%6;
      if(KD.ArrowDown)            selCat=(selCat+3)%6;
      if(inp.startD()){ initGame(selCat); state='play'; }
      break;
    case 'play':
      timeAcc+=dt;
      if(timeAcc>=1){ timeAcc-=1; timeLeft=Math.max(0,timeLeft-1); }
      player.update(map); mouse.update(); cam.follow(player);
      if(player.overlaps(mouse.x,mouse.y,mouse.w,mouse.h)) state='win';
      else if(timeLeft<=0||player.dead) state='lose';
      break;
    case 'win':
    case 'lose':
      if(inp.startD()){ state='title'; titleT=0; }
      break;
  }
  clearJust();
}

function draw(){
  switch(state){
    case 'title': drawTitleScreen(titleT); break;
    case 'select': drawSelectScreen(selCat,titleT); break;
    case 'play':
      map.draw(cam.x); mouse.draw(cam.x); player.draw(cam.x);
      drawHUD(timeLeft,player.pal); break;
    case 'win':
      map.draw(cam.x); mouse.draw(cam.x); player.draw(cam.x);
      drawHUD(timeLeft,player.pal);
      drawOverlay('YOU WIN!','奶酪夺回来了!  ENTER继续','#f8e020'); break;
    case 'lose':
      map.draw(cam.x); mouse.draw(cam.x); player.draw(cam.x);
      drawHUD(timeLeft,player.pal);
      drawOverlay('GAME OVER',(timeLeft<=0?'时间到! 老鼠跑了!':'猫咪掉下去了!')+'  ENTER重试','#f83800'); break;
  }
  // 离屏canvas → 显示canvas（像素完美缩放）
  dctx.drawImage(OC,0,0,SW*SCALE,SH*SCALE);
}

// ── 主循环 ────────────────────────────────────────────────────────────────
let lastTs=0;
function loop(ts){
  const dt=Math.min((ts-lastTs)/1000,0.05); lastTs=ts;
  update(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(ts=>{ lastTs=ts; requestAnimationFrame(loop); });

})();
