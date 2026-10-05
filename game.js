const W=390,H=844;
const LANES=[W*.27,W*.5,W*.73];

let player,obstacles,coins;
let lane=1,score=0,coinsCount=0;
let best=+(localStorage.getItem("turboBest")||0);
let speed=390,alive=false,started=false;
let roadMarks=[];
let scoreText,coinText,bestText;
let startX=0,startY=0;

const cfg={
 type:Phaser.AUTO,
 parent:"game",
 width:W,
 height:H,
 backgroundColor:"#050816",
 scale:{
  mode:Phaser.Scale.FIT,
  autoCenter:Phaser.Scale.CENTER_BOTH
 },
 physics:{
  default:"arcade",
  arcade:{gravity:{y:0},debug:false}
 },
 scene:{create,update}
};

new Phaser.Game(cfg);

function create(){
 const s=this;

 drawWorld(s);

 obstacles=s.physics.add.group();
 coins=s.physics.add.group();

 player=makeRunner(s,LANES[lane],H-120);

 s.physics.add.existing(player);
 player.body.setSize(38,66);
 player.body.setAllowGravity(false);

 makeHUD(s);

 s.physics.add.overlap(player,coins,(p,c)=>{
  if(!alive||!c.active)return;

  c.destroy();
  coinsCount++;
  score+=75;

  burst(s,p.x,p.y-30,0xffc928);
  floatingText(s,p.x,p.y-70,"+75","#ffd84a");
 });

 s.physics.add.overlap(player,obstacles,(p,o)=>{
  if(!alive)return;

  if(
   player.getData("jumping") &&
   o.getData("jumpable")
  ) return;

  crash(s);
 });

 s.time.addEvent({
  delay:860,
  loop:true,
  callback:()=>alive&&spawnObstacle(s)
 });

 s.time.addEvent({
  delay:480,
  loop:true,
  callback:()=>alive&&spawnCoin(s)
 });

 s.input.on("pointerdown",p=>{
  startX=p.x;
  startY=p.y;
 });

 s.input.on("pointerup",p=>{
  if(!started||!alive)return;

  const dx=p.x-startX;
  const dy=p.y-startY;

  if(
   Math.abs(dx)>42 &&
   Math.abs(dx)>Math.abs(dy)
  ){
   move(dx>0?1:-1);
  }
  else if(dy<-42){
   jump();
  }
 });

 if(s.input.keyboard){
  s.input.keyboard.on(
   "keydown-LEFT",
   ()=>move(-1)
  );

  s.input.keyboard.on(
   "keydown-RIGHT",
   ()=>move(1)
  );

  s.input.keyboard.on(
   "keydown-UP",
   jump
  );
 }

 showStart(s);
}


