

const Player = {

    position: {
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
Player.update = function(dt){

}
Player.draw = function(dt){
   
    r.fillRect(this.position.x-view.x-this.width/2, this.position.y-view.y-this.height/2, this.width, this.height, 15);
}

export default Player;