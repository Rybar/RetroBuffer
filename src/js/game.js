import RetroBuffer from './core/RetroBuffer.js';
import MusicPlayer from './musicplayer.js';
import { playSound, Key, inView, timestamp, lerp, clamp } from './core/utils.js';
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

last = timestamp();
now = 0,
    dt = 0;

w = 320;
h = 180;

t = 0;

document.body.style = "margin:0; background-color:black; overflow:hidden";

const atlasURL = 'DATAURL:src/img/palette-aurora-256.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function() {
    let c = document.createElement('canvas');
    c.width = atlasImage.width;
    c.height = atlasImage.height;
    let ctx = c.getContext('2d');
    ctx.drawImage(this, 0, 0);
    atlas = new Uint32Array(ctx.getImageData(0, 0, this.width, this.height).data.buffer);
    window.r = new RetroBuffer(w, h, atlas, 4);
    r.atlasToRam(atlas, this.width, this.height, r.PAGE_3)
    gameInit();
};

function gameInit() {
    window.playSound = playSound;
    gamebox = document.getElementById("game");
    gamebox.appendChild(r.c);
    r.c.style = `height: ${h * 5}; width: ${w * 5}; margin: 30px`
        //    gamebox.appendChild(r.debugCanvas);
        //r.debugCanvas.style = 'margin: 30px'
    initAudio();
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

x = w / 2;
y = h / 2;
color = 15;
newX = Math.random() * w;
newY = Math.random() * h;
newColor = 15 + Math.random() * 15;
rad = 8;
newRad = 8 + Math.random() * 20;
speed = 0.05;
target = 0;

function updateGame(dt) {
    t += dt;
    target += dt * speed;
    x = lerp(x, newX, target);
    y = lerp(y, newY, target);
    rad = lerp(rad, newRad, target);
    color = lerp(color, newColor, target);
    if (Math.abs(newX - x) < 1) {
        newX = clamp(newX + Math.random() * 100 - 50, -20, w + 20);
        newY = clamp(newY + Math.random() * 100 - 50, -20, h + 20);
        newColor = clamp(newColor + Math.random() * 4 - 2, 15, 255);
        newRad = 8 + Math.random() * 20;
        target = 0;

    }
    if (Key.justReleased(Key.a)) {
        playSound(sounds.cellComplete);
    }
}

function drawGame() {
    //r.clear(0, r.SCREEN);
    r.clear(0, r.PAGE_1);
    r.clear(0, r.PAGE_2);
    r.renderTarget = r.SCREEN;
    for (let i = 0; i < 300; i++) {
        let x1 = Math.random() * w;
        let y1 = Math.random() * h;
        r.setColorBlend(clamp(r.pget(x1, y1, r.SCREEN) - 1, 0, 255) - 0.5);
        r.fillCircle(x1, y1 - 3, 2);
    }
    r.setColorBlend(color - 0.5);
    r.fillCircle(x - 1, y + 1, rad);
    r.setColorBlend(color);
    r.fillCircle(x, y, rad);
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