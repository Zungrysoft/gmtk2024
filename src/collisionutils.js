import * as game from 'game'
import * as u from 'utils'
import Plant from './plant.js'
import LaserField from './laserfield.js'
import Fertilizer from './fertilizer.js'
import PlantHedge from './planthedge.js'

export function checkWorldPointCollision (x, y) {
  if (game.getThing('level').checkWorldTileCollision(x, y)) {
    return true
  }
}

export function checkCollision (aabb, x, y, collideWithLaserField=false, isPickupable=false) {
  for (const thing of game.getThingsInAabb(aabb, [x, y])) {
    if (thing.collideWithAabb) {
      const useAabb = [...aabb]

      // Stupid hack to make hedges able to push pickupables off ledges
      if (isPickupable && thing instanceof PlantHedge) {
        const amt = 0.15
        useAabb[0] -= amt
        useAabb[2] += amt
      }

      const thingHit = thing.collideWithAabb(useAabb, [x, y])
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
