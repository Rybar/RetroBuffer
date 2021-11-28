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
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.style = "margin:0; background-color:black; overflow:hidden";

const atlasURL = 'DATAURL:src/img/palette-aurora-256.webp';
atlasImage = new Image();
atlasImage.src = atlasURL;

atlasImage.onload = function() {
    let c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
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
    r.c.style = `height: ${h * 4}; width: ${w * 4}; margin: 30px`
    //    gamebox.appendChild(r.debugCanvas);
    //r.debugCanvas.style = 'margin: 30px'
    initAudio();
    gameloop();
}

document.body.appendChild( stats.dom );

window.t = 1;

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

function updateGame() {
    t += 1;
    if (Key.justReleased(Key.a)) {
        playSound(sounds.cellComplete);
    }
}

function drawGame() {
    r.renderTarget = r.SCREEN;
    r.clear(121, r.SCREEN);
    r.clear(0, r.PAGE_1);
    r.clear(0, r.PAGE_2);


//diagonal moving rectangles
    r.renderTarget = r.PAGE_1;
    for (let i = 0; i < w + 40; i += 15) {
        for (let j = -20; j < h + 40; j += 15) {
            r.circle(-20 + (i + t + Math.sin(i/17)*22) % (w + 40), -20 + (j + t/2) % (h + 30), 10-Math.sin(i/100)*5, 120 + ((i+j)/90));
        }
    }

//random pile of circles, no page clear
    // r.renderTarget = r.PAGE_2;
    // for (let i = 0; i < 40; i++) {
    //     r.circle(Math.random() * w, Math.random() * h, Math.random() * 10, Math.random() * 10);
    // }

//wavy effect by sspr copying from page1 in 5px slices with scale offset
    r.renderTarget = r.SCREEN;
    r.renderSource = r.PAGE_1;
    for (let i = 0; i < w; i++) {
        let
            ymod = Math.sin((t + i) / 20) * 10;
        //yscale = Math.sin( (t+i) / 10 ) * 0.5 + 1;
        r.sspr(i, 0, 1, h, i, ymod / 2, 1, h + ymod);
    }

//tile drawing test
    // for (let i = 0; i < 256; i++) {
    //     r.fillRect(i, 0, 1, 4, i);
    // }
    // for (let i = 0; i < w; i += r.spriteTileset.tileSize.x) {
    //     for (let j = 0; j < 64; j += r.spriteTileset.tileSize.y) {
    //         r.palOffset = ((j / 8) * 32 + i / 8) % 256;
    //         r.drawTile(Math.floor(j / 32), i, 100 + j, r.spriteTileset, 1, false, true);
    //     }
    // }

//stencil drawing test -floating circle
    // r.stencil = true;
    // r.palOffset = (16 + t / 10) % 256;
    // r.fillCircle(w / 2 + Math.sin(t / 100) * 100, h / 2 + Math.cos(t / 100) * 100, 30, 21);
    // r.stencil = false;
    // r.circle(w / 2 + Math.sin(t / 100) * 100, h / 2 + Math.cos(t / 100) * 100, 30, 21);
    // r.palOffset = 0;

//text drawing test
    // [textstring, x, y, hspacing, vspacing, halign, valign, scale, color, offset, delay, frequency]
    // r.renderTarget = r.SCREEN;
    // let text = ["The Quick Brown Fox Jumped Over The Lazy Dog\nNOW IS THE TIME",
    //   10, 40, 1,2, "left", "top", 1, 37, 0, 0, 0]

    // r.text(text, 162);
    
//sspr from to same page test
    // r.renderSource = r.SCREEN
    // r.renderTarget = r.SCREEN
    // r.sspr(100, 100, 64, 64, 100-10, 100-10, 66, 66);

//tline test
    r.renderSource = r.PAGE_3 
    r.renderTarget = r.SCREEN
    r.sspr(0, 0, w, 7, 0, 0, w, 15)
    
    for(let i = -60; i < w+60; i++) {
      r.tline(i, 150, i+60, 70-Math.sin(i/15-t/30)*15 + Math.sin(i/3)*7 + Math.cos(i/7)*5,
      90,0,100,0)

      
    }
    for(let i = -60; i < w+60; i++) {

      r.tline(i, 180, i+60, 120-Math.sin(i/8+t/110)*20 + Math.sin(i/5)*7 + Math.cos(i/13 + t/17)*5 + Math.cos(i/2)*4,
      110,0,140,0)
    }
    
    

    r.render();
    //r.debugRender();

 
}

function resetGame() {
    window.t = 1;
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
        stats.begin();
        switch (gameState) {
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