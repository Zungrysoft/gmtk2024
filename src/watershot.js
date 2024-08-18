import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'
import WaterDroplet from './waterdroplet.js'

export default class WaterShot extends Thing {
  sprite = game.assets.images.waterShot
  aabb = [-1, -0.4, 1, 0.4]
  lifeTime = 300
  scale = 1/48
  
  constructor (position, direction) {
    super()
    this.position = [...position]
    this.velocity = direction > 0 ? [0.6, -0.1] : [-0.6, -0.1]

    // const r1 = Math.random()
    // const r2 = Math.random()
    // const vx = (Math.sqrt(r1)*2 - 1) * 0.06
    // const vy = (Math.sqrt(r2)*2 - 1) * 0.06
    // this.velocity = vec2.add(this.velocity, [vx, vy])

    // Randomly vary velocity
    const r1 = Math.random()
    const r2 = Math.random()
    const vx = (Math.sqrt(r1)*2 - 1) * 0.06
    const vy = (Math.sqrt(r2)*2 - 1) * 0.03
    this.velocity = vec2.add(this.velocity, [vx, vy])
  }

  update () {
    // Fly through the air
    this.velocity = vec2.add(this.velocity, [0, 0.02])
    this.position = vec2.add(this.position, this.velocity)

    // Match rotation to velocity
    this.rotation = vec2.vectorToAngle(this.velocity)

    // Detect plants and water them

    // Detect solid ground and destroy self
    if (game.getThing('level').checkWorldTileCollision(...this.position)) {
      this.isDead = true
      this.spawnDroplets()
    }

    // Limit lifetime
    this.lifeTime --
    if (this.time < 0) {
      this.isDead = true
    }
  }

  spawnDroplets() {
    for (let i = 0; i < 8; i ++) {
      game.addThing(new WaterDroplet(this.position))
    }
  }
}
