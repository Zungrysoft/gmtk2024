import Thing from 'thing'
import * as vec2 from 'vector2'
import * as game from 'game'

export default class Completion extends Thing {
  depth = -50

  constructor(position) {
    super()
    this.position = [...position]
  }

  draw () {
    const player = game.getThing('player')
    const text = `Items found: ${player.foundPickups}/${player.totalPickups}`

    const { ctx } = game
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = '#000b28'
    ctx.font = 'italic bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.translate(...this.position)
    ctx.scale(1 / 48, 1 / 48)
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }
}
