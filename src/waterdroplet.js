import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'

export default class WaterDroplet extends Thing {
  sprite = game.assets.images.waterDroplet
  lifeTime = 300
  scale = 1/48
  
  constructor (position, intensity) {
    super()
    this.position = [...position]

    const rot = Math.random() * Math.PI * 2
    const vel = vec2.angleToVector(rot)
    const r = u.map(Math.random(), 0, 1, 0.1, 0.3) * intensity
    this.velocity = vec2.scale(vel, r)
    this.scale *= intensity
  }

  update () {
    this.position = vec2.add(this.position, this.velocity)
    this.velocity = vec2.lerp(this.velocity, [0, 0], 0.06)
    this.scale -= (1/48)/30
    if (this.scale <= 0) {
      this.isDead = true
    }
  }

  
}
