import Thing from 'thing'
import * as vec2 from 'vector2'
import * as game from 'game'

export default class Tutorial extends Thing {
  depth = -50

  constructor(position, tutorial) {
    super()
    this.position = [...position]
    this.sprite = game.assets.images["tutorial" + tutorial]
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.drawImage(this.sprite, ...vec2.add(this.position, [-3, -2]), 6, 4)
    ctx.restore()
  }
}
