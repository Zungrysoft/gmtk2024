import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class SellZone extends Thing {
  aabb = [-1, -1, 1, 1]
  sprite = 'selectionBox'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }

  constructor (position = [0, 0]) {
    super()
    this.position = position
  }

  update () {
    super.update()
    for (const thing of this.getAllOverlaps()) {
      if (thing.price) {
        thing.isDead = true
        game.getThing('player').money += thing.price
      }
    }
  }
}
