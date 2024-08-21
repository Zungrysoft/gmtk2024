import * as game from 'game'
import PlantFruit from './plantfruit.js'

export default class PlantBanana extends PlantFruit {
  sprite = game.assets.images.plantBananaSprout
  grownSprite = game.assets.images.plantApple
  waterInterval = 180
  requiredWaterIterations = 10
  requiredApples = 0
  requiredOranges = 3
  waterTimer = 0
  waterIterations = 0
  consumedApples = 0
  consumedOranges = 0
  fruitType = 'banana'

  revertToSprout() {
    super.revertToSprout()

    this.consumedOranges = 0
    this.consumedApples = 0
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
        }
      }
      if (this.consumedApples < this.requiredApples || this.consumedOranges < this.requiredOranges) {
        this.icons.push('fertilizer')
      }
      if (!this.isFruitClear()) {
        this.icons.push('blocked')
      }

      // Is watered
      if (this.isBeingWatered() && this.waterTimer === 0) {
        this.waterTimer = this.waterInterval
        this.waterIterations += 1
      }

      // Consume fertilizer
      if (this.consumedApples < this.requiredApples) {
        if (this.consumeFertilizer('apple')) {
          this.consumedApples ++
          this.createFertilizerParticles()
        }
      }
      if (this.consumedOranges < this.requiredOranges) {
        if (this.consumeFertilizer('orange')) {
          this.consumedOranges ++
          this.createFertilizerParticles()
        }
      }

      // Grow up
      if (this.waterIterations >= this.requiredWaterIterations) {
        if (this.consumedApples >= this.requiredApples) {
          if (this.consumedOranges >= this.requiredOranges) {
            if (this.isFruitClear()) {
              this.growUp()
            }
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
