//globals r = RetroBuffer, view = {x,y}
import { inView } from './core/utils'
var Sprite = function(x, y, z){
    this.focalLength = 100;
    this.graphic = {
        width: 48,
        height: 48,
        x: 0,
        y: 32
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

Sprite.prototype.draw = function(){
    this.screenTransform.x = this.transform.x - (view.x * this.transform.scale);
    this.screenTransform.y = this.transform.y - (view.y * this.transform.scale);
    this.screenTransform.width = this.graphic.width * this.transform.scale
    this.screenTransform.height = this.graphic.height * this.transform.scale
    var { x, y, width, height} = this.screenTransform;
/*

Screen X = - (resX/2) * (x / z) + (resX/2)
Screen Y = - (resY/2) * (y / z) + (resY/2)

*/

   //if(inView(this.screenTransform, (w/this.transform.scale)/2 ) ){
        r.renderSource = r.PAGE_3;
        r.sspr(this.graphic.x, this.graphic.y, this.graphic.width, this.graphic.height,
        x-width/2,
        y-height/2,
        width, height)
    //}

}

Sprite.prototype.update = function(dt){

}

export default Sprite