import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';
import { playSound, Key, inView, timestamp, lerp, clamp, rand, choice } from './core/utils.js';
import Player from './player.js'
import Sprite from './sprite.js'
//import Demos from './Demos.js';
//demos = new Demos();

//sound assets
import cellComplete from './sounds/cellComplete.js';

//stats = new Stats();
//stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
//import Stats from './core/Stats.js';

gameScale = 1;
gameState = 1;
sounds = [];
mapToggle = false;
onscreen = 0;

last = timestamp();
now = 0,
    dt = 0;

w = window.innerWidth/4| 0;
h = window.innerHeight/4 | 0;

view = {x: 0, y: 0, z: 1}

tileWidth = tileHeight = 8;
player = Player;


t = 0;

sprites = [];
//sprites.push(new Sprite(100,100));

document.body.style = "margin:0; background-color:black; overflow:hidden";

const atlasURL = 'DATAURL:src/img/atlas-redball.png';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function() {
    let c = document.createElement('canvas');
    c.width = atlasImage.width;
    c.height = atlasImage.height;
    let ctx = c.getContext('2d');
    ctx.drawImage(this, 0, 0);
    atlas = new Uint32Array(ctx.getImageData(0, 0, this.width, this.height).data.buffer);
    window.r = new RetroBuffer(w, h, atlas);
    r.atlasToRam(atlas, this.width, this.height, r.PAGE_3)
    gameInit();
};

function gameInit() {
    window.playSound = playSound;
    
    gamebox = document.getElementById("game");
    gamebox.appendChild(r.c);
    r.c.style = `height: 100%; width: 100%;`
        //    gamebox.appendChild(r.debugCanvas);
        //r.debugCanvas.style = 'margin: 30px'
    initAudio();
    initGameData();
    gameloop();
}

//document.body.appendChild( stats.dom );



function initAudio() {
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
        { name: 'cellComplete', data: cellComplete },
    ]
    totalSounds = sndData.length;
    soundsReady = 0;
    sndData.forEach(function(o) {
        var sndGenerator = new MusicPlayer();
        sndGenerator.init(o.data);
        var done = false;
        setInterval(function() {
            if (done) {
                return;
            }
            done = sndGenerator.generate() == 1;
            soundsReady += done;
            if (done) {
                let wave = sndGenerator.createWave().buffer;
                audioCtx.decodeAudioData(wave, function(buffer) {
                    sounds[o.name] = buffer;
                    //soundsReady++;
                })
            }
        }, 0)
    })
}

function initGameData() {
    r.renderTarget = r.mapSource;
    player.position = {x: 0, y: 0};
    r.pset(0,0,1);
    r.fillRect(4,4,3,3,1)
    for(let i = 0; i < 400; i++){
        r.fillRect(rand(0,w), rand(0, h), rand(3, 12), rand(3,12), 1)
    }
    // for(let i = 0; i < 300; i++){
    //     ball = new Sprite(rand(0, 2000), rand(0, 2000), 0)
    //     //ball.graphic.color = 156-121;
    //     //ball.transform.scale = Math.random()*0.75 + 0.25;
    //     sprites.push(ball);
    // }
    for(let i = 0; i < 90; i++){
        var x = rand(-1000, 1000),
            y = rand(-1000, 1000),
            h = rand(2, 10);
            depth = rand(0, 50);
        for(let j = 0; j <= h; j++) {
            ball = new Sprite(x,y,depth + 40 * j)
            //ball.graphic.color = choice([153-2, 122, 245])
            sprites.push(ball  ) 
        }
    }

   

    

    sprites.sort(function(a,b){return b.transform.z - a.transform.z})
    // for(let i = 0; i <= map.width * map.height; i++){
    //     map.data[i] = Math.round(Math.random()*3)
    // }
}


function updateGame(dt) {
    t += dt;
    if(Key.isDown(Key.d) || Key.isDown(Key.RIGHT)){
        //view.x+=1
        player.position.x +=1;
    }
    if(Key.isDown(Key.a) || Key.isDown(Key.LEFT)){
        player.position.x -=1;
    }
    if(Key.isDown(Key.w) || Key.isDown(Key.UP)){
        player.position.y -=1;
    }
    if(Key.isDown(Key.s) || Key.isDown(Key.DOWN)){
        player.position.y +=1;
    }
    if(Key.justReleased(Key.z)){
        playSound(sounds.cellComplete);
        mapToggle = !mapToggle
    }
    player.update(dt);
    sprites.forEach(e=>e.update(dt))
    view.x = lerp(view.x, Player.position.x-w/2, 0.05);
    view.y = lerp(view.y, Player.position.y-h/2, 0.05);
}

function drawGame() {
    r.clear(0, r.SCREEN);
    r.renderTarget = r.SCREEN;
   
    //r.fillCircle(w/2, h/2, 20, 5);
    sprites.forEach(e=>e.draw())
    //r.drawMap();
    Player.draw();
    console.log(`Sprite Count: ${onscreen}`)
    onscreen = 0;
  //  console.log(`x: ${view.x}} y: ${view.y}`)
    r.render();
    //r.debugRender();
}

function resetGame() {
    window.t = 0;
}


//initialize  event listeners--------------------------
window.addEventListener('keyup', function(event) {
    Key.onKeyup(event);
}, false);
window.addEventListener('keydown', function(event) {
    Key.onKeydown(event);
}, false);
window.addEventListener('blur', function(event) {
    paused = true;
}, false);
window.addEventListener('focus', function(event) {
    paused = false;
}, false);

function pruneDead(entitiesArray) {
    for (let i = 0; i < entitiesArray.length; i++) {
        let e = entitiesArray[i];
        if (!e.alive) {
            entitiesArray.splice(i, 1);
        }
    }
}

function pruneScreen(entitiesArray) {
    for (let i = 0; i < entitiesArray.length; i++) {
        let e = entitiesArray[i];
        if (!inView(e)) {
            entitiesArray.splice(i, 1);
        }
    }
}

function gameloop() {
    if (1 == 1) {
        //stats.begin();
        now = timestamp();
        dt = Math.min(1, (now - last) / 1000);
        switch (gameState) {
            case 0:
                break;
            case 1: //game
                updateGame(dt);
                drawGame(dt);
                break;
            case 2:
                titlescreen(dt);
                break;
        }
        Key.update();
        //stats.end();
        requestAnimationFrame(gameloop);
    }
}