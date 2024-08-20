import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class FireParticle extends Thing {
  sprite = game.assets.images.fireParticle
  baseScale = 1/48 * 1.5
  alpha = 1
  aabb = undefined
  
  constructor (position, velocity) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]
    this.rotation = Math.random() * Math.PI * 2
    this.scaleRate = Math.random() * 0.04 + 0.01
    this.scaleMultiplier = 1
  }

  update () {
    this.position = vec2.add(this.position, this.velocity)
    this.alpha -= this.alphaRate
    this.scaleMultiplier -= this.scaleRate
    this.scale = this.baseScale * this.scaleMultiplier
    this.rotation += 0.2

    if (this.scaleMultiplier <= 0) {
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
