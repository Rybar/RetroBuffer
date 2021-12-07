// assumes r = RetroBuffer,  t=timestep (integer)
//
// This is a collection of graphical demos for the RetroBuffer class.

import { decompressWithModel } from "roadroller";

var Demos = function() {return this};

Demos.prototype.demoPlasma = function() {
    for(i = 0; i < w; i++) {
        for(j = 0; j < h; j++) {
          r.palOffset = 0;
          r.setPalette(0,15, [0,154,167,166,37,162,62,15,114,215,204,48,208,206,121,1])
          let startColorIndex = 0;
          let endColorIndex = 7;
          let speed = t/200;
          let bars = startColorIndex + Math.sin(i/15+speed) * endColorIndex;
          let spinningBars = startColorIndex + Math.sin((i/30*Math.sin(speed)+j/80*Math.cos(speed))+speed) * endColorIndex;
          let cx = i + (90)*Math.sin(t/50) - w/2;
          let cy = j + (90)*Math.cos(t/50) - h/2;
          let concentric = startColorIndex + Math.sin( Math.sqrt(cx*cx + cy*cy) /20 ) * endColorIndex;
    
          let plasma = endColorIndex + (bars + spinningBars + concentric)/3;
          r.cursorColor = Math.floor(plasma);
          r.cursorColor2 = Math.ceil(plasma);
    
          r.pat = r.dither[ Math.round( (plasma % 1) * 15) ];
          
          r.pset(i, j, plasma);
        }
      }
}

Demos.prototype.tileDrawTest = function() {
    for (let i = 0; i < w; i += r.spriteTileset.tileSize.x) {
        for (let j = 0; j < 64; j += r.spriteTileset.tileSize.y) {
            r.palOffset = r.pget(i, j);
            r.drawTile(Math.floor(j / 32), i, 100 + j, r.spriteTileset, 1, false, true);
        }
    }
}

Demos.prototype.tlineRoad = function() {
    for(i = 0; i <= h/2; i++) {
      let wave = Math.sin(i/4+t/50)*10;
      r.palOffset = 0;
      r.tline(wave+w/2-i*1.8, h/2+i, wave+w/2+i*1.8, h/2+i,  0,i,w,i );
      r.palOffset = 25;
      r.tline(w/2-i*1.8, h/2-i, w/2+i*1.8, h/2-i,  0,i,w,i );
    }
}

Demos.prototype.wavyScreen = function() {
    for (let i = 0; i < w; i++) {
        let
            ymod = Math.sin((t + i) / 20) * 10;
        r.sspr(i, 0, 1, h, i, ymod / 2, 1, h + ymod);
    }
}

Demos.prototype.movingCircleField = function() {
    for (let i = 0; i < w + 40; i += 15) {
        for (let j = -20; j < h + 40; j += 15) {
            r.circle(-20 + (i + t) % (w + 40), -20 + (j + t/2) % (h + 30), 5, 120 + ((i+j)/90));
        }
    }
}

Demos.prototype.textDrawTest = function() {
    //[textstring, x, y, hspacing, vspacing, halign, valign, scale, color, offset, delay, frequency]
    let text = ["The Quick Brown Fox Jumped Over The Lazy Dog\nNOW IS THE TIME",
      10, 40, 1,2, "left", "top", 1, 37, 0, 0, 0]
    r.text(text);
}

Demos.prototype.stencilTest = function() {
    r.stencil = true;
    r.palOffset = (16 + t / 10) % 256;
    r.fillCircle(w / 2 + Math.sin(t / 100) * 100, h / 2 + Math.cos(t / 100) * 100, 30, 21);
    r.stencil = false;
    r.circle(w / 2 + Math.sin(t / 100) * 100, h / 2 + Math.cos(t / 100) * 100, 30, 21);
    r.palOffset = 0;
}
    

export default Demos