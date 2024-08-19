import Thing from 'thing'
import * as vec2 from 'vector2'

export default class Swipe extends Thing {
  animations = {
    idle: { frames: [0, 1, 2, 3, 4, 5, 6, 7], speed: 0.8, frameSize: 48 }
  }
  scale = 1/48
  canDie = false
  sprite = 'swipe'
  depth = 100

  constructor(player) {
    super()
    this.player = player
  }

  update() {
    super.update()

    this.position = vec2.add(this.player.position, [0.9 * this.player.direction, 0.4])
    this.scale = [this.player.direction * 1/48 * -1, 1/48]
    
    if (Math.floor(this.animationIndex) === 4) {
      this.canDie = true
    }
    if (Math.floor(this.animationIndex) === 0 && this.canDie) {
      this.isDead = true
    }
  }
}
