import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class WindyLeafParticle extends Thing {
  sprite = game.assets.images.leafParticle
  scale = 1/48 * 0.6
  alpha = 1
  aabb = undefined
  
  constructor (position, velocity) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
  }

  update () {
    this.position = vec2.add(this.position, this.velocity)
    this.alpha -= 0.02
    this.rotation += 0.1

    if (this.alpha < 0) {
      this.isDead = true
    }
  }

  draw() {
    const { ctx } = game

    ctx.save()
    ctx.globalAlpha = Math.max(this.alpha, 0)
    super.draw()
    ctx.restore()
  }
}
