//globals r = RetroBuffer, view = {x,y}
import { inView, inView3D, rand } from './core/utils'
var Sprite = function(x, y, z){
    this.focalLength = 50;
    this.graphic = {
        width: 48,
        height: 48,
        x: 0,
        y: 32,
        color: 0
    }
    this.start = {
        x: x, y: y, z: z
    }
    this.transform = {
        x: x,
        y: y,
        z: z,
        angle: 0,
        scale: this.focalLength / (this.focalLength + z)
    }
    this.screenTransform = {
        x: x,
        y: y,
        width: 48,
        height: 48

    }
    
    return this;
}
3
Sprite.prototype.draw = function(){

    this.screenTransform.x = (w/2) + (this.transform.x - view.x) * this.transform.scale;
    this.screenTransform.y = (h/2) + (this.transform.y - view.y) * this.transform.scale;
    //console.log(h, w);
    this.screenTransform.width = this.graphic.width * this.transform.scale
    this.screenTransform.height = this.graphic.height * this.transform.scale
    var { x, y, width, height} = this.screenTransform;

   if(inView3D(this.transform, w/2*1/this.transform.scale) ){
        r.renderSource = r.PAGE_3;
        r.palOffset = this.graphic.color;
        r.setPen(0,121, r.dither[16 - Math.floor(this.transform.scale * 16 )]);
        r.sspr(this.graphic.x, this.graphic.y, this.graphic.width, this.graphic.height,
        x-width/2,
        y-height/2,
        width, height)
        r.palOffset = 0;
        onscreen++;
    }

}

Sprite.prototype.update = function(dt){
//this.transform.z = this.start.z + Math.sin(t/100) * 100;
//this.transform.y = this.start.y + Math.cos(t/100) * 100;
//this.transform.x + this.start.x + Math.sin(t/100) * 100;
//this.focalLength = 100 + Math.sin(t/100) * 100;
//this.transform.scale = this.focalLength / (this.focalLength + this.transform.z)
//this.transform.y += dt/1000;
}

export default Sprite