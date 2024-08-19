import * as collisionutils from './collisionutils.js'
import * as vec2 from 'vector2'
import * as game from 'game'
import Thing from 'thing'

export default class Pickupable extends Thing {
  aabb = [-0.45, -0.45, 0.45, 0.45]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  isPickupable = true
  isAttached = false
  scale = 1 / 48

  constructor (position = [0, 0], isAttached = false) {
    super()
    this.position = [...position]
    this.startingPosition = [...position]
    this.isAttached = isAttached
  }

  update () {
    const [xLast, yLast] = this.position
    let a = 0
    let r = 1 / 16
    while (this.checkCollision()) {
      this.position[0] = xLast + Math.cos(a) * r
      this.position[1] = yLast + Math.sin(a) * r
      a += Math.PI * 2 / 4
      if (a > Math.PI * 2) {
        a -= Math.PI * 2
        r += r < 0.25 ? 1 / 48 : 0.25
      }
    }

    super.update()
    if (!this.isAttached) {
      this.velocity[1] += 0.005
    }
    if (this.contactDirections.down) {
      this.velocity[0] *= 0.8
    }

    if (this.isAttached && !vec2.equals(this.position, this.startingPosition)) {
      this.isAttached = false
    }
  }

  checkCollision (x = this.position[0], y = this.position[1], z = 0) {
    if (super.checkCollision(x, y, z)) {
      return true
    }
    return collisionutils.checkCollision(this.aabb, x, y, true)
  }

  isPickedUp () {
    return game.getThing('player').pickup === this
  }
}
