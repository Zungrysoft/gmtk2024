import * as game from 'game'
import Thing from 'thing'
import * as u from 'utils'

export default class TimeRing extends Thing {
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 128 }
  }
  sprite = game.assets.images.timeRing
  plant = null
  duration = 20
  scale = 0
  scaleMultiplier = 0
  
  constructor (position, radius) {
    super()
    
    this.position = [...position]
    this.radius = radius
  }

  update () {
    this.scaleMultiplier += this.radius / this.duration
    this.scale = (1/48) * this.scaleMultiplier
    if (this.scaleMultiplier > this.radius) {
      this.isDead = true
    }
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.drawImage(this.sprite, ...this.position, 1, 1)
    ctx.restore()
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.globalAlpha = u.map(this.scaleMultiplier, this.radius*0.8, this.radius, 0.5, 0, true)
    super.draw()
    ctx.restore()
  }
}