function drawWorld(s){

 // НЕБО

 const g=s.add.graphics();

 g.fillGradientStyle(
  0x07112b,
  0x07112b,
  0x190b38,
  0x190b38,
  1
 );

 g.fillRect(0,0,W,H);


 // ЛУНА / СВЕЧЕНИЕ

 s.add.circle(
  326,82,34,
  0x3b82f6,.10
 );

 s.add.circle(
  326,82,23,
  0x60a5fa,.12
 );

 s.add.circle(
  326,82,12,
  0xdbeafe,.9
 );


 // НОЧНОЙ ГОРОД

 for(let x=0;x<W;x+=28){

  const h=Phaser.Math.Between(
   65,170
  );

  s.add.rectangle(
   x+14,
   170-h/2,
   26,
   h,
   Phaser.Math.RND.pick([
    0x0b1730,
    0x101b38,
    0x15163a
   ])
  );

  for(
   let yy=190-h;
   yy<160;
   yy+=20
  ){

   if(Math.random()>.5){

    s.add.rectangle(
     x+8,
     yy,
     3,
     7,
     Math.random()>.5
      ?0x22d3ee
      :0xf472b6,
     .75
    );

   }

  }

 }


 // СВЕЧЕНИЕ ГОРИЗОНТА

 s.add.rectangle(
  W/2,
  184,
  W,
  6,
  0x22d3ee,
  .22
 );

 s.add.rectangle(
  W/2,
  190,
  W,
  2,
  0xf472b6,
  .28
 );


 // ОБОЧИНЫ

 s.add.rectangle(
  25,
  H/2,
  50,
  H,
  0x07101e
 );

 s.add.rectangle(
  W-25,
  H/2,
  50,
  H,
  0x07101e
 );


 for(let y=220;y<H;y+=92){

  s.add.rectangle(
   17,
   y,
   5,
   30,
   0xfacc15,
   .85
  );

  s.add.rectangle(
   W-17,
   y+35,
   5,
   30,
   0x22d3ee,
   .9
  );

 }


 // ДОРОГА

 s.add.rectangle(
  W/2,
  (H+180)/2,
  W*.78,
  H-180,
  0x101827
 );


 // ГРАНИЦЫ ДОРОГИ

 s.add.rectangle(
  W*.11,
  (H+180)/2,
  5,
  H-180,
  0x60a5fa,
  .65
 );

 s.add.rectangle(
  W*.89,
  (H+180)/2,
  5,
  H-180,
  0x60a5fa,
  .65
 );


 // РАЗМЕТКА

 [
  W*.385,
  W*.615
 ].forEach(x=>{

  for(
   let y=190;
   y<H+100;
   y+=100
  ){

   const m=s.add.rectangle(
    x,
    y,
    5,
    48,
    0xcbd5e1,
    .72
   );

   roadMarks.push(m);

  }

 });


 // НЕОНОВЫЕ КРАЯ

 s.add.rectangle(
  W*.105,
  (H+180)/2,
  2,
  H-180,
  0x22d3ee,
  .5
 );

 s.add.rectangle(
  W*.895,
  (H+180)/2,
  2,
  H-180,
  0xf472b6,
  .5
 );

}


function makeHUD(s){

 s.add.rectangle(
  77,
  50,
  132,
  70,
  0x020617,
  .72
 )
 .setStrokeStyle(
  1,
  0x334155,
  .8
 )
 .setDepth(30);


 scoreText=s.add.text(
  20,
  18,
  "0",
  {
   fontSize:"29px",
   fontStyle:"bold",
   color:"#fff"
  }
 )
 .setDepth(31);


 bestText=s.add.text(
  20,
  53,
  "РЕКОРД "+best,
  {
   fontSize:"12px",
   color:"#94a3b8"
  }
 )
 .setDepth(31);


 s.add.circle(
  327,
  37,
  17,
  0xf59e0b
 )
 .setStrokeStyle(
  3,
  0xffdf55
 )
 .setDepth(30);


 s.add.text(
  327,
  37,
  "★",
  {
   fontSize:"14px",
   color:"#fff6a8"
  }
 )
 .setOrigin(.5)
 .setDepth(31);


 coinText=s.add.text(
  352,
  27,
  "0",
  {
   fontSize:"18px",
   fontStyle:"bold",
   color:"#fff"
  }
 )
 .setDepth(31);

}


