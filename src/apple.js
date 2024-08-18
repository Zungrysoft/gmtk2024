import * as game from 'game'
import * as u from 'utils'
import * as collisionutils from './collisionutils.js'
import Thing from 'thing'

export default class Apple extends Thing {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  isPickupable = true
  scale = 1 / 48

  constructor (position = [0, 0]) {
    super()
    this.position = position
  }

  update () {
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
