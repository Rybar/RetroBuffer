

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
    onscreen++;
     //screen.x = (object.x - object.y) * 0.5

    //screen.y = (object.x + object.y) * 0.5 
    this.drawPosition.x = (this.position.x - this.position.y) * 0.5
    this.drawPosition.y = (this.position.x + this.position.y) * 0.5
    r.fillRect(this.drawPosition.x-view.x-this.width/2, this.drawPosition.y-view.y-this.height/2, this.width, this.height, 15);
}

export default Player;