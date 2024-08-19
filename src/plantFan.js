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
      this.icons = []
      if (!this.hasBeenWatered) {
        this.icons.push('water')
      }
      if (!(this.receivedFertilizers.includes('ether') && this.receivedFertilizers.length >= 2)) {
        this.icons.push('fertilizer')
      }

      // Is watered
      if (this.isBeingWatered()) {
        this.hasBeenWatered = true
      }

      // Consume fertilizer
      for (const fert of ['ash', 'coal', 'ether']) {
        if (!this.receivedFertilizers.includes(fert)) {
          if (this.consumeFertilizer(fert)) {
            this.receivedFertilizers.push(fert)
            this.createFertilizerParticles()
          }
        }
      }

      // Grow up
      if (this.receivedFertilizers.includes('ether') && this.receivedFertilizers.length >= 2 && this.hasBeenWatered) {
        this.growUp()

        // Set variant
        if (u.compareLists(this.receivedFertilizers, ['ether', 'ash'])) {
          this.variant = 'left'
        }
        else if (u.compareLists(this.receivedFertilizers, ['ash', 'ether'])) {
          this.variant = 'right'
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
          if (u.checkAabbIntersection(this.getAabb(), thing.aabb, this.position, thing.position)) {
            thing.velocity = vec2.add(thing.velocity, this.getBlowVelocity())
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

  getAabb() {
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
