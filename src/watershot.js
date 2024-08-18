import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'

export default class WaterShot extends Thing {
  sprite = game.assets.images.waterShot
  aabb = [-1, -0.4, 1, 0.4]
  lifeTime = 300
  scale = 1/48
  

  constructor (position, direction) {
    super()
    this.position = [...position]
    this.velocity = direction > 0 ? [0.7, -0.1] : [-0.7, -0.1]

    // Randomly vary velocity
    const vx = (Math.random()*2 - 1) * 0.2
    const vy = (Math.random()*2 - 1) * 0.03
    this.velocity = vec2.add(this.velocity, [vx, vy])
  }

  update () {
    this.velocity = vec2.add(this.velocity, [0, 0.02])
    this.position = vec2.add(this.position, this.velocity)
    this.rotation = vec2.vectorToAngle(this.velocity)
    // Fly through the air

    // Match rotation to velocity

    // Detect plants and water them

    // Limit lifetime
    this.lifeTime --
    if (this.time < 0) {
      this.isDead = true
    }
  }

  
}
