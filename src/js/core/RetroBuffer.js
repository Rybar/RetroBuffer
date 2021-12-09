//todo: debug canvas. a 1 to 1 view of all pages
import { inView } from '/js/core/utils.js'

var RetroBuffer = function(width, height, atlas, pages=5) {

        this.WIDTH = width;
        this.HEIGHT = height;
        this.PAGESIZE = this.WIDTH * this.HEIGHT;
        this.PAGES = pages;
        this.atlas = atlas;
        //TODO:  dynamically set page consts based on number of buffer pages
        this.SCREEN = 0;
        this.PAGE_1 = this.PAGESIZE;
        this.PAGE_2 = this.PAGESIZE * 2;
        this.PAGE_3 = this.PAGESIZE * 3;
        this.PAGE_4 = this.PAGESIZE * 4;

        //relative drawing position and pencolor, for drawing functions that require it.
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorColor = 15;
        this.cursorColor2 = 0;
        this.palOffset = 0;
        this.stencil = false;
        this.stencilSource = this.PAGE_2;
        this.mapSource = this.PAGE_4;
        this.stencilOffset = 0;

        this.spriteTileset = {
            width: 32,
            height: 1,
            tileSource: this.PAGE_3,
            tileOrigin: { x: 0, y: 24 },
            tileSize: { x: 8, y: 8 },
        };

        this.fontTileset = {
            width: 51,
            height: 2,
            tileSource: this.PAGE_3,
            tileOrigin: { x: 0, y: 8 },
            tileSize: { x: 5, y: 8 },
        };

        this.paletteSize = 255; //ram is Uint8, so this can't be higher than 255.
        this.tilesets = [this.spriteTileset, this.fontTileset];

        //colors is an array of 32bit values representing the palette. Taken from the top of the atlas.
        this.colors = this.atlas.slice(0, this.paletteSize);

        //active palette. change values in this array for index-color-mapping
        this.pal = this.fillRange(0, 255);
        //default palette index
        this.palDefault = this.fillRange(0, this.paletteSize, 0);


        this.c = document.createElement('canvas');
        this.c.width = this.WIDTH;
        this.c.height = this.HEIGHT;
        this.ctx = this.c.getContext('2d');
        this.renderTarget = 0x00000;
        this.renderSource = this.PAGESIZE; //buffer is ahead one screen's worth of pixels

        this.debugCanvas = document.createElement('canvas');
        this.debugCanvas.width = this.WIDTH;
        this.debugCanvas.height = this.HEIGHT * this.PAGES;
        this.debugctx = this.debugCanvas.getContext('2d');


        this.fontString = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$.'"?/<()`;


        
        //TODO: Can the dither table be added to the atlas too and read-in at init?
        this.dither = [
            0b1111111111111111,
            0b1111111111110111,
            0b1111110111110111,
            0b1111110111110101,
            0b1111010111110101,
            0b1111010110110101,
            0b1110010110110101,
            0b1110010110100101,
            0b1010010110100101,
            0b1010010110100001,
            0b1010010010100001,
            0b1010010010100000,
            0b1010000010100000,
            0b1010000000100000,
            0b1000000000100000,
            0b1000000000000000,
            0b0000000000000000,
            0b1111100110011111,
            0b0000011001100000,
            0b1111100010001000,
        ];

        this.pat = 0b1111111111111111;


        this.ctx.imageSmoothingEnabled = false;

        this.imageData = this.ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT),
            this.buf = new ArrayBuffer(this.imageData.data.length),
            this.buf8 = new Uint8Array(this.buf),
            this.data = new Uint32Array(this.buf),
            this.ram = new Uint8Array(this.WIDTH * this.HEIGHT * this.PAGES);

        return this;
    }
    //--------------graphics functions----------------
RetroBuffer.prototype.clear = function(color, page) {
    this.ram.fill(color, page, page + this.PAGESIZE);
}

RetroBuffer.prototype.setPalette = function(start, end, newIndices) {
    for (let i = start; i < end; i++) {
        this.pal[i] = newIndices[(i - start) % newIndices.length];
    }
}
RetroBuffer.prototype.setPen = function(color, color2, dither = 0) {
    this.cursorColor = color;
    this.cursorColor2 = color2;
    this.pat = dither;
}

