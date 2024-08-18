import * as game from 'game'
import Plant from './plant.js'

export function checkWorldPointCollision (x, y) {
  if (game.getThing('level').checkWorldTileCollision(x, y)) {
    return true
  }
}

export function checkCollision (aabb, x, y) {
  for (const plant of game.getThingsInAabb(aabb, [x, y])) {
    if (!(plant instanceof Plant)) { continue }
    const plantHit = plant.collideWithAabb(aabb, [x, y])
    if (plantHit) {
      return true
    }
  }

  const [wl, hu, wr, hd] = aabb

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
