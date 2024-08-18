import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'

export default class PlantHedge extends Plant {
  hedgeGrowth = 0
  aabb = [-10, -10, 10, 10]
  hitboxCache = null
  sprite = game.assets.images.plantHedgeSprout
  grownSprite = u.createPatternFromImage(game.assets.images.hedgeTest)

  constructor (pos, variant, isSprout) {
    super(pos, variant, isSprout)
    if (!this.isSprout) {
      this.hedgeGrowth = 1
    }
  }

  update() {
    super.update()

    if (this.isSprout) {
      if (this.isBeingWatered()) {
        this.isSprout = false
      }
    }
    else {
      // Grow and shrivel in response to water
      const growthSpeed = 0.04
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
      else if (this.timeSinceWatered > 240) {
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
    return [{direction: 'up', length: 6}]
  }

  getHitBoxes() {
    if (this.hitboxCache) { return this.hitboxCache }

    // List of collision boxes
    // Each element is of the form [x1, y1, x2, y2]
    if (this.isSprout) {
      this.hitboxCache = []
      return this.hitboxCache
    }
    const shape = this.getShape()
    let lengthLeft = this.hedgeGrowth
    let curPos = vec2.add(this.position, [0, 1])
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
    return this.hitboxCache
  }

  getOverlapBoxes() {
    return [
      ...this.getHitBoxes(),
      [this.position[0], this.position[1], this.position[0] + 1, this.position[1] + 1]
    ]
  }

  draw () {
    const { ctx } = game

    // Green rectangles for now
    if (this.isSprout) {
      ctx.save()
      ctx.drawImage(this.sprite, ...this.position, 1, 1)
      ctx.restore()
    }
    else {
      for (const e of this.getHitBoxes()) {
        ctx.save()
        ctx.scale(1 / 48, 1 / 48)
        ctx.fillStyle = this.grownSprite //'green'
        ctx.fillRect(...[e[0], e[1], e[2] - e[0], e[3] - e[1]].map(x => x * 48))
        ctx.restore()
      }
    }
    
  }
}