RetroBuffer.prototype.pset = function(x, y, color = this.cursorColor, color2 = this.cursorColor2) {
    x = x | 0;
    y = y | 0;
    color = this.stencil ? this.pget(x, y, this.stencilSource) : (color | 0) % this.paletteSize;
    let px = (y % 4) * 4 + (x % 4);
    let mask = this.pat & Math.pow(2, px);
    let pcolor = mask ? color + this.palOffset : color2 + this.palOffset;
    if (x < 0 | x > this.WIDTH - 1) return;
    if (y < 0 | y > this.HEIGHT - 1) return;

    this.ram[this.renderTarget + y * this.WIDTH + x] = pcolor;
}

RetroBuffer.prototype.pget = function(x, y, page = 0) {
    x = x | 0;
    y = y | 0;
    return this.ram[page + x + y * this.WIDTH];
}

RetroBuffer.prototype.line = function(x1, y1, x2, y2, color=this.cursorColor) {

    x1 = x1 | 0,
        x2 = x2 | 0,
        y1 = y1 | 0,
        y2 = y2 | 0;

    var dy = (y2 - y1);
    var dx = (x2 - x1);
    var stepx, stepy;

    if (dy < 0) {
        dy = -dy;
        stepy = -1;
    } else {
        stepy = 1;
    }
    if (dx < 0) {
        dx = -dx;
        stepx = -1;
    } else {
        stepx = 1;
    }
    dy <<= 1; // dy is now 2*dy
    dx <<= 1; // dx is now 2*dx

    this.pset(x1, y1, color);
    if (dx > dy) {
        var fraction = dy - (dx >> 1); // same as 2*dy - dx
        while (x1 != x2) {
            if (fraction >= 0) {
                y1 += stepy;
                fraction -= dx; // same as fraction -= 2*dx
            }
            x1 += stepx;
            fraction += dy; // same as fraction -= 2*dy
            this.pset(x1, y1, color);
        };
    } else {
        fraction = dx - (dy >> 1);
        while (y1 != y2) {
            if (fraction >= 0) {
                x1 += stepx;
                fraction -= dy;
            }
            y1 += stepy;
            fraction += dx;
            this.pset(x1, y1, color);
        }
    }

}

RetroBuffer.prototype.tline = function(x1, y1, x2, y2, tx1, ty1, tx2, ty2) {
  var color = this.pget(tx1, ty1, this.renderSource);
  x1 = Math.round(x1);
      x2 = Math.round(x2);
      y1 = Math.round(y1);
      y2 = Math.round(y2);
      tx1 = Math.round(tx1);
      tx2 = Math.round(tx2);
      ty1 = Math.round(ty1);
      ty2 = Math.round(ty2);

  var dy = (y2 - y1);
  var dx = (x2 - x1);
  var tdx = (tx2 - tx1);
  var tdy = (ty2 - ty1);
  var startX = x1;
  var startY = y1;
  var stepx, stepy, tstepx, tstepy, ratioX, ratioY, tx, ty;

//source line increment
  if (dy < 0) {
      dy = -dy;
      stepy = -1;
  } else {
      stepy = 1;
  }
  if (dx < 0) {
      dx = -dx;
      stepx = -1;
  } else {
      stepx = 1;
  }
  //source line increment
  if (tdy < 0) {
    tdy = -tdy;
    tstepy = -1;
} else {
    tstepy = 1;
}
if (tdx < 0) {
    tdx = -tdx;
    tstepx = -1;
} else {
    tstepx = 1;
}
  var ody = dy;
  var odx = dx;
  dy <<= 1; // dy is now 2*dy
  dx <<= 1; // dx is now 2*dx

  this.pset(x1, y1, color);
  if (dx > dy) {
      var fraction = dy - (dx >> 1); // same as 2*dy - dx
      while (x1 != x2) {
          if (fraction >= 0) {
              y1 += stepy;
              fraction -= dx; // same as fraction -= 2*dx
          }
          x1 += stepx;
          fraction += dy; // same as fraction -= 2*dy

          ratioX = (startX -x1)/odx;
          ratioX = ratioX < 0 ? ratioX *= -1 : ratioX;
          ratioY = (startY -y1)/ody;
          ratioY = ratioY < 0 ? ratioY *= -1 : ratioY;
          tx = tstepx > 0 ? tx1 + tdx * ratioX : tx1 - tdx * ratioX;
          ty = tstepy > 0 ? ty1 + tdy * ratioX : ty1 - tdy * ratioX;
         
          color = this.pget(tx, ty, this.renderSource);
          this.pset(x1, y1, color);
      };
  } else {
      fraction = dx - (dy >> 1);
      while (y1 != y2) {
          if (fraction >= 0) {
              x1 += stepx;
              fraction -= dy;
          }
          y1 += stepy;
          fraction += dx;

          ratioX = (startX -x1)/odx;
          ratioX = ratioX < 0 ? ratioX *= -1 : ratioX;
          ratioY = (startY -y1)/ody;
          ratioY = ratioY < 0 ? ratioY *= -1 : ratioY;
          tx = tstepx > 0 ? tx1 + tdx * ratioY : tx1 - tdx * ratioY;
          ty = tstepy > 0 ? ty1 + tdy * ratioY : ty1 - tdy * ratioY;
         
          color = this.pget(tx, ty, this.renderSource);
          this.pset(x1, y1, color);
      }
  }

}

