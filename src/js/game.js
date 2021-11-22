import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';

//sound assets
import cellComplete from './sounds/cellComplete.js';

import { playSound, Key, choice, inView, lerp } from './core/utils.js';
import Stats from './core/Stats.js';

gameScale = 1;
gameState = 1;
sounds = [];

w = 320;
h = 180;
stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.style="margin:0; background-color:black; overflow:hidden";

const atlasURL = 'DATAURL:src/img/palette-aurora-256.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function(){ 
  let c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  let ctx = c.getContext('2d');
  ctx.drawImage(this, 0, 0);
  atlas = new Uint32Array( ctx.getImageData(0,0,this.width, this.height).data.buffer );
  window.r = new RetroBuffer(w, h, atlas, 4);
  r.atlasToRam(atlas, this.width, this.height, r.PAGE_3)
  gameInit();
};

function gameInit(){
  window.playSound = playSound;
  gamebox = document.getElementById("game");
  gamebox.appendChild(r.c);
  r.c.style=`height: ${h * 5}; width: ${w * 5}; margin: 30px`
  //gamebox.appendChild(r.debugCanvas);
  r.debugCanvas.style='margin: 30px'
  initAudio();
  gameloop();
}

//document.body.appendChild( stats.dom );

window.t = 1;

function initAudio(){
  audioCtx = new AudioContext;
  audioMaster = audioCtx.createGain();
  compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-60, audioCtx.currentTime);
    compressor.knee.setValueAtTime(40, audioCtx.currentTime); 
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  audioMaster.connect(compressor);
  compressor.connect(audioCtx.destination);

  sndData = [
    {name:'cellComplete', data: cellComplete},
  ]
  totalSounds = sndData.length;
  soundsReady = 0;
  sndData.forEach(function(o){
    var sndGenerator = new MusicPlayer();
    sndGenerator.init(o.data);
    var done = false;
    setInterval(function () {
      if (done) {
        return;
      }
      done = sndGenerator.generate() == 1;
      soundsReady+=done;
      if(done){
        let wave = sndGenerator.createWave().buffer;
        audioCtx.decodeAudioData(wave, function(buffer) {
          sounds[o.name] = buffer;
          //soundsReady++;
        })
      }
    },0)
  })
}

function updateGame(){
  t+=1;
  if(Key.justReleased(Key.a)){
    playSound(sounds.cellComplete);
  }
}

function drawGame(){
  r.renderTarget = r.SCREEN;
  r.clear(24, r.SCREEN);
  r.clear(0, r.PAGE_1);
  r.clear(0, r.PAGE_2);


  //diagonal moving rectangles
  r.renderTarget = r.PAGE_1;
  for(let i=0; i<w+40; i+=30){
    for(let j=-20; j<h+40; j+=30){
      r.fillRect(-20 + (i + t)%(w+40), -20 + (j + t)%(h+30), 16, 16, 23);
    }
  }

//random pile of circles, no page clear
  r.renderTarget = r.PAGE_2;
  for(let i = 0; i < 40; i++){
    r.circle(Math.random()*w, Math.random()*h, Math.random()*10, Math.random()*10);
  }

//wavy effect by sspr copying from page1 in 5px slices with scale offset
  r.renderTarget = r.SCREEN;
  r.renderSource = r.PAGE_1;
  for(let i=0; i<w; i++){
    let
    ymod = Math.sin( (t+i) / 20 ) * 10;
    //yscale = Math.sin( (t+i) / 10 ) * 0.5 + 1;
    r.sspr(i, 0, 1, h, i, ymod/2, 1, h+ymod);
  }

//sten
  
  for(let i=0; i<256; i++){
      r.fillRect(i,0, 1, 4,  i);
  }
  for(let i=0; i<w; i+=r.tileset.tileSize.x){
    for(let j=0; j<64; j+=r.tileset.tileSize.y){
    r.palOffset = ((j/8) * 32 + i/8) % 256 - 16; 
    r.drawTile(Math.floor(j/32), i, 100+j) % 256 - 16;
    }
  }

  r.stencil = true;
  r.palOffset = (16 + t/10 ) % 256;
  r.fillCircle(w/2+Math.sin(t/100)*100, h/2+Math.cos(t/100)*100, 30, 21);
  r.stencil = false;
  r.circle(w/2+Math.sin(t/100)*100, h/2+Math.cos(t/100)*100, 30, 21);
  r.palOffset = 0;
  r.render();
  //r.debugRender();
}

function resetGame(){
  window.t = 1;
}


//initialize  event listeners--------------------------
window.addEventListener('keyup', function (event) {
  Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
  Key.onKeydown(event);
}, false);
window.addEventListener('blur', function (event) {
  paused = true;
}, false);
window.addEventListener('focus', function (event) {
  paused = false;
}, false);

function pruneDead(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!e.alive){
      entitiesArray.splice(i,1);
    }
  }
}

function pruneScreen(entitiesArray){
  for(let i = 0; i < entitiesArray.length; i++){
    let e = entitiesArray[i];
    if(!inView(e)){
      entitiesArray.splice(i,1);
    }
  }
}

function gameloop(){
  if(1==1){
  stats.begin();
    switch(gameState){
      case 0: 
        break;
      case 1: //game
        updateGame();
        drawGame();
        break;
      case 2: 
        titlescreen();
        break;
    }
    Key.update();
   stats.end();
    requestAnimationFrame(gameloop);
  }
}