function makeRunner(s,x,y){

 const c=s.add.container(
  x,y
 )
 .setDepth(15);


 // ТЕНЬ

 const shadow=s.add.ellipse(
  0,
  35,
  48,
  13,
  0x000000,
  .4
 );


 // НОГИ

 const legL=s.add.rectangle(
  -9,
  20,
  10,
  30,
  0x111827
 )
 .setOrigin(.5,.15);


 const legR=s.add.rectangle(
  9,
  20,
  10,
  30,
  0x111827
 )
 .setOrigin(.5,.15);


 // КРОССОВКИ

 const shoeL=s.add.ellipse(
  -10,
  45,
  16,
  8,
  0xf8fafc
 );

 const shoeR=s.add.ellipse(
  10,
  45,
  16,
  8,
  0xf8fafc
 );


 // ТЕЛО

 const torso=s.add.rectangle(
  0,
  -5,
  42,
  48,
  0xf1f5f9
 );


 // ЖИЛЕТ

 const vest=s.add.rectangle(
  0,
  -4,
  29,
  39,
  0x111827
 );


 // НЕОНОВАЯ ЭМБЛЕМА

 const neon=s.add.triangle(
  0,
  -5,
  -9,-9,
  9,-9,
  0,10,
  0x22d3ee
 );


 // ГОЛОВА

 const head=s.add.circle(
  0,
  -43,
  16,
  0xe8b68e
 );


 // КЕПКА

 const cap=s.add.ellipse(
  0,
  -55,
  31,
  12,
  0x0f172a
 );

 const brim=s.add.rectangle(
  9,
  -51,
  18,
  4,
  0x111827
 );


 // РУКИ

 const armL=s.add.rectangle(
  -25,
  -3,
  9,
  35,
  0xe8b68e
 )
 .setOrigin(.5,.1)
 .setAngle(18);


 const armR=s.add.rectangle(
  25,
  -3,
  9,
  35,
  0xe8b68e
 )
 .setOrigin(.5,.1)
 .setAngle(-18);


 c.add([
  shadow,
  legL,
  legR,
  shoeL,
  shoeR,
  torso,
  vest,
  neon,
  armL,
  armR,
  head,
  cap,
  brim
 ]);


 c.setSize(
  42,
  78
 );


 // АНИМАЦИЯ БЕГА

 s.tweens.add({
  targets:legL,
  angle:{
   from:-22,
   to:22
  },
  duration:135,
  yoyo:true,
  repeat:-1
 });


 s.tweens.add({
  targets:legR,
  angle:{
   from:22,
   to:-22
  },
  duration:135,
  yoyo:true,
  repeat:-1
 });


 s.tweens.add({
  targets:armL,
  angle:{
   from:28,
   to:-12
  },
  duration:135,
  yoyo:true,
  repeat:-1
 });


 s.tweens.add({
  targets:armR,
  angle:{
   from:-28,
   to:12
  },
  duration:135,
  yoyo:true,
  repeat:-1
 });


 s.tweens.add({
  targets:c,
  scaleY:{
   from:1,
   to:.97
  },
  duration:135,
  yoyo:true,
  repeat:-1
 });


 return c;

}


function makeVehicle(
 s,
 x,
 y,
 type
){

 const c=s.add.container(
  x,y
 )
 .setDepth(12);


 let w=58;
 let h=72;
 let body=0xef4444;


 // СИНИЙ ФУРГОН

 if(type===1){

  w=64;
  h=92;
  body=0x2563eb;

 }


 // ЖЁЛТАЯ НИЗКАЯ МАШИНА

 if(type===2){

  w=55;
  h=65;
  body=0xf59e0b;

 }


 const shadow=s.add.ellipse(
  0,
  h*.42,
  w*.95,
  15,
  0x000000,
  .35
 );


 const base=s.add.rectangle(
  0,
  0,
  w,
  h,
  body
 )
 .setStrokeStyle(
  2,
  0xffffff,
  .12
 );


 const glass=s.add.rectangle(
  0,
  -h*.22,
  w*.68,
  h*.24,
  0x07152d
 );


 const shine=s.add.rectangle(
  -w*.34,
  -2,
  3,
  h*.72,
  0xffffff,
  .18
 );


 const l1=s.add.circle(
  -w*.28,
  h*.31,
  5,
  0xfff3a3
 );


 const l2=s.add.circle(
  w*.28,
  h*.31,
  5,
  0xfff3a3
 );


 c.add([
  shadow,
  base,
  glass,
  shine,
  l1,
  l2
 ]);


 c.setSize(
  w-6,
  h-5
 );


 return c;

}


function spawnObstacle(s){

 const ln=
  Phaser.Math.Between(
   0,2
  );

 const type=
  Phaser.Math.Between(
   0,2
  );


 const o=makeVehicle(
  s,
  LANES[ln],
  170,
  type
 );


 s.physics.add.existing(o);

 o.body
  .setAllowGravity(false)
  .setVelocityY(speed);


 // ЖЁЛТУЮ МАШИНУ
 // МОЖНО ПЕРЕПРЫГНУТЬ

 o.setData(
  "jumpable",
  type===2
 );


 obstacles.add(o);

}