RetroBuffer.prototype.circle = function(xm, ym, r, color) {
    xm = xm | 0;
    ym = ym | 0;
    r = r | 0;
    color = color | 0;
    var x = -r,
        y = 0,
        err = 2 - 2 * r;
    /* II. Quadrant */
    do {
        this.pset(xm - x, ym + y, color);
        /*   I. Quadrant */
        this.pset(xm - y, ym - x, color);
        /*  II. Quadrant */
        this.pset(xm + x, ym - y, color);
        /* III. Quadrant */
        this.pset(xm + y, ym + x, color);
        /*  IV. Quadrant */
        r = err;
        if (r <= y) err += ++y * 2 + 1;
        /* e_xy+e_y < 0 */
        if (r > x || err > y) err += ++x * 2 + 1;
        /* e_xy+e_x > 0 or no 2nd y-step */

    } while (x < 0);
}

RetroBuffer.prototype.fillCircle = function(xm, ym, r, color=this.cursorColor) {
    xm = xm | 0;
    ym = ym | 0;
    r = r | 0;
    color = color | 0;
    if (r < 0) return;
    xm = xm | 0;
    ym = ym | 0, r = r | 0;
    var x = -r,
        y = 0,
        err = 2 - 2 * r;
    /* II. Quadrant */
    do {
        this.line(xm - x, ym - y, xm + x, ym - y, color);
        this.line(xm - x, ym + y, xm + x, ym + y, color);
        r = err;
        if (r <= y) err += ++y * 2 + 1;
        if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
}

RetroBuffer.prototype.rect = function(x, y, w, h, color = 0) {
    let
        x1 = x | 0,
        y1 = y | 0,
        x2 = (x + w) | 0,
        y2 = (y + h) | 0;

    this.line(x1, y1, x2, y1, color);
    this.line(x2, y1, x2, y2, color);
    this.line(x1, y2, x2, y2, color);
    this.line(x1, y1, x1, y2, color);
}

RetroBuffer.prototype.fillRect = function(x, y, w, h, color) {

    let
        x1 = x | 0,
        y1 = y | 0,
        x2 = ((x + w) | 0) - 1,
        y2 = ((y + h) | 0) - 1;
    color = color;

    var i = Math.abs(y2 - y1);
    this.line(x1, y1, x2, y1, color);

    if (i > 0) {
        while (--i) {
            this.line(x1, y1 + i, x2, y1 + i, color);
        }
    }

    this.line(x1, y2, x2, y2, color);
}

RetroBuffer.prototype.sspr = function(sx = 0, sy = 0, sw = 16, sh = 16, x = 0, y = 0, dw = 32, dh = 32, flipx = false, flipy = false) {

    var xratio = sw / dw;
    var yratio = sh / dh;
    this.pat = this.dither[0]; //reset pattern
    for (var i = 0; i < dh; i++) {
        for (var j = 0; j < dw; j++) {
            px = (j * xratio) | 0;
            py = (i * yratio) | 0;
            px = flipx ? dw - px - 1 : px;
            py = flipy ? dh - py - 1 : py;
            source = this.pget(sx + px, sy + py, this.renderSource);
            if (source > 0) {
                this.pset(x + j, y + i, source);
            }
        }
    }
}
RetroBuffer.prototype.drawTile = function drawTile(tile, x, y, tileset=this.spriteTileset, scale=1, flipx = false, flipy = false) {
    //console.log(tileset);
    let
        tileX = tile % tileset.width,
        tileY = Math.floor(tile / tileset.width),
        drawX = tileset.tileOrigin.x + (tileX * tileset.tileSize.x),
        drawY = tileset.tileOrigin.y + (tileY * tileset.tileSize.y),
        previousRenderSource = this.renderSource;
    this.renderSource = tileset.tileSource;
    this.sspr(drawX, drawY, tileset.tileSize.x, tileset.tileSize.y, x, y, tileset.tileSize.x*scale, tileset.tileSize.y*scale, flipx, flipy);
    this.renderSource = previousRenderSource;
}
RetroBuffer.prototype.drawMap = function(map) {
    let tileWidth = this.spriteTileset.tileSize.x;
    let tileHeight = this.spriteTileset.tileSize.y;
    let left = Math.floor(view.x/tileWidth);
    let right = left + Math.floor(w/tileWidth) + 1;
    let top = Math.floor(view.y/tileHeight);
    let bottom = top + Math.floor(h/tileHeight) + 1;

    //this optimization doesn't play nice at the maps edges for scrolling camera past bounds. 
    for(let i = left; i < right; i++){
        for(let j = top; j < bottom; j++){
            
            this.drawTile(this.ram[this.mapSource + i * this.WIDTH + j], i*tileWidth-view.x, j*tileHeight-view.y)
        }
    }
}

RetroBuffer.prototype.triangle = function triangle(p1, p2, p3, color) {
    this.line(p1.x, p1.y, p2.x, p2.y, color);
    this.line(p2.x, p2.y, p3.x, p3.y, color);
    this.line(p3.x, p3.y, p1.x, p1.y, color);

}

//from https://www-users.mat.uni.torun.pl//~wrona/3d_tutor/tri_fillers.html
RetroBuffer.prototype.fillTriangle = function fillTriangle(p1, p2, p3, color) {
    //sort vertices by y, top first

    let P = [Object.assign({}, p1), Object.assign({}, p2), Object.assign({}, p3)].sort((a, b) => a.y - b.y);
    let A = P[0],
        B = P[1],
        C = P[2],
        dx1 = 0,
        dx2 = 0,
        dx3 = 0,
        S = {},
        E = {};

    if (B.y - A.y > 0) dx1 = (B.x - A.x) / (B.y - A.y);
    if (C.y - A.y > 0) dx2 = (C.x - A.x) / (C.y - A.y);
    if (C.y - B.y > 0) dx3 = (C.x - B.x) / (C.y - B.y);


    Object.assign(S, A);
    Object.assign(E, A);
    if (dx1 > dx2) {
        for (; S.y <= B.y; S.y++, E.y++, S.x += dx2, E.x += dx1) {

            this.line(S.x, S.y, E.x, S.y, color);
        }
        E = B;
        for (; S.y <= C.y; S.y++, E.y++, S.x += dx2, E.x += dx3)
            this.line(S.x, S.y, E.x, S.y, color);
    } else {
        for (; S.y <= B.y; S.y++, E.y++, S.x += dx1, E.x += dx2) {
            this.line(S.x, S.y, E.x, S.y, color);
        }
        S = B;
        for (; S.y <= C.y; S.y++, E.y++, S.x += dx3, E.x += dx2) {
            this.line(S.x, S.y, E.x, S.y, color);
        }
    }
}

RetroBuffer.prototype.atlasToRam = function(imageBuffer, bufferWidth, bufferHeight, address) {

    for (var j = 0; j < bufferHeight; j++) {
        for (var i = 0; i < bufferWidth; i++) {

            this.ram[address + j * this.WIDTH + i] = this.colors.indexOf(imageBuffer[j * bufferWidth + i]);
        }
    }
}

RetroBuffer.prototype.render = function() {

    var i = this.PAGESIZE; // display is first page of ram

    while (i--) {
        /*
        data is 32bit view of final screen buffer
        for each pixel on screen, we look up it's color and assign it
        */
        if (i >= 0) this.data[i] = this.colors[this.pal[this.ram[i]]];

    }

    this.imageData.data.set(this.buf8);
    this.c.width = this.c.width;
    this.ctx.putImageData(this.imageData, 0, 0);

}

RetroBuffer.prototype.debugRender = function() {
    this.debugCanvas.width = this.debugCanvas.width;

    for (let j = 0; j < this.PAGES; j++) {

        renderTarget = this.SCREEN;
        this.renderSource = j * this.PAGESIZE;
        this.ram.copyWithin(this.renderTarget, this.renderSource, this.renderSource + this.PAGESIZE);


        let i = this.PAGESIZE; // display is first page of ram

        while (i--) {
            if (i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];
        }
        this.imageData.data.set(this.buf8);
        this.debugctx.putImageData(this.imageData, 0, this.HEIGHT * j);

    }


}

//o is an array of options with the following structure:
/* [textstring, x, y, hspacing, vspacing, halign, valign, scale, color, offset, delay, frequency]
0: text
1: x
2: y
3: hspacing
4: vspacing
5: halign
6: valign
7: scale
8: color
*/
RetroBuffer.prototype.textLine = function textLine(o) {
  let originalPalOffset = this.palOffset;
  this.palOffset = -16 + o[5];
  //console.log(o)
  for (var i = 0; i < o[0].length; i++) {
      var letter = this.getCharacter(o[0].charAt(i));
      let lx = o[1] + (o[3] * i) + (i * this.fontTileset.tileSize.x)*o[4];
      let ly = o[2] 
      this.drawTile(letter, lx, ly, this.fontTileset, o[4], false, false);
  } //end text loop
  this.palOffset = originalPalOffset;
} //end textLine()

RetroBuffer.prototype.text = function text(o) {
    var size = this.fontTileset.tileSize.y,
        letterSize = size * o[7],
        lines = o[0].split('\n'),
        linesCopy = lines.slice(0),
        lineCount = lines.length,
        longestLine = linesCopy.sort(function(a, b) {
            return b.length - a.length;
        })[0],
        textWidth = (longestLine.length * letterSize) + ((longestLine.length - 1) * o[3]),
        textHeight = (lineCount * letterSize) + ((lineCount - 1) * o[4]);

    if (!o[5]) o[5] = 'left';
    if (!o[6]) o[6] = 'bottom';

    var sx = o[1],
        sy = o[2],
        ex = o[1] + textWidth,
        ey = o[2] + textHeight;

    if (o[5] == 'center') {
        sx = o[1] - textWidth / 2;
        ex = o[1] + textWidth / 2;
    } else if (o[5] == 'right') {
        sx = o[1] - textWidth;
        ex = o[1];
    }

    if (o[6] == 'center') {
        sy = o[2] - textHeight / 2;
        ey = o[2] + textHeight / 2;
    } else if (o[6] == 'bottom') {
        sy = o[2] - textHeight;
        ey = o[2];
    }

    var cx = sx + textWidth / 2,
        cy = sy + textHeight / 2;

    for (var i = 0; i < lineCount; i++) {
        var line = lines[i],
            lineWidth = (line.length * letterSize) + ((line.length - 1) * o[3]),
            x = o[1],
            y = o[2] + (letterSize + o[4]) * i;

        if (o[5] == 'center') {
            x = o[1] - lineWidth / 2;
        } else if (o[5] == 'right') {
            x = o[1] - lineWidth;
        }

        if (o[6] == 'center') {
            y = y - textHeight / 2;
        } else if (o[6] == 'bottom') {
            y = y - textHeight;
        }

        this.textLine([
            line, //0
            x,    //1
            y,    //2
            o[3], //3
            o[7], //4
            o[8]  //5
        ]);
    }
}

RetroBuffer.prototype.getCharacter = function getCharacter(char) {
    index = this.fontString.indexOf(char);
    return index;
    
}

RetroBuffer.prototype.fillRange = (start, end) => {
    return Array(end - start + 1).fill().map((item, index) => start + index);
};

RetroBuffer.prototype.setColorBlend = function(colorFloat) {
    this.cursorColor = Math.floor(colorFloat);
    this.cursorColor2 = Math.ceil(colorFloat);
    this.pat = this.dither[ Math.round( (colorFloat % 1) * 15 )];
    return {color1: this.cursorColor, color2: this.cursorColor2, pat: this.pat};
}

export default RetroBuffer;