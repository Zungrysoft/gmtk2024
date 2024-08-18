import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class LaserField extends Thing {
  aabb = [0, 0, 1, 1]
  sprite = u.createPatternFromImage(game.assets.images.laserField)
  depth = -20
  size = [1, 1]

  constructor (position, size) {
    super()
    this.position = [...position]
    this.size = [...size]
    this.aabb = [0, 0, ...size]
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.scale(1 / 48, 1 / 48)

    ctx.fillStyle = this.sprite
    const coords = [...this.position, ...this.size].map(x => x * 48)
    ctx.fillRect(...coords)

    ctx.restore()
  }
}