function spawnCoin(s){

 const ln=
  Phaser.Math.Between(
   0,2
  );


 const c=s.add.container(
  LANES[ln],
  170
 )
 .setDepth(13);


 const glow=s.add.circle(
  0,
  0,
  21,
  0xffa600,
  .18
 );


 const outer=s.add.circle(
  0,
  0,
  15,
  0xf59e0b
 )
 .setStrokeStyle(
  3,
  0xffe066
 );


 const inner=s.add.circle(
  0,
  0,
  10,
  0xffc928
 );


 const star=s.add.text(
  0,
  0,
  "★",
  {
   fontSize:"12px",
   color:"#fff6b0"
  }
 )
 .setOrigin(.5);


 c.add([
  glow,
  outer,
  inner,
  star
 ]);


 c.setSize(
  28,
  28
 );


 s.physics.add.existing(c);

 c.body
  .setAllowGravity(false)
  .setVelocityY(speed);


 coins.add(c);


 // ВРАЩЕНИЕ МОНЕТЫ

 s.tweens.add({

  targets:c,

  scaleX:{
   from:1,
   to:.35
  },

  duration:240,

  yoyo:true,

  repeat:-1

 });

}


function move(d){

 if(!alive)return;


 lane=
  Phaser.Math.Clamp(
   lane+d,
   0,
   2
  );


 player.scene.tweens.add({

  targets:player,

  x:LANES[lane],

  duration:120,

  ease:"Sine.easeOut"

 });

}


function jump(){

 if(
  !alive ||
  player.getData("jumping")
 ) return;


 player.setData(
  "jumping",
  true
 );


 player.scene.tweens.add({

  targets:player,

  y:player.y-120,

  scaleX:1.08,

  scaleY:1.08,

  duration:255,

  yoyo:true,

  ease:"Sine.easeOut",

  onComplete:()=>{

   player.setData(
    "jumping",
    false
   );

  }

 });

}


function update(t,dt){

 if(!alive)return;


 score+=dt*.012;


 speed=Math.min(
  800,
  390+score*.17
 );


 // ДВИЖЕНИЕ ДОРОГИ

 roadMarks.forEach(m=>{

  m.y+=
   speed*
   dt/
   1000;


  if(m.y>H+45){

   m.y=185;

  }

 });


 // ПРЕПЯТСТВИЯ

 obstacles
 .getChildren()
 .forEach(o=>{

  if(
   o.active &&
   o.body
  ){

   o.body.setVelocityY(
    speed
   );


   if(
    o.y>H+110
   ){

    o.destroy();

   }

  }

 });


 // МОНЕТЫ

 coins
 .getChildren()
 .forEach(c=>{

  if(
   c.active &&
   c.body
  ){

   c.body.setVelocityY(
    speed
   );


   if(
    c.y>H+60
   ){

    c.destroy();

   }

  }

 });


 scoreText.setText(
  Math.floor(score)
 );


 coinText.setText(
  coinsCount
 );

}


function burst(
 s,
 x,
 y,
 color
){

 for(
  let i=0;
  i<8;
  i++
 ){

  const p=s.add.circle(
   x,
   y,
   Phaser.Math.Between(
    2,4
   ),
   color
  )
  .setDepth(40);


  const a=
   Math.PI*
   2*
   i/
   8;


  const dist=
   Phaser.Math.Between(
    25,48
   );


  s.tweens.add({

   targets:p,

   x:
    x+
    Math.cos(a)*
    dist,

   y:
    y+
    Math.sin(a)*
    dist,

   alpha:0,

   duration:350,

   onComplete:
    ()=>p.destroy()

  });

 }

}


function floatingText(
 s,
 x,
 y,
 txt,
 color
){

 const t=s.add.text(
  x,
  y,
  txt,
  {
   fontSize:"18px",
   fontStyle:"bold",
   color
  }
 )
 .setOrigin(.5)
 .setDepth(40);


 s.tweens.add({

  targets:t,

  y:y-40,

  alpha:0,

  duration:550,

  onComplete:
   ()=>t.destroy()

 });

}


