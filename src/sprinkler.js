import Pickupable from './pickupable.js'
import WaterShot from './waterShot.js'
import * as vec2 from 'vector2'
import * as game from 'game'

export default class Sprinkler extends Pickupable {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  sprite = 'sprinkler'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  sprinklerTimer = 0
  enabled = true
  isDevice = true

  update() {
    super.update()

    // Sprinkle water
    const isPickedUp = game.getThing('player').pickup === this
    if (this.enabled && !isPickedUp) {
      this.sprinklerTimer ++
      if (this.sprinklerTimer % 3 === 0) {
        const vel = vec2.scale(vec2.normalize([
          Math.sin(this.sprinklerTimer / 25) * 0.6,
          Math.random()*-0.2 - 0.4
        ]), 0.4)
        game.addThing(new WaterShot(this.position, vel, 0.4))
      }
    }
    
  }
}