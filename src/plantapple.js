import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import PlantFruit from './plantfruit.js'
import Fertilizer from './fertilizer.js'

export default class PlantApple extends PlantFruit {
  sprite = game.assets.images.plantAppleSprout
  grownSprite = game.assets.images.plantApple

  growUp() {
    super.growUp()
    
    this.linkedFruit = new Fertilizer(vec2.add(this.position, this.fruitGrowOffset), 'apple', true)
    game.addThing(this.linkedFruit)
  }

  update() {
    super.update()

    if (this.isSprout) {
      if (this.isBeingWatered()) {
        this.growUp()
      }
    }
  }
}
