import Pickupable from './pickupable.js'
import WaterShot from './watershot.js'
import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'

export default class Dribbler extends Pickupable {
  sprite = 'dribbler'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  sprinklerTimer = 0
  enabled = true
  wateredSomethingTime = 0

  constructor(position, direction=1, isAttached) {
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
    if (this.enabled) {
      this.wateredSomethingTime ++
      if (this.shouldWater() && !this.isPickedUp()) {
        this.sprinklerTimer ++
        const player = game.getThing('player')
        const dist = player ? u.distance(player.position, this.position) : Infinity
        if (dist < 20) {
          player.hearsSprinkler = (
            Math.min(player.hearsSprinkler || Infinity, dist / 20)
          )
        }
        if (this.sprinklerTimer % 4 === 0) {
          const vel = [(0.28 + Math.random()*0.1) * this.direction, Math.random() * -0.1]
          game.addThing(new WaterShot(this.position, vel, 0.4, false, this))
        }
      }
    }
    if (this.isPickedUp()) {
      this.enabled = true
    }
  }

  shouldWater() {
    if (this.wateredSomethingTime < 60 * 1) {
      return true
    }
    if (vec2.distance(this.position, game.getThing('player').position) < 25) {
      return true
    }
    return false
  }

  wateredSomething() {
    this.wateredSomethingTime = 0
  }

  deviceTrigger() {
    this.enabled = !this.enabled
  }
}
