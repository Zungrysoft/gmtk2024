import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'

export default class PlantHedge extends Plant {
  validTileTypes = [2]
  hedgeGrowth = 0
  aabb = [-10, -10, 10, 10]
  hitboxCache = null

  constructor (pos, variant, isSprout) {
    super(pos, variant, isSprout)
    if (!this.isSprout) {
      this.hedgeGrowth = 1
    }
  }

  collide(other) {
    if (this.isSprout) {
      return false
    }
  }

  update() {
    super.update()

    if (!this.isSprout) {
      // Grow and shrivel in response to water
      const growthSpeed = 0.02
      // If this just sprouted, grow to minimum size of 1
      if (this.hedgeGrowth < 1) {
        this.hedgeGrowth += growthSpeed
        this.hitboxCache = null
      }
      // If this is being actively watered, it should grow until it reaches max size
      else if (this.isBeingWatered()) {
        this.hedgeGrowth = u.clamp(this.hedgeGrowth + growthSpeed, 1, this.getMaxHedgeGrowth())
        this.hitboxCache = null
      }
      // If this has not been watered for a few seconds, it should shrivel until it reachers min size
      else if (this.timeSinceWatered > 120) {
        this.hedgeGrowth = u.clamp(this.hedgeGrowth - growthSpeed, 1, this.getMaxHedgeGrowth())
        this.hitboxCache = null
      }

      // TODO: Don't grow any further if it is stuck
    }
  }

  getMaxHedgeGrowth() {
    return this.getShape().reduce((acc, cur) => acc + cur.length, 0)
  }

  getShape() {
    if (this.variant === 'l') {
      return [
        {direction: 'up', length: 3},
        {direction: 'right', length: 2},
      ]
    }
    if (this.variant === 'bridge') {
      return [
        {direction: 'up', length: 1},
        {direction: 'left', length: 6},
      ]
    }
    return [{direction: 'up', length: 5}]
  }

  getHitbox() {
    if (this.hitboxCache) { return this.hitboxCache }

    // List of collision boxes
    // Each element is of the form [x1, y1, x2, y2]
    const shape = this.getShape()
    let lengthLeft = this.hedgeGrowth
    let curPos = [...this.position]
    let ret = []
    for (const seg of shape) {
      const delta = vec2.directionToVector(seg.direction)
      const segLength = Math.min(lengthLeft, seg.length)

      // Y direction
      if (seg.direction === 'down') {
        ret.push([curPos[0], curPos[1] + 1, curPos[0] + 1, curPos[1] + 1 + segLength])
      }
      else if (seg.direction === 'up') {
        ret.push([curPos[0], curPos[1] - segLength, curPos[0] + 1, curPos[1]])
      }
      else if (seg.direction === 'right') {
        ret.push([curPos[0] + 1, curPos[1], curPos[0] + 1 + segLength, curPos[1] + 1])
      }
      else if (seg.direction === 'left') {
        ret.push([curPos[0] - segLength, curPos[1], curPos[0], curPos[1] + 1])
      }

      lengthLeft -= seg.length
      if (lengthLeft <= 0) {
        break
      }
      curPos = vec2.add(curPos, vec2.scale(delta, segLength))
    }

    this.hitboxCache = ret

    return ret
  }

  draw () {
    const { ctx } = game

    // Green rectangles for now
    for (const e of this.getHitbox()) {
      ctx.save()
      ctx.fillStyle = 'green'
      ctx.fillRect(e[0], e[1], e[2] - e[0], e[3] - e[1])
      ctx.restore()
    }
  }
}
