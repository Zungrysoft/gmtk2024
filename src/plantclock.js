import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'
import TimeRing from './timeRing.js'

export default class PlantClock extends Plant {
  aabb = [-10, -10, 10, 10]
  hitboxCache = null
  sprite = game.assets.images.plantClockSprout
  grownSprite = game.assets.images.plantClock
  interval = 60 * 10
  clockTime = 0

  update() {
    super.update()

    if (this.isSprout) {
      if (this.isBeingWatered()) {
        this.growUp()
      }
    }
    else {
      // Clock features
      this.clockTime ++
      if (this.clockTime > this.interval) {
        this.clockTime = 0

        // Toggle all nearby devices
        const effectRadius = 5.5
        const devices = game.getThingsNear(...this.position, effectRadius).filter(e => e.isDevice)
        for (const device of devices) {
          if (vec2.distance(this.position, device.position) <= effectRadius) {
            device.enabled = !device.enabled
          }
        }
        game.addThing(new TimeRing(vec2.add(this.position, [0.5, 0.5]), effectRadius))
      }
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
  }
}
