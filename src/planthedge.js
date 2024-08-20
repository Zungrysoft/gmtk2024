import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'
import DestroyLeafParticle from './destroyleafparticle.js'

export default class PlantHedge extends Plant {
  hedgeGrowth = 0
  aabb = [-10, -10, 10, 10]
  hitboxCache = null
  sprite = game.assets.images.plantHedgeSprout
  hedgePattern = u.createPatternFromImage(game.assets.images.hedge)
  hedgePatternSide = u.createPatternFromImage(game.assets.images.hedgeSide)
  depth = 2
  receivedFertilizers = []

  constructor (pos, variant, isSprout, isIndestructible) {
    super(pos, variant, isSprout, isIndestructible)
    if (!this.isSprout) {
      this.hedgeGrowth = 1
    }
  }

  update() {
    super.update()

    if (this.isSprout) {
      this.icons = []
      if (!this.receivedFertilizers.includes('coal')) {
        this.icons.push('fertilizer')
      }
      else {
        this.icons.push('water')
      }

      // Consume fertilizer
      for (const fert of ['ash', 'coal']) {
        if (!this.receivedFertilizers.includes(fert)) {
          if (this.consumeFertilizer(fert)) {
            this.receivedFertilizers.push(fert)
            this.createFertilizerParticles()
          }
        }
      }

      // Grow up
      if (this.receivedFertilizers.includes('coal') && this.isBeingWatered()) {
        this.growUp()

        // Set variant
        if (u.compareLists(this.receivedFertilizers, ['coal', 'ash'])) {
          this.variant = 'archLeft'
        }
        else if (u.compareLists(this.receivedFertilizers, ['ash', 'coal'])) {
          this.variant = 'archRight'
        }
        else {
          this.variant = 'basic'
        }
      }
    }
    else {
      // Clear growing icons
      this.icons = []

      // Grow and shrivel in response to water
      const growthSpeed = 0.04
      // If this just sprouted, grow to minimum size of 1
      if (this.hedgeGrowth < 1) {
        this.hedgeGrowth += growthSpeed
        this.hitboxCache = null
      }
      // If this is being actively watered, it should grow until it reaches max size
      else if (this.isBeingWatered()) {
        if (game.getThing('level').isTileClear(this.getHeadTile(), this)) {
          this.hedgeGrowth = u.clamp(this.hedgeGrowth + growthSpeed, 1, this.getMaxHedgeGrowth())
          this.hitboxCache = null
        }
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
    if (this.variant === 'archRight') {
      return [
        {direction: 'up', length: 3},
        {direction: 'right', length: 2},
      ]
    }
    if (this.variant === 'archLeft') {
      return [
        {direction: 'up', length: 3},
        {direction: 'left', length: 2},
      ]
    }
    if (this.variant === 'bridgeRight') {
      return [
        {direction: 'up', length: 1},
        {direction: 'right', length: 6},
      ]
    }
    if (this.variant === 'bridgeLeft') {
      return [
        {direction: 'up', length: 1},
        {direction: 'left', length: 6},
      ]
    }
    if (this.variant === 'custom1') {
      return [
        {direction: 'up', length: 4},
        {direction: 'right', length: 7},
        {direction: 'up', length: 2},
      ]
    }
    if (this.variant === 'custom2') {
      return [
        {direction: 'up', length: 6},
        {direction: 'left', length: 1},
        {direction: 'up', length: 6},
      ]
    }
    if (this.variant === 'custom3') {
      return [
        {direction: 'up', length: 1},
        {direction: 'right', length: 1},
        {direction: 'down', length: 2},
        {direction: 'right', length: 2},
      ]
    }
    return [{direction: 'up', length: 6}]
  }

  getHeadTile() {
    const shape = this.getShape()
    let lengthLeft = this.hedgeGrowth
    let curPos = vec2.add(this.position, [0, 1])
    for (const seg of shape) {   
      const delta = vec2.directionToVector(seg.direction)
      const segLength = Math.min(lengthLeft, seg.length)

      lengthLeft -= seg.length
      curPos = vec2.add(curPos, vec2.scale(delta, segLength))
      if (lengthLeft <= 0) {
        if (seg.direction === 'right') {
          curPos = vec2.add(curPos, [1, 0])
        }
        if (seg.direction === 'down') {
          curPos = vec2.add(curPos, [0, 1])
        }
        break
      }
    }
    return [Math.floor(curPos[0]), Math.floor(curPos[1])]
  }

  getHedgeSegments() {
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
      let segBox
      if (seg.direction === 'down') {
        segBox = [curPos[0], curPos[1] + 1, curPos[0] + 1, curPos[1] + 1 + segLength]
      }
      else if (seg.direction === 'up') {
        segBox = [curPos[0], curPos[1] - segLength, curPos[0] + 1, curPos[1]]
      }
      else if (seg.direction === 'right') {
        segBox = [curPos[0] + 1, curPos[1], curPos[0] + 1 + segLength, curPos[1] + 1]
      }
      else if (seg.direction === 'left') {
        segBox = [curPos[0] - segLength, curPos[1], curPos[0], curPos[1] + 1]
      }
      ret.push({
        hitBox: segBox,
        direction: seg.direction
      })

      lengthLeft -= seg.length
      if (lengthLeft <= 0) {
        break
      }
      curPos = vec2.add(curPos, vec2.scale(delta, segLength))
    }

    this.hitboxCache = ret
    return this.hitboxCache
  }

  getHitBoxes() {
    return this.getHedgeSegments().map(x => x.hitBox)
  }

  getOverlapBoxes() {
    return [
      ...this.getHitBoxes(),
      [this.position[0], this.position[1], this.position[0] + 1, this.position[1] + 1]
    ]
  }

  destroy() {
    if (this.isSprout) {
      super.destroy()
    }
    else {
      this.isDead = true

      soundmanager.playSound('killplant', 0.15)

      // Particle effect on each segment of body
      const segs = this.getHedgeSegments()
      for (const seg of segs) {
        const box = seg.hitBox
        const area = Math.abs((box[2] - box[0]) * (box[3] - box[1]))
        for (let i = 0; i < 3 * area; i ++) {
          const pos = [
            u.map(Math.random(), 0, 1, box[0], box[2]),
            u.map(Math.random(), 0, 1, box[1], box[3]),
          ]
          const vel = [(Math.random()-0.5)* 0.1, Math.random()*-0.05 - 0.1]
          game.addThing(new DestroyLeafParticle(pos, vel))
        }
      }
    }
  }

  draw () {
    super.draw()

    const { ctx } = game

    if (this.isSprout) {
      ctx.save()
      ctx.drawImage(this.sprite, ...this.position, 1, 1)
      ctx.restore()
    }
    else {
      for (const e of this.getHedgeSegments()) {
        const b = e.hitBox
        ctx.save()
        ctx.scale(1 / 48, 1 / 48)

        // Main body
        ctx.fillStyle = vec2.directionToVector(e.direction)[0] !== 0 ? this.hedgePatternSide : this.hedgePattern
        ctx.fillRect(...[b[0], b[1], b[2] - b[0], b[3] - b[1]].map(x => x * 48))
        ctx.restore()

        // Top and bottom marks
        ctx.save()
        let topMarkPos
        let topMarkSprite = game.assets.images.hedgeTopMark
        let bottomMarkPos
        let bottomMarkSprite = game.assets.images.hedgeBottomMarkRight
        if (e.direction === 'up') {
          topMarkPos = [b[0], b[1] - 0.5]
          bottomMarkPos = [b[0], b[3] - 0.5]
          bottomMarkSprite = game.assets.images.hedgeBottomMarkUp
        }
        else if (e.direction === 'down') {
          topMarkPos = [b[0], b[3] - 0.5]
          bottomMarkPos = [b[0], b[1] - 0.5]
          bottomMarkSprite = game.assets.images.hedgeBottomMarkDown
        }
        else if (e.direction === 'left') {
          topMarkPos = [b[0] - 0.5, b[1]]
          bottomMarkPos = [b[2] - 0.5, b[1]]
          topMarkSprite = game.assets.images.hedgeTopMarkSide
          bottomMarkSprite = game.assets.images.hedgeBottomMarkLeft
        }
        else {
          topMarkPos = [b[2] - 0.5, b[1]]
          bottomMarkPos = [b[0] - 0.5, b[1]]
          topMarkSprite = game.assets.images.hedgeTopMarkSide
        }
        
        ctx.drawImage(bottomMarkSprite, ...bottomMarkPos, 1, 1)
        ctx.drawImage(topMarkSprite, ...topMarkPos, 1, 1)

        ctx.restore()
      }
    }
  }
}
