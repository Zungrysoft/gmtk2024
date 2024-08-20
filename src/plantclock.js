import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'
import TimeRing from './timeRing.js'
import * as soundmanager from 'soundmanager'

export default class PlantClock extends Plant {
  aabb = [-10, -10, 10, 10]
  hitboxCache = null
  sprite = game.assets.images.plantClockSprout
  grownSprite = game.assets.images.plantClock
  clockTime = 0
  fertilizerConsumed = 0

  update() {
    super.update()

    if (this.isSprout) {
      // Icons
      this.icons = []
      if (this.fertilizerConsumed === 0) {
        this.icons.push('fertilizer')
      }
      else {
        this.icons.push('water')
      }

      // Consume fertilizer
      if (this.fertilizerConsumed < 5) {
        if (this.consumeFertilizer('ash')) {
          this.fertilizerConsumed ++
          this.createFertilizerParticles()
        }
      }

      // Grow up
      if (this.isBeingWatered() && this.fertilizerConsumed > 0) {
        this.growUp()

        // Set variant
        if (this.fertilizerConsumed === 2) {
          this.variant = 'timer2'
        }
        else if (this.fertilizerConsumed === 3) {
          this.variant = 'timer3'
        }
        else if (this.fertilizerConsumed === 4) {
          this.variant = 'timer4'
        }
        else if (this.fertilizerConsumed === 5) {
          this.variant = 'timer5'
        }
        else {
          this.variant = 'basic'
        }
      }
    }
    else {
      this.icons = []

      // Clock features
      this.clockTime ++
      if (this.clockTime > this.getInterval()) {
        this.clockTime = 0

        // Toggle all nearby devices
        const effectRadius = 6.5
        const devices = game.getThingsNear(...this.position, effectRadius).filter(e => e.deviceTrigger)
        for (const device of devices) {
          if (vec2.distance(this.position, device.position) <= effectRadius) {
            device.deviceTrigger()
          }
        }
        game.addThing(new TimeRing(vec2.add(this.position, [0.5, 0.5]), effectRadius))
        this.soundEffect()
      }
    }
  }

  soundEffect() {
    const player = game.getThing('player')
    const dist = vec2.squareDistance(player.position, this.position)
    if (dist < 18) {
      soundmanager.playSound(
        ['energy'],
        u.inverseSquareMap(dist, 0, 18, 0.3, 0)
      )
    }
  }

  getInterval() {
    if (this.variant === 'timer2') {
      return 60 * 13
    }
    else if (this.variant === 'timer3') {
      return 60 * 27
    }
    else if (this.variant === 'timer4') {
      return 60 * 41
    }
    else if (this.variant === 'timer5') {
      return 60 * 83
    }
    else {
      return 60 * 7
    }
  }

  getHitBoxes() {
    return []
  }

  getOverlapBoxes() {
    return [[this.position[0], this.position[1], this.position[0] + 1, this.position[1] + 1]]
  }

  draw () {
    const { ctx } = game

    if (this.isSprout) {
      ctx.save()
      ctx.drawImage(this.sprite, ...this.position, 1, 1)
      ctx.restore()
    }
    else {
      ctx.save()
      ctx.drawImage(this.grownSprite, ...vec2.add(this.position, [-0.5, -1]), 2, 2)
      ctx.restore()
    }
    
    super.draw()
  }
}
