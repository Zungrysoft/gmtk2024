import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import PlantFruit from './plantfruit.js'
import Fertilizer from './fertilizer.js'

export default class PlantApple extends PlantFruit {
  sprite = game.assets.images.plantAppleSprout
  grownSprite = game.assets.images.plantApple
  waterInterval = 600
  requiredWaterIterations = 3
  requiredFertilizer = 1
  waterTimer = 0
  waterIterations = 0
  consumedFertilizer = 0

  growUp() {
    super.growUp()
    
    this.linkedFruit = new Fertilizer(vec2.add(this.position, this.fruitGrowOffset), 'apple', true)
    game.addThing(this.linkedFruit)
  }

  revertToSprout() {
    super.revertToSprout()

    this.consumedFertilizer = 0
    this.waterIterations = 0
    this.waterTimer = 0
  }

  update() {
    super.update()

    if (this.isSprout) {
      // Timer display
      this.waterTimer = Math.max(this.waterTimer - 1, 0)

      this.icons = []
      if (this.waterIterations < this.requiredWaterIterations) {
        this.icons.push('water')

        if (this.waterIterations > 0) {
          this.setTimerDisplay(this.waterTimer / this.waterInterval)
          this.icons.push('timer')
        }
      }
      if (this.consumedFertilizer < this.requiredFertilizer) {
        this.icons.push('fertilizer')
      }

      // Is watered
      if (this.isBeingWatered() && this.waterTimer === 0) {
        this.waterTimer = this.waterInterval
        this.waterIterations += 1
      }

      // Consume fertilizer
      if (this.consumedFertilizer < this.requiredFertilizer) {
        if (this.consumeFertilizer('ash')) {
          this.consumedFertilizer ++
          this.createFertilizerParticles()
        }
      }

      // Grow up
      if (this.waterIterations >= this.requiredWaterIterations) {
        if (this.consumedFertilizer >= this.requiredFertilizer) {
          this.growUp()
        }
      }
    }
    else {
      this.icons = []
    }
  }
}
