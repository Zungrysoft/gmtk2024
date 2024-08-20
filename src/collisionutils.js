import * as game from 'game'
import * as u from 'utils'
import Plant from './plant.js'
import LaserField from './laserfield.js'
import Fertilizer from './fertilizer.js'

export function checkWorldPointCollision (x, y) {
  if (game.getThing('level').checkWorldTileCollision(x, y)) {
    return true
  }
}

export function checkCollision (aabb, x, y, collideWithLaserField=false, isPickupable=false) {
  for (const thing of game.getThingsInAabb(aabb, [x, y])) {
    if (thing.collideWithAabb) {
      const thingHit = thing.collideWithAabb(aabb, [x, y])
      if (thingHit) {
        return true
      }
    }
    if (thing instanceof LaserField && collideWithLaserField === true) {
      const collided = u.checkAabbIntersection(aabb, thing.aabb, [x, y], thing.position)
      if (collided) {
        return true
      }
    }
  }

  let [wl, hu, wr, hd] = aabb

  // Stupid hack
  if (isPickupable) {
    const amt = 0.15
    wl += amt
    // hu += amt
    wr -= amt
    // hd -= amt
  }

  return (
    checkWorldPointCollision(x + wr, y) ||
    checkWorldPointCollision(x + wl, y) ||
    checkWorldPointCollision(x, y + hd) ||
    checkWorldPointCollision(x, y + hu) ||
    checkWorldPointCollision(x + wr, y + hd) ||
    checkWorldPointCollision(x + wl, y + hd) ||
    checkWorldPointCollision(x + wr, y + hu) ||
    checkWorldPointCollision(x + wl, y + hu)
  )
}
