(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const VH=540;let W=960,H=VH,dpr=1,sc=1,screen='lobby',world=0,level=1,unlocked=1,coins=0,selected=0,paused=false;
const saved=(()=>{try{return JSON.parse(localStorage.getItem('jq-save')||'{}')}catch(e){return {}}})();
unlocked=Math.max(1,saved.unlocked||1);coins=saved.coins||0;selected=saved.selected||0;
const chars=[{name:'Milo',body:'#ffb23f',accent:'#e96c55'},{name:'Luna',body:'#a78bfa',accent:'#f472b6'},{name:'Robo',body:'#5eead4',accent:'#60a5fa'},{name:'Pip',body:'#a3e635',accent:'#facc15'}];
const worlds=[
 {name:'Sunny Hills',sky:['#75d8ff','#d9f7ff'],ground:'#56b96b',accent:'#ffe17a',kind:0},
 {name:'Mushroom Woods',sky:['#91e5c2','#e5ffd5'],ground:'#438f61',accent:'#ff9eb8',kind:1},
 {name:'Candy Valley',sky:['#f7a8d8','#ffe4f3'],ground:'#ba7bd4',accent:'#fff08b',kind:2},
 {name:'Desert Dash',sky:['#ffbd76','#fff0bd'],ground:'#d79a4a',accent:'#fff0a8',kind:3},
 {name:'Frost Peaks',sky:['#72c9ee','#e2f8ff'],ground:'#83c8df',accent:'#ffffff',kind:4},
 {name:'Lava Lands',sky:['#5b3b70','#ff9a63'],ground:'#62415c',accent:'#ffcf69',kind:5},
 {name:'Cloud Kingdom',sky:['#86baff','#f4fbff'],ground:'#f0f5ff',accent:'#ffe99a',kind:6},
 {name:'Neon City',sky:['#171d52','#5868b8'],ground:'#353b78',accent:'#65f4ff',kind:7},
 {name:'Ancient Ruins',sky:['#d9a66e','#ffe0a2'],ground:'#8c754c',accent:'#f4d47a',kind:8},
 {name:'Star Galaxy',sky:['#15153e','#583d91'],ground:'#48417e',accent:'#a8f4ff',kind:9}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(n)=>{let x=Math.sin(n*127.1+world*311+level*17)*43758.5453;return x-Math.floor(x)};
function save(){try{localStorage.setItem('jq-save',JSON.stringify({unlocked,coins,selected}))}catch(e){}}
let player,cam=0,platforms=[],hazards=[],enemies=[],gems=[],goal=0,worldWidth=0,spawn={x:70,y:384},cps=[],particles=[],last=0,keys={left:false,right:false,jump:false},jumpBuf=0;
function buildLevel(){
 const difficulty=(world*20+level)/200,base=1200+level*65+world*150;worldWidth=base;
 platforms=[{x:0,y:430,w:390,h:110},{x:470,y:430,w:270,h:110}];hazards=[];enemies=[];gems=[];particles=[];
 let x=760,n=0;cps=[];spawn={x:70,y:384};
 while(x<base-300){
  const gap=55+rand(x)*70, pw=140+rand(x+1)*170, py=340+rand(x+2)*95;
  platforms.push({x,y:py,w:pw,h:600-py});
  if(n%4===3){cps.push({x:x+pw*.2,y:py,on:false})}
  else{
   if(pw>=180&&rand(x+3)>.34) hazards.push({x:x+pw*.45,y:py-22,w:34,h:22,type:rand(x+4)>.5?'spike':'slime'});
   if(rand(x+5)>.28) enemies.push({x:x+40,y:py-30,w:31,h:29,baseX:x+40,min:x+10,max:x+pw-35,v:45+rand(x+6)*35,dir:1,alive:true});
  }
  for(let j=0;j<2+Math.floor(rand(x+7)*3);j++)gems.push({x:x+35+j*29,y:py-65-Math.sin(j)*12,taken:false});
  x+=pw+gap;n++;
 }
 platforms.push({x:base-250,y:390,w:250,h:150});goal=base-115;
 player={x:spawn.x,y:spawn.y,vx:0,vy:0,w:34,h:46,ground:true,face:1,anim:0,dead:false,win:false,inv:0,coyote:0,jumpHold:0};jumpBuf=0;
 cam=0;paused=false;screen='game';
}
function resize(){dpr=Math.min(devicePixelRatio||1,2);const iw=innerWidth||960,ih=innerHeight||VH;sc=ih/VH;W=iw/sc;H=VH;canvas.width=Math.round(iw*dpr);canvas.height=Math.round(ih*dpr);ctx.setTransform(dpr*sc,0,0,dpr*sc,0,0)}
addEventListener('resize',resize);resize();
function rrPath(x,y,w,h,r){r=Math.max(0,Math.min(r,Math.abs(w)/2,Math.abs(h)/2));ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function rounded(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();rrPath(x,y,w,h,r);ctx.fill()}
function text(t,x,y,size=20,color='#fff',align='center',weight=800){ctx.fillStyle=color;ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(t,x,y)}
function button(x,y,w,h,label,sub='',color='#ffffff22'){rounded(x,y,w,h,17,color);ctx.strokeStyle='#ffffff33';ctx.lineWidth=1.5;ctx.stroke();text(label,x+w/2,y+h/2+(sub?0:7),19);if(sub)text(sub,x+w/2,y+h/2+22,11,'#d9e8ff')}
function background(){
 const p=worlds[world],g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<7;i++){let xx=((i*190-cam*.18)%(W+230)+W+230)%(W+230)-100;ctx.fillStyle='#ffffff25';ctx.beginPath();ctx.arc(xx,100+(i%3)*48,30+(i%2)*13,0,Math.PI*2);ctx.arc(xx+35,95+(i%3)*48,38,0,Math.PI*2);ctx.arc(xx+70,105+(i%3)*48,25,0,Math.PI*2);ctx.fill()}
 for(let i=0;i<8;i++){let xx=((i*210-cam*.32)%(W+260)+W+260)%(W+260)-100;ctx.fillStyle=world===9?'#29265d':'#ffffff25';ctx.beginPath();ctx.moveTo(xx,H*.69);ctx.lineTo(xx+95,H*.35+(i%3)*40);ctx.lineTo(xx+200,H*.69);ctx.fill()}
}
function drawPlayer(x,y,scale=1){
 const c=chars[selected];ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 // soft shadow
 ctx.fillStyle='#17234440';ctx.beginPath();ctx.ellipse(17,48,20,5,0,0,Math.PI*2);ctx.fill();
 rounded(4,15,27,29,10,c.body);rounded(2,3,30,23,11,'#ffe0b6');
 // hair/helmet and face
 rounded(0,0,34,12,8,c.accent);ctx.fillStyle='#24304e';ctx.beginPath();ctx.arc(12,15,2.5,0,7);ctx.arc(24,15,2.5,0,7);ctx.fill();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(12.8,14,0.9,0,7);ctx.arc(24.8,14,0.9,0,7);ctx.fill();
 rounded(5,39,11,8,4,'#34415f');rounded(20,39,11,8,4,'#34415f');
 ctx.restore();
}
function drawWorld(){
 background();ctx.save();ctx.translate(-cam,0);
 platforms.forEach((p,i)=>{rounded(p.x,p.y,p.w,p.h,8,worlds[world].ground);rounded(p.x,p.y,p.w,9,5,'#ffffff35');for(let k=0;k<Math.floor(p.w/36);k++){ctx.fillStyle='#ffffff12';ctx.fillRect(p.x+k*36+8,p.y+20,12,4)}});
 hazards.forEach(h=>{if(h.type==='spike'){ctx.fillStyle='#ff6b6b';ctx.beginPath();ctx.moveTo(h.x,h.y+h.h);ctx.lineTo(h.x+h.w/2,h.y);ctx.lineTo(h.x+h.w,h.y+h.h);ctx.fill()}else{rounded(h.x,h.y,h.w,h.h,9,'#7c4dba');rounded(h.x+5,h.y+4,7,4,2,'#ffffff88')}});
 cps.forEach(c=>{ctx.fillStyle='#ffffffaa';ctx.fillRect(c.x-2,c.y-60,4,60);ctx.fillStyle=c.on?'#5ef08a':'#c5cde0';ctx.beginPath();ctx.moveTo(c.x+2,c.y-60);ctx.lineTo(c.x+30,c.y-48);ctx.lineTo(c.x+2,c.y-36);ctx.fill()});
 gems.forEach(g=>{if(!g.taken){ctx.save();ctx.translate(g.x,g.y+Math.sin(performance.now()/230+g.x)*5);ctx.rotate(Math.PI/4);rounded(-8,-8,16,16,4,'#ffe36e');ctx.restore()}});
 enemies.forEach(e=>{if(e.alive){rounded(e.x,e.y,31,29,10,'#e85c72');rounded(e.x+5,e.y+7,7,8,3,'#fff');rounded(e.x+19,e.y+7,7,8,3,'#fff');ctx.fillStyle='#29324d';ctx.fillRect(e.x+8,e.y+10,3,4);ctx.fillRect(e.x+22,e.y+10,3,4)}});
 // goal gate
 rounded(goal,300,20,130,8,'#ffe17a');rounded(goal+8,314,5,116,3,'#fff2b0');text('★',goal+10,292,23,'#fff1a8');
 ctx.globalAlpha=(player.inv>0&&Math.floor(performance.now()/90)%2)?.4:1;drawPlayer(player.x,player.y);ctx.globalAlpha=1;
 ctx.restore();
}
function collide(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function update(dt){
 if(screen!=='game'||paused||player.dead||player.win)return;
 const p=player,acc=1900,max=310;
 let dir=(keys.right?1:0)-(keys.left?1:0);
 if(dir){p.vx+=dir*acc*dt;p.face=dir}else p.vx*=Math.pow(.0008,dt);
 p.vx=clamp(p.vx,-max,max);
 jumpBuf=Math.max(0,jumpBuf-dt);
 if(jumpBuf>0&&(p.ground||p.coyote>0)){p.vy=-650;p.ground=false;p.coyote=0;p.jumpHold=.18;jumpBuf=0}
 if(keys.jump&&p.jumpHold>0){p.vy-=950*dt;p.jumpHold-=dt}else p.jumpHold=0
 p.vy+=1650*dt;p.vy=Math.min(p.vy,900);
 let oldY=p.y;p.x+=p.vx*dt;p.x=clamp(p.x,0,worldWidth-35);
 for(const pl of platforms){if(collide(p,pl)&&p.y+p.h>pl.y+8){p.x=(p.x+p.w/2<pl.x+pl.w/2)?pl.x-p.w:pl.x+pl.w;p.vx=0}}
 p.y+=p.vy*dt;p.ground=false;
 for(const pl of platforms){if(p.vy>=0&&oldY+p.h<=pl.y+8&&p.y+p.h>=pl.y&&p.x+p.w>pl.x&&p.x<pl.x+pl.w){p.y=pl.y-p.h;p.vy=0;p.ground=true}}
 if(p.ground)p.coyote=.10;else p.coyote=Math.max(0,(p.coyote||0)-dt);
 p.anim+=dt*(Math.abs(p.vx)>.5?12:3);p.inv=Math.max(0,p.inv-dt);
 enemies.forEach(e=>{if(!e.alive)return;e.x+=e.dir*e.v*dt;if(e.x<e.min||e.x>e.max)e.dir*=-1;if(collide(p,e)){if(p.vy>120&&oldY+p.h<e.y+13){e.alive=false;p.vy=-420;coins+=2}else hurt()}});
 hazards.forEach(h=>{if(collide(p,{x:h.x,y:h.y+3,w:h.w,h:h.h-3}))hurt()});
 gems.forEach(g=>{if(!g.taken&&Math.hypot(p.x+17-g.x,p.y+20-g.y)<29){g.taken=true;coins++;save()}});
 cps.forEach(c=>{if(!c.on&&collide(p,{x:c.x-14,y:c.y-70,w:28,h:70})){c.on=true;spawn={x:c.x-17,y:c.y-p.h}}});
 if(p.y>VH+130)hurt();
 if(p.x>goal-25){p.win=true;unlocked=Math.max(unlocked,world*20+level+1);save();setTimeout(()=>{if(screen!=='game')return;if(level<20)level++;else if(world<9){world++;level=1}paused=false;screen='levels'},700)}
 cam=clamp(p.x-W*.36,0,Math.max(0,worldWidth-W));
}
function hurt(){const p=player;if(p.inv>0)return;p.inv=1.2;p.x=spawn.x;p.y=spawn.y;p.vx=0;p.vy=0;p.jumpHold=0;p.coyote=0}
function hud(){
 rounded(16,14,210,48,15,'#142344bb');text(`${worlds[world].name}  •  ${level}/20`,30,44,15,'#fff','left');
 rounded(W-142,14,126,48,15,'#142344bb');text('◆ '+coins,W-78,44,17,'#ffe27b');
 button(W-58,76,42,38,'Ⅱ','','#142344bb');
}
function controls(){
 const y=H-92;button(24,y,66,66,'◀','',keys.left?'#3b5fc0cc':'#15254dcc');button(100,y,66,66,'▶','',keys.right?'#3b5fc0cc':'#15254dcc');button(W-112,y-6,88,78,'JUMP','',keys.jump?'#ffc46bcc':'#f6a83dcc');
}
function lobby(){
 background();ctx.fillStyle='#0e183c55';ctx.fillRect(0,0,W,H);
 text('JUMP QUEST',W/2,Math.max(85,H*.2),Math.min(58,W*.075),'#fff');
 text('Petualangan platformer penuh kejutan!',W/2,Math.max(116,H*.2+32),15,'#eaf4ff');
 drawPlayer(W/2-17,H*.34,1.8);
 button(W/2-120,H*.56,240,58,'▶  MULAI PETUALANGAN','10 dunia • 200 level','#ff9d43');
 button(W/2-120,H*.56+72,240,48,'KARAKTER','Pilih jagoanmu','#ffffff22');
 text('◆ '+coins+' koin',W/2,H-24,15,'#ffe27b');
}
function characterScreen(){
 background();text('PILIH KARAKTER',W/2,75,34);
 chars.forEach((c,i)=>{let x=W/2+(i-1.5)*145;rounded(x-53,150,106,170,20,selected===i?'#ffffff40':'#14234499');ctx.strokeStyle=selected===i?'#ffe17a':'#ffffff30';ctx.lineWidth=3;ctx.stroke();let old=selected;selected=i;drawPlayer(x-17,195,1.4);selected=old;text(c.name,x,285,16);if(selected===i)text('✓ DIPILIH',x,308,11,'#ffe17a')});
 button(25,H-76,110,48,'← KEMBALI');button(W-145,H-76,120,48,'PAKAI ✓','','#ff9d43');
}
function worldScreen(){
 background();text('PILIH DUNIA',W/2,66,34);
 const cols=5,cw=Math.min(160,(W-60)/5),ch=105;
 worlds.forEach((w,i)=>{let x=(W-(cols*cw+4*10))/2+(i%cols)*(cw+10),y=105+Math.floor(i/cols)*120,open=i===0||unlocked>(i*20);
 rounded(x,y,cw,ch,15,open?'#ffffff28':'#182344aa');ctx.fillStyle=w.ground;ctx.fillRect(x+8,y+8,cw-16,13);text(w.name,x+cw/2,y+49,Math.min(13,cw/10));text(open?'20 LEVEL':'🔒 TERKUNCI',x+cw/2,y+76,11,open?'#dfffe4':'#aab3cc')});
 button(25,H-68,115,45,'← LOBBY');
}
function levelScreen(){
 background();text(worlds[world].name.toUpperCase(),W/2,62,31);text('Selesaikan 20 level untuk membuka dunia berikutnya',W/2,88,13,'#e5efff');
 const cols=5,cw=Math.min(130,(W-80)/5),ch=67;
 for(let i=1;i<=20;i++){let x=(W-(cols*cw+4*10))/2+((i-1)%cols)*(cw+10),y=112+Math.floor((i-1)/cols)*78,open=(world===0&&i===1)||unlocked>world*20+i-1;
 rounded(x,y,cw,ch,13,open?'#ffffff28':'#14234499');text(open?String(i):'🔒',x+cw/2,y+41,22,open?'#fff':'#9aa6c4');}
 button(24,H-65,110,44,'← DUNIA');button(W-140,H-65,116,44,'LOBBY');
}
function pauseOverlay(){ctx.fillStyle='#07122bcc';ctx.fillRect(0,0,W,H);text('JEDA',W/2,H/2-50,40);button(W/2-100,H/2-15,200,48,'LANJUT');button(W/2-100,H/2+45,200,48,'KELUAR KE LEVEL')}
function draw(){
 ctx.clearRect(0,0,W,H);
 if(screen==='lobby')lobby();
 if(screen==='characters')characterScreen();
 if(screen==='worlds')worldScreen();
 if(screen==='levels')levelScreen();
 if(screen==='game'){drawWorld();hud();controls();if(paused)pauseOverlay();if(player.win){ctx.fillStyle='#08152a66';ctx.fillRect(0,0,W,H);text('LEVEL SELESAI! ✨',W/2,H/2,36)}}
}
function pos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/sc,y:(e.clientY-r.top)/sc}}
const pointers=new Map();
function zoneAt(q){if(q.y<H-130)return null;if(q.x<95)return'left';if(q.x<190)return'right';return'jump'}
function applyKeys(){let l=false,r=false,j=false;pointers.forEach(z=>{if(z==='left')l=true;else if(z==='right')r=true;else if(z==='jump')j=true});keys.left=l;keys.right=r;keys.jump=j}
function setZone(id,z){const old=pointers.get(id);if(old===z)return;pointers.set(id,z);if(z==='jump'&&old!=='jump')jumpBuf=.12;applyKeys()}
function releaseAll(){pointers.clear();applyKeys()}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();try{canvas.setPointerCapture(e.pointerId)}catch(_){}
 const q=pos(e);
 if(screen==='game'&&!paused){
  if(player.win)return;
  if(q.x>W-70&&q.y>66&&q.y<124){paused=true;releaseAll();return}
  setZone(e.pointerId,zoneAt(q));
 }else handleTap(q)});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||screen!=='game'||paused)return;setZone(e.pointerId,zoneAt(pos(e)))});
