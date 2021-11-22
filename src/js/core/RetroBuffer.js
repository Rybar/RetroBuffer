//todo: debug canvas. a 1 to 1 view of all pages


var RetroBuffer = function(width, height, atlas, pages){

    this.WIDTH =     width;
    this.HEIGHT =    height;
    this.PAGESIZE = this.WIDTH *  this.HEIGHT;
    this.PAGES = pages;
    this.atlas = atlas;
  
    this.SCREEN = 0;
    this.PAGE_1= this.PAGESIZE;
    this.PAGE_2= this.PAGESIZE*2;
    this.PAGE_3= this.PAGESIZE*3;
    this.PAGE_4= this.PAGESIZE*4;
  
    //relative drawing position and pencolor, for drawing functions that require it.
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorColor = 15;
    this.cursorColor2 = 0;
    this.palOffset = 0;
    this.stencil = false;
    this.stencilSource = this.PAGE_2;
    this.stencilOffset = 0;
    this.tileset={
      width: 32,
      height: 32,
      tileSource: this.PAGE_3,
      tileOrigin: {x:0, y:16},
      tileSize: {x:8, y:8},
    };
    this.paletteSize = 255;

    //colors is an array of 32bit values representing the palette. Taken from the top row of the atlas.
    this.colors = this.atlas.slice(0, 255);

    //active palette. change values in this array for index-color-mapping
    this.pal = this.fillRange(0, 255);
    //default palette index
    this.palDefault = this.fillRange(0, 256, 0);
  
  
    this.c = document.createElement('canvas');
    this.c.width = this.WIDTH;
    this.c.height = this.HEIGHT;
    this.ctx =             this.c.getContext('2d');
    this.renderTarget =    0x00000;
    this.renderSource =    this.PAGESIZE; //buffer is ahead one screen's worth of pixels

    this.debugCanvas = document.createElement('canvas');
    this.debugCanvas.width = this.WIDTH;
    this.debugCanvas.height = this.HEIGHT*this.PAGES;
    this.debugctx =           this.debugCanvas.getContext('2d');


    this.fontString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()";

    //TODO: Add new pixel font to atlas and refactor text drawing functions to use a portion of atlas, remove hardcoded fontbitmap text

    this.fontBitmap = "11111100011111110001100011111010001111101000111110111111000010000100000111111100100101000110001111101111110000111001000011111111111000"+
    "0111001000010000111111000010111100011111110001100011111110001100011111100100001000010011111111110001000010100101111010001100101110010010100011000"+
    "0100001000010000111111000111011101011000110001100011100110101100111000101110100011000110001011101111010001100101110010000011101000110001100100111"+
    "1111101000111110100011000101111100000111000001111101111100100001000010000100100011000110001100010111010001100011000101010001001000110001101011010"+
    "1011101000101010001000101010001100010101000100001000010011111000100010001000111110010001100001000010001110011101000100010001001111111110000010011"+
    "0000011111010010100101111100010000101111110000111100000111110011111000011110100010111011111000010001000100001000111010001011101000101110011101000"+
    "1011110000101110011101000110001100010111000000000000000000000111110010000100001000000000100111111000110111101011011101010111110101011111010100000"+
    "000000000000000000100001100001000100000000000011011010011001000000000000111010001001100000000100000010001000100010001000000010001000100000100000100001000100001000010000010"

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
  
    this.imageData =   this.ctx.getImageData(0, 0, this.WIDTH, this.HEIGHT),
    this.buf =             new ArrayBuffer(this.imageData.data.length),
    this.buf8 =            new Uint8Array(this.buf),
    this.data =            new Uint32Array(this.buf),
    this.ram =             new Uint8Array(this.WIDTH * this.HEIGHT * this.PAGES);
  
  return this;
  }
 //--------------graphics functions----------------
  RetroBuffer.prototype.clear = function(color, page){
    this.ram.fill(color, page, page + this.PAGESIZE);
  }
  
  RetroBuffer.prototype.setPalette = function(start, end, newIndices){
    for(let i = start; i < end; i++){
      this.pal[i] = newIndices[(i-start)%newIndices.length];
    }
  }
  RetroBuffer.prototype.setPen = function(color, color2, dither=0){
    this.cursorColor = color;
    this.cursorColor2 = color2;
    this.pat=dither;
  }
  
  RetroBuffer.prototype.pset = function(x,y, color, color2=0) { 
    x = x|0;
    y = y|0;
    color = this.stencil ? this.pget(x,y, this.stencilSource)+this.stencilOffset : (color|0)%this.paletteSize;
    let px = (y % 4) * 4 + (x% 4);
    let mask = this.pat & Math.pow(2, px);
    let pcolor = mask ? color+this.palOffset : color2+this.palOffset;
    if(x < 0 | x > this.WIDTH-1) return;
    if(y < 0 | y > this.HEIGHT-1) return;

    this.ram[this.renderTarget + y * this.WIDTH + x] = pcolor;
  }
  
  RetroBuffer.prototype.pget = function(x, y, page=0){ 
    x = x|0;
    y = y|0;
    return this.ram[page + x + y * this.WIDTH];
  }
  
  RetroBuffer.prototype.line = function(x1, y1, x2, y2, color) {
    
    x1 = x1|0,
    x2 = x2|0,
    y1 = y1|0,
    y2 = y2|0;
  
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
    dy <<= 1;        // dy is now 2*dy
    dx <<= 1;        // dx is now 2*dx
  
  this.pset(x1, y1, color);
    if (dx > dy) {
      var fraction = dy - (dx >> 1);  // same as 2*dy - dx
      while (x1 != x2) {
        if (fraction >= 0) {
          y1 += stepy;
          fraction -= dx;          // same as fraction -= 2*dx
        }
        x1 += stepx;
        fraction += dy;              // same as fraction -= 2*dy
        this.pset(x1, y1, color);
      }
      ;
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

  RetroBuffer.prototype.tline = function(x1, y1, x2, y2, offsetX=0, offsetY=0, colorOffset=0) {
    x1 = x1|0,
    x2 = x2|0,
    y1 = y1|0,
    y2 = y2|0;
  
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
    dy <<= 1;        // dy is now 2*dy
    dx <<= 1;        // dx is now 2*dx
  
    var x = x1, y = y1;
    var fraction = dy - (dx >> 1);  // same as 2*dy - dx
    while (x != x2) {
      if (fraction >= 0) {
        y += stepy;
        fraction -= dx; // same as fraction -= 2*dx
      }
      x += stepx;
      fraction += dy;   // same as fraction -= 2*dy
      this.pset(x, y, this.pget(x-offsetX, y-offsetY, this.renderSource)+colorOffset );
    }
    ;
  }
  
  RetroBuffer.prototype.circle = function(xm, ym, r, color) {
    xm = xm|0;
    ym = ym|0;
    r = r|0;
    color = color|0;
    var x = -r, y = 0, err = 2 - 2 * r;
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
  
  RetroBuffer.prototype.fillCircle = function(xm, ym, r, color) {
    xm = xm|0;
    ym = ym|0;
    r = r|0;
    color = color|0;
    if(r < 0) return;
    xm = xm|0; ym = ym|0, r = r|0;
    var x = -r, y = 0, err = 2 - 2 * r;
    /* II. Quadrant */
    do {
      this.line(xm-x, ym-y, xm+x, ym-y, color);
      this.line(xm-x, ym+y, xm+x, ym+y, color);
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
  }

  RetroBuffer.prototype.tfillCircle = function(xm, ym, r, colorOffset=0) {
    xm = xm|0;
    ym = ym|0;
    r = r|0;
    offX = xm - mw //+ r;
    offY = ym - mh //+ r;
    if(r < 0) return;
    xm = xm|0; ym = ym|0, r = r|0;
    var x = -r, y = 0, err = 2 - 2 * r;
    /* II. Quadrant */
    do {
      this.tline(xm -x, ym-y, xm+x, ym-y, offX, offY, colorOffset);
      this.tline(xm-x, ym+y, xm+x, ym+y, offX, offY, colorOffset);
      r = err;
      if (r <= y) err += ++y * 2 + 1;
      if (r > x || err > y) err += ++x * 2 + 1;
    } while (x < 0);
  }
  
  RetroBuffer.prototype.rect = function(x, y, w, h, color=0) {
    let
    x1 = x|0,
    y1 = y|0,
    x2 = (x+w)|0,
    y2 = (y+h)|0;
  
  
    this.line(x1,y1, x2, y1, color);
    this.line(x2, y1, x2, y2, color);
    this.line(x1, y2, x2, y2, color);
    this.line(x1, y1, x1, y2, color);
  }
  
  RetroBuffer.prototype.fillRect = function(x, y, w, h, color) {
    
    let
    x1 = x|0,
    y1 = y|0,
    x2 = ( (x+w)|0 )-1,
    y2 = ((y+h)|0 )-1;
    color = color;
  
    var i = Math.abs(y2 - y1);
    this.line(x1, y1, x2, y1, color);
  
    if(i > 0){
      while (--i) {
        this.line(x1, y1+i, x2, y1+i, color);
      }
    }
  
    this.line(x1,y2, x2, y2, color);
  }
  
  RetroBuffer.prototype.sspr = function(sx = 0, sy = 0, sw = 16, sh = 16, x=0, y=0, dw=32, dh=32, flipx = false, flipy = false){

    var xratio = sw / dw;
    var yratio = sh / dh;
    this.pat = this.dither[0]; //reset pattern
    for(var i = 0; i < dh; i++){
      for(var j = 0; j < dw; j++){

        px = (j*xratio)|0;
        py = (i*yratio)|0;
        sy = flipy ? (sh - py - i) : sy;
        sx = flipx ? (sw - px - j) : sx;
        source = this.pget(sx + px, sy + py, this.renderSource);
        if(source > 0){
          this.pset(x+j, y+i, source);
        }
        

      }
    }
  }
  RetroBuffer.prototype.drawTile = function drawTile(tile, x, y){
    let
    tileX = tile % this.tileset.width,
    tileY = Math.floor(tile / this.tileset.width),
    drawX = this.tileset.tileOrigin.x + (tileX * this.tileset.tileSize.x),
    drawY = this.tileset.tileOrigin.y + (tileY * this.tileset.tileSize.y),
    previousRenderSource = this.renderSource;
    this.renderSource = this.tileset.tileSource;
    this.sspr(drawX, drawY, this.tileset.tileSize.x, this.tileset.tileSize.y, x, y, this.tileset.tileSize.x, this.tileset.tileSize.y, false, false);
    this.renderSource = previousRenderSource;
  }

  
  RetroBuffer.prototype.triangle = function triangle(p1, p2, p3, color) {
    this.line(p1.x, p1.y, p2.x, p2.y, color);
    this.line(p2.x, p2.y, p3.x, p3.y, color);
    this.line(p3.x, p3.y, p1.x, p1.y, color);
    
  }
  
  //from https://www-users.mat.uni.torun.pl//~wrona/3d_tutor/tri_fillers.html
  RetroBuffer.prototype.fillTriangle = function fillTriangle( p1, p2, p3, color) {
    //sort vertices by y, top first
    
    let P = [Object.assign({}, p1), Object.assign({}, p2), Object.assign({}, p3)].sort((a,b) => a.y - b.y);
    let A = P[0], B = P[1], C = P[2],
        dx1 = 0, dx2 = 0, dx3 = 0,
        S = {}, E = {};
  
    if(B.y-A.y > 0) dx1=(B.x-A.x)/(B.y-A.y);
    if(C.y-A.y > 0) dx2=(C.x-A.x)/(C.y-A.y);
    if(C.y-B.y > 0) dx3=(C.x-B.x)/(C.y-B.y);

    
    Object.assign(S, A); Object.assign(E, A);
    if(dx1 > dx2) {
      for(;S.y<=B.y;S.y++,E.y++,S.x+=dx2, E.x+=dx1){
        
        this.line(S.x, S.y, E.x, S.y, color);
      }
      E=B;
      for( ; S.y<=C.y; S.y++, E.y++, S.x+=dx2, E.x+=dx3 )
      this.line(S.x, S.y, E.x, S.y, color);
	  }
    else {
      for( ; S.y<=B.y; S.y++, E.y++, S.x+=dx1, E.x+=dx2) {
        this.line(S.x, S.y, E.x, S.y, color);
      }
      S=B;
      for( ; S.y<=C.y; S.y++, E.y++, S.x+=dx3, E.x+=dx2){
        this.line(S.x, S.y, E.x, S.y, color);
      }
	  }
  }
  
  RetroBuffer.prototype.atlasToRam = function (imageBuffer, bufferWidth, bufferHeight, address) {

         for(var j = 0; j < bufferHeight; j++) {
            for(var i = 0; i < bufferWidth; i++) {
           
             this.ram[address + j * this.WIDTH + i] = this.colors.indexOf(imageBuffer[j * bufferWidth + i]);
           }
         }
  }
  
  RetroBuffer.prototype.render = function () {
  
    var i = this.PAGESIZE;  // display is first page of ram
  
    while (i--) {
      /*
      data is 32bit view of final screen buffer
      for each pixel on screen, we look up it's color and assign it
      */
     if(i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];
  
    }
  
    this.imageData.data.set(this.buf8);
    this.c.width = this.c.width;
    this.ctx.putImageData(this.imageData, 0, 0);
  
  }

  RetroBuffer.prototype.debugRender = function() {
    this.debugCanvas.width = this.debugCanvas.width;

    for(let j = 0; j < this.PAGES; j++){

      renderTarget = this.SCREEN;
      this.renderSource = j * this.PAGESIZE;
      this.ram.copyWithin(this.renderTarget, this.renderSource, this.renderSource + this.PAGESIZE);

      
      let i = this.PAGESIZE;  // display is first page of ram
  
      while (i--) {
        if(i > 0) this.data[i] = this.colors[this.pal[this.ram[i]]];
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
//options 9-11 are for animating the text per-character. just sin motion
9: per character offset
10: delay, higher is slower
11: frequency
*/
RetroBuffer.prototype.textLine = function textLine(o) {

	var textLength = o[0].length,
		size = 5;

	for (var i = 0; i < textLength; i++) {

		var letter = [];
		letter = this.getCharacter( o[0].charAt(i) );

		for (var y = 0; y < size; y++) {
			for (var x = 0; x < size; x++) {
				if (letter[y*size+x] == 1){
					if(o[4] == 1){
            let cx = 0;
            let cy = 0;
						this.pset(
							o[1] + ( x * o[4] ) + ( ( size * o[4] ) + o[3] ) * i,
              ( o[2] + (y * o[4]) )|0,
              o[5]
              );
					}

					else {
            let cx = o[1] + ( x * o[4] ) + ( ( size * o[4] ) + o[3] ) * i;
            let cy = ( o[2] + (y * o[4]) )|0
						this.fillRect( cx, cy, o[4], o[4], o[5]);
					}

				} //end draw routine
			}  //end x loop
		}  //end y loop
	}  //end text loop
}  //end textLine()

RetroBuffer.prototype.text = function text(o) {
 var size = 5,
 letterSize = size * o[7],
 lines = o[0].split('\n'),
 linesCopy = lines.slice(0),
 lineCount = lines.length,
 longestLine = linesCopy.sort(function (a, b) {
   return b.length - a.length;
 })[0],
 textWidth = ( longestLine.length * letterSize ) + ( ( longestLine.length - 1 ) * o[3] ),
 textHeight = ( lineCount * letterSize ) + ( ( lineCount - 1 ) * o[4] );

 if(!o[5])o[5] = 'left';
 if(!o[6])o[6] = 'bottom';

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
       lineWidth = ( line.length * letterSize ) + ( ( line.length - 1 ) * o[3] ),
       x = o[1],
       y = o[2] + ( letterSize + o[4] ) * i;

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
       line,
       x,
       y,
       o[3],
       o[7],
       o[8]
     ]);
   }

 return {
   sx: sx,
   sy: sy,
   cx: cx,
   cy: cy,
   ex: ex,
   ey: ey,
   width: textWidth,
   height: textHeight
 }
}

RetroBuffer.prototype.getCharacter = function getCharacter(char){
 index = this.fontString.indexOf(char);
 return this.fontBitmap.substring(index * 25, index*25+25).split('') ;
}

RetroBuffer.prototype.fillRange = (start, end) => {
  return Array(end - start + 1).fill().map((item, index) => start + index);
};
  
  export default RetroBuffer;