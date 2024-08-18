import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Plant from './plant.js'
import PlantFruit from './plantfruit.js'
import Apple from './apple.js'

export default class PlantApple extends PlantFruit {
  sprite = game.assets.images.plantAppleSprout
  grownSprite = game.assets.images.plantApple

  growUp() {
    super.growUp()

    console.log("APPLE GROW UP")

    console.log(vec2.add(this.position, this.fruitGrowOffset))
    this.linkedFruit = new Apple(vec2.add(this.position, this.fruitGrowOffset), true)
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
