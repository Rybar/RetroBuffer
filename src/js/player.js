

const Player = {

    position: {
        x: 0,
        y: 0,
    },

    drawPosition: {
        x: 0,
        y: 0,

    },

    width: 8, height: 8,

    velocity: {
        x: 0,
        y: 0
    },

    accelleration: {
        x: 0,
        y: 0
    }


}
Player.update = function(){

}
Player.draw = function(){
   // onscreen++;
     //screen.x = (object.x - object.y) * 0.5

    //screen.y = (object.x + object.y) * 0.5 
    this.drawPosition.x = Math.round( (this.position.x - this.position.y) * 0.5 )
    this.drawPosition.y = Math.round( (this.position.x + this.position.y) * 0.25 )
    //r.fillRect(this.drawPosition.x-view.x-this.width/2, this.drawPosition.y-view.y-this.height/2, this.width, this.height, 15);
    r.drawTile(1, this.drawPosition.x-view.x-this.width/2, this.drawPosition.y-view.y-this.height/2);
    r.circle(w/2, h/2, 10, 15);
}

export default Player;