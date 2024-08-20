import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class SmokeParticle extends Thing {
  sprite = game.assets.images.smokeParticle
  scale = 1/48 * 1.3
  alpha = 1
  depth = -10
  
  constructor (position, velocity) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
    this.rotation = Math.random() * Math.PI * 2
    this.alphaRate = Math.random() * 0.01 + 0.01
  }

  update () {
    this.position = vec2.add(this.position, this.velocity)
    this.alpha -= this.alphaRate
    this.rotation += 0.03

    if (this.alpha <= 0) {
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
