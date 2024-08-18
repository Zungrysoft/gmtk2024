import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Background extends Thing {
  depth = -100
  pattern = u.createPatternFromImage(game.assets.images.caveBackground)

  constructor () {
    super()
    game.setThingName(this, 'background')
  }

  preDraw () {
    const { ctx } = game

    const cam = game.getCamera2D()
    let [x, y] = cam.position
    y += 150
    ctx.save()
    ctx.translate(
      -1 * x,
      -1 * y
    )
    ctx.fillStyle = this.pattern
    ctx.fillRect(x, y, game.getWidth(), game.getHeight())
    ctx.restore()
  }
}
