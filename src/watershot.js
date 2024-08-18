import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'
import WaterDroplet from './waterdroplet.js'
import WaterDeliverer from './waterDeliverer.js'

export default class WaterShot extends Thing {
  animation = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  aabb = [-0.3, -0.3, 0.3, 0.3]
  lifeTime = 300
  scale = 1/48

  constructor (position, direction, scale, speed, spread) {
    super()
    this.position = [...position]
    this.velocity = direction > 0 ? [speed, -0.1] : [-speed, -0.1]

    // const r1 = Math.random()
    // const r2 = Math.random()
    // const vx = (Math.sqrt(r1)*2 - 1) * 0.06
    // const vy = (Math.sqrt(r2)*2 - 1) * 0.06
    // this.velocity = vec2.add(this.velocity, [vx, vy])

    // Randomly vary velocity
    const r1 = Math.random()
    const r2 = Math.random()
    const vx = (Math.sqrt(r1)*2 - 1) * spread * direction
    const vy = (Math.sqrt(r2)*2 - 1) * spread * 0.5
    this.velocity = vec2.add(this.velocity, [vx, vy])

    // Randomly vary position
    const dx = (Math.random()*2 - 1) * speed * 0.5
    this.position = vec2.add(this.position, [dx, 0])

    this.scaleMultiplier = scale
    this.scale *= this.scaleMultiplier

    // Fast water shots need a more speedy-looking sprite
    if (speed > 0.3) {
      this.sprite = game.assets.images.waterShotFast
    }
    else {
      this.sprite = game.assets.images.waterShotSlow
    }
  }

  update () {
    // Fly through the air
    this.velocity = vec2.add(this.velocity, [0, 0.02])
    this.position = vec2.add(this.position, this.velocity)

    // Match rotation to velocity
    this.rotation = vec2.vectorToAngle(this.velocity)

    // Detect plants and water them
    const plants = game.getThingsNear(...this.position, 1).filter(e => e instanceof Plant)
    for (const plant of plants) {
      if (plant.overlapWithAabb(this.aabb, this.position)) {
        this.isDead = true
        this.spawnDroplets()
        game.addThing(new WaterDeliverer(plant, 10))
      }
    }

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
    for (let i = 0; i < 8*this.scaleMultiplier; i ++) {
      game.addThing(new WaterDroplet(this.position, Math.sqrt(this.scaleMultiplier)))
    }
  }
}
