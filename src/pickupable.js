import * as collisionutils from './collisionutils.js'
import Thing from 'thing'

export default class Pickupable extends Thing {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  isPickupable = true
  scale = 1 / 48

  constructor (position = [0, 0]) {
    super()
    this.position = [...position]
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
    this.velocity[1] += 0.005
    if (this.contactDirections.down) {
      this.velocity[0] *= 0.8
    }
  }

  checkCollision (x = this.position[0], y = this.position[1], z = 0) {
    if (super.checkCollision(x, y, z)) {
      return true
    }
    return collisionutils.checkCollision(this.aabb, x, y)
  }
}
