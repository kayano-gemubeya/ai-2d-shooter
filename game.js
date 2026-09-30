const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const startScreen=document.getElementById('startScreen');
const resultScreen=document.getElementById('resultScreen');
const hud=document.getElementById('hud');
const resultTitle=document.getElementById('resultTitle');
const resultText=document.getElementById('resultText');
const playerHp=document.getElementById('playerHp');
const enemyHp=document.getElementById('enemyHp');
const playerHpText=document.getElementById('playerHpText');
const enemyHpText=document.getElementById('enemyHpText');

let W=1280,H=720,scale=1,gameRunning=false,last=0,shots=[],particles=[],audioCtx=null;
const keys={left:false,right:false,jump:false,shoot:false};
const gravity=1800;

const level={
  ground:620,
  platforms:[
    {x:.10,y:500,w:.18,h:22},{x:.38,y:470,w:.22,h:22},{x:.70,y:520,w:.20,h:22},
    {x:.27,y:570,w:.10,h:50},{x:.57,y:555,w:.09,h:65}
  ]
};
let obstacles=[];

function resize(){W=window.innerWidth;H=window.innerHeight;canvas.width=W*devicePixelRatio;canvas.height=H*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);scale=W/1280;}
window.addEventListener('resize',resize); resize();
function sx(v){return v*scale} function sy(v){return v*(H/720)}

function makeFighter(x,color,face){return {x,y:level.ground-58,vx:0,vy:0,w:34,h:58,color,face,onGround:false,hp:10,cool:0,hitFlash:0,aiTimer:0,jumpLock:false};}
let player,ai;
function reset(){
  obstacles=level.platforms.map(p=>({x:p.x*1280,y:p.y,w:p.w*1280,h:p.h}));
  player=makeFighter(190,'#55aaff',1); ai=makeFighter(1050,'#ff6174',-1);
  shots=[];particles=[];
}

function start(){
  reset(); startScreen.classList.add('hidden'); resultScreen.classList.add('hidden'); hud.classList.remove('hidden'); gameRunning=true; last=performance.now(); soundInit(); requestAnimationFrame(loop);
}
document.getElementById('startBtn').onclick=start; document.getElementById('restartBtn').onclick=start;

function soundInit(){if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended')audioCtx.resume();}
function beep(freq,dur,type='square',gain=.045){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}
function shootSound(){beep(170,.06,'sawtooth',.035);setTimeout(()=>beep(80,.04,'square',.02),15)}
function hitSound(){beep(90,.08,'square',.05)}
function jumpSound(){beep(390,.06,'triangle',.025)}

function bindKey(e,down){
  const k=e.key.toLowerCase();
  if(k==='a'||k==='arrowleft')keys.left=down;
  if(k==='d'||k==='arrowright')keys.right=down;
  if(k==='w'||k==='arrowup'||k===' ')keys.jump=down;
  if(k==='f')keys.shoot=down;
  if(['arrowleft','arrowright','arrowup',' '].includes(k))e.preventDefault();
}
window.addEventListener('keydown',e=>bindKey(e,true)); window.addEventListener('keyup',e=>bindKey(e,false));
canvas.addEventListener('pointerdown',()=>{keys.shoot=true;soundInit()}); window.addEventListener('pointerup',()=>keys.shoot=false);
document.querySelectorAll('[data-key]').forEach(btn=>{const k=btn.dataset.key;btn.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;soundInit()});btn.addEventListener('pointerup',e=>{e.preventDefault();keys[k]=false});btn.addEventListener('pointercancel',()=>keys[k]=false);btn.addEventListener('pointerleave',()=>keys[k]=false)});