function endPointer(e){pointers.delete(e.pointerId);applyKeys()}
canvas.addEventListener('pointerup',endPointer);
canvas.addEventListener('pointercancel',endPointer);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='game'&&!player.win){paused=true;releaseAll()}});
window.jqBack=()=>{
 if(screen==='game'){paused=!paused;releaseAll();return true}
 if(screen==='levels'){screen='worlds';return true}
 if(screen==='worlds'||screen==='characters'){screen='lobby';return true}
 return false;
};
function handleTap(q){
 if(screen==='lobby'){if(q.y>H*.54&&q.y<H*.54+65){screen='worlds'}else if(q.y>H*.54+68&&q.y<H*.54+130)screen='characters'}
 else if(screen==='characters'){if(q.y>H-90){if(q.x<155)screen='lobby';else if(q.x>W-155){save();screen='lobby'}}else if(q.y>130&&q.y<340){let i=Math.round((q.x-W/2)/145+1.5);if(i>=0&&i<=3&&Math.abs(q.x-(W/2+(i-1.5)*145))<=53){selected=i;save()}}}
 else if(screen==='worlds'){if(q.y>H-85){screen='lobby';return}let cw=Math.min(160,(W-60)/5),x0=(W-(5*cw+40))/2;let col=Math.floor((q.x-x0)/(cw+10)),row=Math.floor((q.y-105)/120),i=row*5+col;if(i>=0&&i<10&&(i===0||unlocked>i*20)){world=i;screen='levels'}}
 else if(screen==='levels'){if(q.y>H-80){if(q.x<155)screen='worlds';else screen='lobby';return}let cw=Math.min(130,(W-80)/5),x0=(W-(5*cw+40))/2,col=Math.floor((q.x-x0)/(cw+10)),row=Math.floor((q.y-112)/78),i=row*5+col+1;if(i>=1&&i<=20&&(world*20+i===1||unlocked>=world*20+i)){level=i;buildLevel()}}
 else if(screen==='game'&&paused){if(q.y>H/2-25&&q.y<H/2+35)paused=false;else if(q.y>=H/2+40){paused=false;screen='levels'}}
}
function loop(t){let dt=Math.min((t-last)/1000||0,.033);last=t;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();
