import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'

export default class WaterShot extends Thing {
  sprite = game.assets.images.waterShot
  aabb = [-1, -1, 1, 1]
  

  constructor (position, direction) {
    super()
    this.position = position
    self.velocity = direction > 0 ? [0.2, 0.05] : [0.2, 0.05]
  }

  update () {
    this.rotation += 0.3

    // Fly through the air

    // Match rotation to velocity

    // Detect plants and water them

    // Limit lifetime
  }

  
}
