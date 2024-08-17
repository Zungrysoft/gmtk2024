import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Plant extends Thing {
  validTileTypes = []
  isSprout = true
  isPotted = false
  timeSinceWatered = 0
  variant = 'basic'

  constructor (pos, variant, isSprout) {
    super()
    this.position = pos
    this.variant = variant
    this.isSprout = isSprout
  }

  canBePlantedAt(pos) {
    const tileType = game.getThing('level').getTileAt(pos)
    const soilType = game.getThing('level').getTileAt([pos[0], pos[1]-1])

    // Must be planted in an air tile and on a non-air tile
    if (tileType === 0 && soilType > 0) {
      // Can be planted on any tile
      if (this.validSoilTypes.includes('any')) {
        return true
      }

      // Can be planted on any soil tile
      if (this.validSoilTypes.includes('anySoil') && soilType < 16) {
        return true
      }

      // Has specific soil requirements
      if (this.validSoilTypes.includes(soilType)) {
        return true
      }
    }

    return false
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

  getHitboxes() {
    return []
  }

  collideWithThing (other, position = [undefined, undefined]) {
    if (position[0] === undefined) { position[0] = other.position[0] }
    if (position[1] === undefined) { position[1] = other.position[1] }
    return this.collideWithAabb(other.aabb, position)
  }

  collideWithAabb (aabb, position = [0, 0]) {
    if (this.isSprout) {
      return false
    }

    for (const box of this.getHitboxes()) {
      const collided = u.checkAabbIntersection(box, aabb, [0, 0], position)
      if (collided) {
        return true
      }
    }

    return false
  }
}
