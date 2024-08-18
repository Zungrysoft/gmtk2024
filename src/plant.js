import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Plant extends Thing {
  validTileTypes = []
  isSprout = true
  isPotted = false
  timeSinceWatered = Number.MAX_SAFE_INTEGER
  variant = 'basic'
  animations = {
    idle: {
      frames: [0],
      speed: 1,
      frameSize: 48
    },
  }

  constructor (pos, variant, isSprout) {
    super()
    this.position = pos
    this.variant = variant
    this.isSprout = isSprout
  }

  update() {
    this.timeSinceWatered ++
  }

  water() {
    this.timeSinceWatered = 0
  }

  isBeingWatered() {
    return this.timeSinceWatered <= 1
  }

  growUp() {
    this.isSprout = false
  }

  revertToSprout() {
    this.isSprout = true
  }

  getHitBoxes() {
    return []
  }

  getOverlapBoxes() {
    return this.getHitBoxes()
  }

  collideWithThing (other, position = [undefined, undefined]) {
    if (position[0] === undefined) { position[0] = other.position[0] }
    if (position[1] === undefined) { position[1] = other.position[1] }
    return this.collideWithAabb(other.aabb, position)
  }

  collideWithAabb (aabb, position = [0, 0]) {
    for (const box of this.getHitBoxes()) {
      const collided = u.checkAabbIntersection(box, aabb, [0, 0], position)
      if (collided) {
        return true
      }
    }

    return false
  }

  overlapWithThing (other, position = [undefined, undefined]) {
    if (position[0] === undefined) { position[0] = other.position[0] }
    if (position[1] === undefined) { position[1] = other.position[1] }
    return this.overlapWithAabb(other.aabb, position)
  }

  overlapWithAabb (aabb, position = [0, 0]) {
    for (const box of this.getOverlapBoxes()) {
      const collided = u.checkAabbIntersection(box, aabb, [0, 0], position)
      if (collided) {
        return true
      }
    }

    return false
  }
}