function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function solidAtBottom(f,oldY){
  const bottom=f.y+f.h; if(bottom>=level.ground&&oldY+f.h<=level.ground+2){f.y=level.ground-f.h;f.vy=0;f.onGround=true;return true}
  for(const p of obstacles){if(f.x+f.w>p.x&&f.x<p.x+p.w&&bottom>=p.y&&oldY+f.h<=p.y+3){f.y=p.y-f.h;f.vy=0;f.onGround=true;return true}}
  f.onGround=false;return false;
}
function moveFighter(f,dt,dir,jump){
  const oldY=f.y; f.vx=dir*330; f.x+=f.vx*dt; f.x=Math.max(20,Math.min(1260-f.w,f.x));
  if(jump&&f.onGround&&!f.jumpLock){f.vy=-650;f.onGround=false;f.jumpLock=true;jumpSound()}
  if(!jump)f.jumpLock=false;
  f.vy+=gravity*dt; f.y+=f.vy*dt; solidAtBottom(f,oldY);
  if(f.hitFlash>0)f.hitFlash-=dt; if(f.cool>0)f.cool-=dt;
}
function lineOfSight(a,b){return true}
function aiThink(dt){
  const dx=(player.x+player.w/2)-(ai.x+ai.w/2); let dir=Math.sign(dx); const dist=Math.abs(dx);
  let jump=false;
  if(ai.onGround && ((dist<230&&Math.random()<.035)||(player.y<ai.y-80&&Math.random()<.06)))jump=true;
  // Avoid some predictable center crowding.
  if(dist<120)dir=-Math.sign(dx);
  if(dist>500)dir=Math.sign(dx);
  if(dist>220 && dist<620 && ai.cool<=0){fire(ai,Math.sign(dx));}
  else if(dist<=620 && ai.cool<=0 && Math.random()<dt*1.8)fire(ai,Math.sign(dx));
  moveFighter(ai,dt,dir,jump);
}
function fire(f,dir){if(f.cool>0)return; f.cool=.42; shots.push({x:f.x+(dir>0?f.w+3:-3),y:f.y+23,vx:dir*850,owner:f,r:5,life:1.6});shootSound();}
function damage(target){target.hp--;target.hitFlash=.12;hitSound();for(let i=0;i<8;i++)particles.push({x:target.x+target.w/2,y:target.y+20,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*180,life:.35});}

function update(dt){
  const dir=(keys.right?1:0)-(keys.left?1:0);
  moveFighter(player,dt,dir,keys.jump);
  if(keys.shoot)fire(player,player.x<ai.x?1:-1);
  aiThink(dt);
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx*dt;s.life-=dt;let remove=s.life<=0||s.x<-30||s.x>1310;
    for(const p of obstacles)if(s.x>p.x&&s.x<p.x+p.w&&s.y>p.y&&s.y<p.y+p.h){remove=true;break}
    const target=s.owner===player?ai:player;if(!remove&&s.x>target.x&&s.x<target.x+target.w&&s.y>target.y&&s.y<target.y+target.h){damage(target);remove=true}
    if(remove)shots.splice(i,1);
  }
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
  updateHud(); if(player.hp<=0||ai.hp<=0)endGame();
}
function updateHud(){playerHp.style.width=(player.hp*10)+'%';enemyHp.style.width=(ai.hp*10)+'%';playerHpText.textContent=`${player.hp} / 10`;enemyHpText.textContent=`${ai.hp} / 10`}
function endGame(){gameRunning=false;resultScreen.classList.remove('hidden');const win=ai.hp<=0&&player.hp>0;resultTitle.textContent=win?'YOU WIN!':'YOU LOSE';resultText.textContent=win?'AIを倒しました！':'AIに負けました。もう一度挑戦しよう！';}

function draw(){
  const t=performance.now()/1000;ctx.clearRect(0,0,W,H);
  // sky
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#121b38');grad.addColorStop(1,'#26365b');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // simple city/mountain silhouettes
  ctx.fillStyle='rgba(255,255,255,.035)';for(let i=0;i<18;i++){const bw=50+(i%4)*25,bh=80+(i%5)*35;ctx.fillRect((i*87-(t*12)%87)*scale,H*0.86-bh,bw*scale,bh)}
  // ground
  ctx.fillStyle='#172033';ctx.fillRect(0,sy(level.ground),W,H-sy(level.ground));ctx.fillStyle='#3a4b67';ctx.fillRect(0,sy(level.ground),W,6);
  // platforms
  for(const p of obstacles){ctx.fillStyle='#596a86';ctx.fillRect(sx(p.x),sy(p.y),sx(p.w),sy(p.h));ctx.fillStyle='#7e91b1';ctx.fillRect(sx(p.x),sy(p.y),sx(p.w),4)}
  drawFighter(player);drawFighter(ai);
  for(const s of shots){ctx.fillStyle='#fff3a1';ctx.beginPath();ctx.arc(sx(s.x),sy(s.y),4,0,Math.PI*2);ctx.fill()}
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/.35);ctx.fillStyle='#ffd66b';ctx.fillRect(sx(p.x),sy(p.y),4,4)}ctx.globalAlpha=1;
}
function drawFighter(f){const x=sx(f.x),y=sy(f.y),w=sx(f.w),h=sy(f.h);ctx.save();ctx.globalAlpha=f.hitFlash>0?.5:1;ctx.fillStyle=f.color;ctx.fillRect(x,y,w,h);ctx.fillStyle='#f4d1b5';ctx.beginPath();ctx.arc(x+w/2,y+13*sx(1),10*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#101522';ctx.fillRect(x+(f.face>0?w:0)+(f.face>0?0:-28*scale),y+23*scale,28*scale,6*scale);ctx.restore()}
function loop(now){if(!gameRunning)return;const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}
reset();draw();
