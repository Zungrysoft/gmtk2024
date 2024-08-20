import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'
import WindyLeafParticle from './windyleafparticle.js'
import Player from './player.js'
import Pickupable from './pickupable.js'

export default class PlantFan extends Plant {
  aabb = [-10, -10, 10, 10]
  hitboxCache = null
  sproutSprite = game.assets.images.plantFanSprout
  sprite = 'plantFan'
  time = 0
  timeLeft = 0
  hasBeenWatered = false
  receivedFertilizers = []

  update() {
    super.update()

    this.time ++

    if (this.isSprout) {
      const hasBaseFertilizer = this.receivedFertilizers.includes('ether')
      const hasAltFertilizer = this.receivedFertilizers.includes('ash') || this.receivedFertilizers.includes('powder')

      // Growing Icons
      this.icons = []
      if ((!hasBaseFertilizer) || (!hasAltFertilizer)) {
        this.icons.push('fertilizer')
      }
      else {
        this.icons.push('water')
      }

      // Consume fertilizer
      if (!hasBaseFertilizer) {
        if (this.consumeFertilizer('ether')) {
          this.receivedFertilizers.push('ether')
          this.createFertilizerParticles()
        }
      }
      if (!hasAltFertilizer) {
        if (this.consumeFertilizer('ash')) {
          this.receivedFertilizers.push('ash')
          this.createFertilizerParticles()
        }
        else if (this.consumeFertilizer('powder')) {
          this.receivedFertilizers.push('powder')
          this.createFertilizerParticles()
        }
      }

      // Grow up
      if (this.isBeingWatered() && hasBaseFertilizer && hasAltFertilizer) {
        this.growUp()

        // Set variant
        if (this.receivedFertilizers.includes('ash')) {
          if (u.compareLists(this.receivedFertilizers, ['ether', 'ash'])) {
            this.variant = 'left'
          }
          else if (u.compareLists(this.receivedFertilizers, ['ash', 'ether'])) {
            this.variant = 'right'
          }
        }
        else {
          this.variant = 'basic'
        }
      }
    }
    else {
      this.icons = []

      // Track watering
      this.timeLeft --
      if (this.isBeingWatered()) {
        this.timeLeft = 120
      }

      // Blowing
      if (this.timeLeft > 0) {
        // Particles
        if (Math.random() < 0.1) {
          const vel = vec2.scale(vec2.normalize(this.getBlowVelocity()), 0.2)
          const pos = vec2.add(this.position, [Math.random(), Math.random() - 0.3])
          game.addThing(new WindyLeafParticle(pos, vel))
        }

        const things = game.getThingsNear(...this.position, 20).filter(x => x instanceof Player || x instanceof Pickupable)
        for (const thing of things) {
          if (u.checkAabbIntersection(this.getWindAabb(), thing.aabb, this.position, thing.position)) {
            const dist = vec2.distance(this.position, thing.position)
            const blowFactor = u.map(dist, 0, 10, 0.4, 0, true)
            const deltaVelocity = vec2.scale(vec2.normalize(this.getBlowVelocity()), blowFactor)
            const dotProduct = vec2.dotProduct(vec2.normalize(deltaVelocity), vec2.normalize(thing.velocity)) < 0
            const dotScale = u.squareMap(dotProduct, -0.8, 1, 0, 1, true)
            thing.velocity = vec2.add(thing.velocity, vec2.scale(deltaVelocity, dotScale))
            if (this.variant === 'basic' && !thing.onGround && thing.coyoteFrames) {
              thing.coyoteFrames = 0
            }
            if (this.variant !== 'basic') {
              thing.windFrames = 4
            }
            else {
              thing.windVertical = 4
            }
          }
        }
      }
    }
  }

  getHitBoxes() {
    return []
  }

  getOverlapBoxes() {
    return [[this.position[0], this.position[1], this.position[0] + 1, this.position[1] + 1]]
  }

  getWindAabb() {
    if (this.variant === 'left') {
      return [-10, 0, 1, 1]
    }
    else if (this.variant === 'right') {
      return [0, 0, 11, 1]
    }
    else {
      return [0, -10, 1, 1]
    }
  }

  getBlowVelocity() {
    const speed = 0.1
    if (this.variant === 'left') {
      return [-speed, 0]
    }
    else if (this.variant === 'right') {
      return [speed, 0]
    }
    else {
      return [0, -speed]
    }
  }

  getFrame() {
    let frame = 0
    if (this.timeLeft > 0) {
      frame = (Math.floor(this.time / 4) % 3) + 1
    }
    if (this.variant === 'right' || this.variant === 'left') {
      frame += 4
    }
    return frame
  }

  draw () {
    const { ctx } = game

    if (this.isSprout) {
      ctx.save()
      ctx.drawImage(this.sproutSprite, ...this.position, 1, 1)
      ctx.restore()
    }
    else {
      ctx.save()
      ctx.translate(
        this.position[0] + 0.5,
        this.position[1],
      )
      ctx.scale(1/48, 1/48)
      if (this.variant === 'left') {
        ctx.scale(-1, 1)
      }
      this.drawSpriteFrame(this.sprite, this.getFrame(), 96)
      ctx.restore()
    }
    
    super.draw()
  }
}
