import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'

export default class PlantFruit extends Plant {
  aabb = [-10, -10, 10, 10]
  linkedFruit = null
  fruitGrowOffset = [0.5, -1.4]

  update() {
    super.update()

    // Check if linked fruit was picked
    if (!this.isSprout) {
      if (
        !this.linkedFruit || 
        vec2.distance(vec2.add(this.position, this.fruitGrowOffset), this.linkedFruit.position) > 2 ||
        this.linkedFruit.isDead
      ) {
        this.revertToSprout()
        this.linkedFruit = null
      }
    }
  }

  getHitBoxes() {
    return []
  }

  getOverlapBoxes() {
    if (this.isSprout) {
      return [[this.position[0], this.position[1], this.position[0] + 1, this.position[1] + 1]]
    }
    return [
      [
        this.position[0] - 0.8,
        this.position[1] - 2,
        this.position[0] + 1 + 0.8,
        this.position[1] - 0.5,
      ],
      [
        this.position[0],
        this.position[1] - 1,
        this.position[0] + 1,
        this.position[1] + 1,
      ],
    ]
  }

  destroy() {
    super.destroy()
    if (this.linkedFruit && this.linkedFruit.isAttached) {
      this.linkedFruit.isAttached = false
    }
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
      ctx.drawImage(this.grownSprite, ...vec2.add(this.position, [-1, -2]), 3, 3)
      ctx.restore()
    }

    super.draw()
  }
}
