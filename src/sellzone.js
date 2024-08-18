import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class SellZone extends Thing {
  aabb = [-1, -1, 1, 1]
  scale = 1 / 48
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  depth = -100

  constructor (position = [0, 0]) {
    super()
    this.position = position
  }

  update () {
    super.update()
    const player = game.getThing('player')
    for (const thing of this.getAllOverlaps()) {
      if (
        thing.price &&
        player.pickup !== thing &&
        thing.contactDirections.down
      ) {
        thing.isDead = true
        player.money += thing.price
      }
    }
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.fillStyle = 'green'
    ctx.globalAlpha = 0.5
    ctx.translate(...this.position)
    ctx.fillRect(-1, -1, 2, 2)
    ctx.restore()
  }
}
