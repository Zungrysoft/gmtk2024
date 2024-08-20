import * as game from 'game'
import PlantFruit from './plantfruit.js'

export default class PlantBlueberry extends PlantFruit {
  sprite = game.assets.images.plantBlueberrySprout
  grownSprite = game.assets.images.plantApple
  waterInterval = 60*20
  requiredWaterIterations = 3
  requiredFertilizer = 2
  waterTimer = 0
  waterIterations = 0
  consumedFertilizer = 0
  fruitType = 'blueberry'

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
        if (this.waterTimer === 0) {
          this.icons.push('water')
        }
        else if (this.waterIterations > 0) {
          this.setTimerDisplay(this.waterTimer / this.waterInterval)
          this.icons.push('timer')
          this.icons.push('noWater')
        }
      }
      if (this.consumedFertilizer < this.requiredFertilizer) {
        this.icons.push('fertilizer')
      }
      if (!this.isFruitClear()) {
        this.icons.push('blocked')
      }

      // Is watered
      if (this.isBeingWatered()) {
        if (this.waterTimer === 0) {
          this.waterTimer = this.waterInterval
          this.waterIterations += 1
        }
        else {
          // Blueberries don't want too much water
          // Reset timer if watered during waiting period
          this.waterTimer = this.waterInterval
          this.icons.push('timerBlocked')
        }
      }

      // Consume fertilizer
      if (this.consumedFertilizer < this.requiredFertilizer) {
        if (this.consumeFertilizer('banana')) {
          this.consumedFertilizer ++
          this.createFertilizerParticles()
        }
      }

      // Grow up
      if (this.waterIterations >= this.requiredWaterIterations) {
        if (this.consumedFertilizer >= this.requiredFertilizer) {
          if (this.isFruitClear()) {
            this.growUp()
          }
        }
      }
    }
    else {
      // Clear growing icons
      this.icons = []
    }
  }
}
