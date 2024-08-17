import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Background extends Thing {
  depth = -100

  constructor () {
    super()
    game.setThingName(this, 'background')
  }

  preDraw () {
    const { ctx } = game

    ctx.save()
    ctx.fillStyle = 'gray'
    ctx.fillRect(0, 0, game.getWidth(), game.getHeight())
    ctx.restore()
  }
}
