import * as collisionutils from './collisionutils.js'
import * as vec2 from 'vector2'
import * as game from 'game'
import Thing from 'thing'

export default class Pickupable extends Thing {
  aabb = [-0.3, -0.45, 0.3, 0.45]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  isPickupable = true
  isAttached = false
  scale = 1 / 48
  wasPickedUp = false

  constructor (position = [0, 0], isAttached = false) {
    super()
    this.position = [...position]
    this.startingPosition = [...position]
    this.isAttached = isAttached
  }

  update () {

    const player = game.getThing('player')

    // Move
    if (this.isPickedUp()) {
      // If item is currently held, it will try to move towards the player's hands
      let desiredPosition = [
        player.position[0] + player.direction * 0.8,
        player.position[1],
      ]

      // If desired position is blocked, use backup desired position of holding the item close to the chest
      const desiredDist = vec2.distance(this.position, desiredPosition)
      const middlePosition = vec2.lerp(this.position, desiredPosition, 0.5)
      if (desiredDist > 0.5 && collisionutils.checkCollision(this.aabb, ...desiredPosition, true, true)) {
        desiredPosition = [
          Math.floor(player.position[0]) + 0.5,
          player.position[1],
        ]
      }
      if (desiredDist > 1.2 && collisionutils.checkCollision(this.aabb, ...middlePosition, true, true)) {
        desiredPosition = [
          Math.floor(player.position[0]) + 0.5,
          player.position[1],
        ]
      }

      // If it is STILL blocked, use a position just behind the player
      // if (collisionutils.checkCollision(this.aabb, ...desiredPosition, true, true)) {
      //   desiredPosition = [
      //     player.position[0] + player.direction * -0.2,
      //     player.position[1],
      //   ]
      // }

      this.velocity = vec2.scale(vec2.subtract(desiredPosition, this.position), 0.8)
    }
    else if (this.wasPickedUp) {
      // If item is dropped, inherit player's velocity for throwing
      this.velocity = [...player.velocity]
    }
    this.wasPickedUp = this.isPickedUp()

    this.getUnstuck()

    super.update()
    
    if (!this.isAttached && !this.isPickedUp()) {
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
    return collisionutils.checkCollision(this.aabb, x, y, true, true)
  }

  getUnstuck() {
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
  }

  isPickedUp () {
    return game.getThing('player').pickup === this
  }
}
