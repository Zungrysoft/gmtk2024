import Pickupable from './pickupable.js'
import WaterShot from './waterShot.js'
import * as game from 'game'

export default class Dribbler extends Pickupable {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  sprite = 'dribbler'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  sprinklerTimer = 0
  enabled = true

  constructor(position, direction, isAttached) {
    super(position, isAttached)
    this.direction = direction
  }

  update() {
    super.update()

    if (this.velocity[0] > 0.01) {
      this.direction = 1
    }
    else if (this.velocity[0] < -0.01) {
      this.direction = -1
    }
    this.scale = [1/48 * this.direction, 1/48]

    // Sprinkle water
    if (this.enabled && !this.isPickedUp()) {
      this.sprinklerTimer ++
      if (this.sprinklerTimer % 4 === 0) {
        const vel = [(0.2 + Math.random()*0.1) * this.direction, Math.random() * -0.1]
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