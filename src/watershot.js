import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'
import WaterDroplet from './waterdroplet.js'
import WaterDeliverer from './waterdeliverer.js'

export default class WaterShot extends Thing {
  sprite = game.assets.images.waterShotSpeed1
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  aabb = [-0.3, -0.3, 0.3, 0.3]
  lifeTime = 300
  scale = 1/48

  constructor (position, velocity, scale) {
    super()
    this.position = [...position]
    this.velocity = [...velocity]

    this.scaleMultiplier = scale
    this.scale *= this.scaleMultiplier
  }

  update () {
    // Fly through the air
    this.velocity = vec2.add(this.velocity, [0, 0.02])
    this.position = vec2.add(this.position, this.velocity)

    // Match rotation to velocity
    this.rotation = vec2.vectorToAngle(this.velocity)

    // Match sprite to speed
    const speed = vec2.magnitude(this.velocity)
    if (speed > 0.5) {
      this.sprite = game.assets.images.waterShotSpeed4
    }
    else if (speed > 0.3) {
      this.sprite = game.assets.images.waterShotSpeed3
    }
    else if (speed > 0.15) {
      this.sprite = game.assets.images.waterShotSpeed2
    }
    else {
      this.sprite = game.assets.images.waterShotSpeed1
    }

    // Detect plants and water them
    const plants = game.getThingsNear(...this.position, 1).filter(e => e.overlapWithAabb)
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