function showStart(s){

 alive=false;
 started=false;


 const shade=s.add.rectangle(
  W/2,
  H/2,
  W,
  H,
  0x020617,
  .62
 )
 .setDepth(50);


 const glow=s.add.circle(
  W/2,
  235,
  115,
  0x2563eb,
  .13
 )
 .setDepth(51);


 const title=s.add.text(
  W/2,
  185,
  "TURBO",
  {
   fontSize:"58px",
   fontStyle:"bold italic",
   color:"#f8fafc",
   stroke:"#0f172a",
   strokeThickness:8
  }
 )
 .setOrigin(.5)
 .setDepth(52);


 const title2=s.add.text(
  W/2,
  242,
  "RUNNER",
  {
   fontSize:"48px",
   fontStyle:"bold italic",
   color:"#f59e0b",
   stroke:"#0f172a",
   strokeThickness:7
  }
 )
 .setOrigin(.5)
 .setDepth(52);


 const sub=s.add.text(
  W/2,
  310,
  "НОЧНОЙ ГОРОД • БЕСКОНЕЧНЫЙ ЗАБЕГ",
  {
   fontSize:"11px",
   color:"#94a3b8"
  }
 )
 .setOrigin(.5)
 .setDepth(52);


 const btn=s.add.rectangle(
  W/2,
  570,
  250,
  68,
  0xfbbf24
 )
 .setStrokeStyle(
  3,
  0xffe48a
 )
 .setInteractive()
 .setDepth(52);


 const bt=s.add.text(
  W/2,
  570,
  "▶  ИГРАТЬ",
  {
   fontSize:"23px",
   fontStyle:"bold",
   color:"#111827"
  }
 )
 .setOrigin(.5)
 .setDepth(53);


 const help=s.add.text(
  W/2,
  635,
  "СВАЙП ← →   •   ПРЫЖОК ↑",
  {
   fontSize:"13px",
   color:"#cbd5e1"
  }
 )
 .setOrigin(.5)
 .setDepth(52);


 s.tweens.add({

  targets:btn,

  scaleX:{
   from:1,
   to:1.035
  },

  scaleY:{
   from:1,
   to:1.035
  },

  duration:700,

  yoyo:true,

  repeat:-1

 });


 btn.on(
  "pointerup",
  ()=>{

   [
    shade,
    glow,
    title,
    title2,
    sub,
    btn,
    bt,
    help
   ]
   .forEach(
    x=>x.destroy()
   );


   alive=true;
   started=true;

  }
 );

}


function crash(s){

 if(!alive)return;


 alive=false;


 const final=
  Math.floor(score);


 if(final>best){

  best=final;

  localStorage.setItem(
   "turboBest",
   best
  );

 }


 burst(
  s,
  player.x,
  player.y,
  0xff4d4d
 );


 s.cameras.main.shake(
  250,
  .015
 );


 s.time.delayedCall(
  180,
  ()=>showGameOver(
   s,
   final
  )
 );

}


function showGameOver(
 s,
 final
){

 s.add.rectangle(
  W/2,
  H/2,
  W,
  H,
  0x020617,
  .82
 )
 .setDepth(60);


 s.add.text(
  W/2,
  210,
  "GAME",
  {
   fontSize:"55px",
   fontStyle:"bold italic",
   color:"#fff"
  }
 )
 .setOrigin(.5)
 .setDepth(61);


 s.add.text(
  W/2,
  262,
  "OVER",
  {
   fontSize:"55px",
   fontStyle:"bold italic",
   color:"#ef4444"
  }
 )
 .setOrigin(.5)
 .setDepth(61);


 s.add.rectangle(
  W/2,
  390,
  290,
  150,
  0x07111f,
  .96
 )
 .setStrokeStyle(
  2,
  0x334155
 )
 .setDepth(61);


 s.add.text(
  W/2,
  355,
  "СЧЁТ",
  {
   fontSize:"13px",
   color:"#94a3b8"
  }
 )
 .setOrigin(.5)
 .setDepth(62);


 s.add.text(
  W/2,
  389,
  String(final),
  {
   fontSize:"38px",
   fontStyle:"bold",
   color:"#fbbf24"
  }
 )
 .setOrigin(.5)
 .setDepth(62);


 s.add.text(
  W/2,
  435,
  "РЕКОРД  "+
  best+
  "   •   МОНЕТЫ  "+
  coinsCount,
  {
   fontSize:"13px",
   color:"#e2e8f0"
  }
 )
 .setOrigin(.5)
 .setDepth(62);


 const btn=s.add.rectangle(
  W/2,
  535,
  250,
  66,
  0xfbbf24
 )
 .setInteractive()
 .setDepth(62);


 s.add.text(
  W/2,
  535,
  "↻  ЕЩЁ РАЗ",
  {
   fontSize:"21px",
   fontStyle:"bold",
   color:"#111827"
  }
 )
 .setOrigin(.5)
 .setDepth(63);


 btn.on(
  "pointerup",
  ()=>location.reload()
 );

}
