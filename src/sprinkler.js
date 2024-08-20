import Pickupable from './pickupable.js'
import WaterShot from './waterShot.js'
import * as vec2 from 'vector2'
import * as game from 'game'
import * as u from 'utils'

export default class Sprinkler extends Pickupable {
  sprite = 'sprinkler'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  sprinklerTimer = 0
  enabled = true
  wateredSomethingTime = 0

  constructor(position, power=1, isAttached=false) {
    super(position, isAttached)
    this.power = power
  }

  update() {
    super.update()

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
        if (this.sprinklerTimer % 3 === 0) {
          let vel = vec2.scale(vec2.normalize([
            Math.sin(this.sprinklerTimer / 25) * 0.6,
            Math.random()*-0.2 - 0.4
          ]), 0.4)
          vel[1] *= this.power
          game.addThing(new WaterShot(this.position, vel, 0.4, false, this))
        }
      }
    }
    if (this.isPickedUp()) {
      this.enabled = true
    }
  }

  shouldWater() {
    if (this.wateredSomethingTime < 60 * 15) {
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
