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

  update() {
    super.update()

    // Sprinkle water
    if (this.enabled && !this.isPickedUp()) {
      this.sprinklerTimer ++
      if (this.sprinklerTimer % 3 === 0) {
        const vel = vec2.scale(vec2.normalize([
          Math.sin(this.sprinklerTimer / 25) * 0.6,
          Math.random()*-0.2 - 0.4
        ]), 0.4)
        game.addThing(new WaterShot(this.position, vel, 0.4))
      }
    }
    if (this.isPickedUp()) {
      this.enabled = true
    }
  }

  deviceTrigger() {
    this.enabled = !this.enabled
  }
}
