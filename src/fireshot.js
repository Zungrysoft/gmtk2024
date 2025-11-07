import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'
import FireParticle from './fireParticle.js'
import SmokeParticle from './smokeParticle.js'

export default class FireShot extends Thing {
  sprite = game.assets.images.fireShot
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

    // Detect plants and destroy them
    if (!this.isDead) {
      const things = game.getThingsNear(...this.position, 1).filter(e => e.overlapWithAabb)
      for (const thing of things) {
        if (thing.overlapWithAabb(this.aabb, this.position)) {
          if (!thing.isIndestructible && thing.destroy) {
            thing.destroy(true)
          }
          this.isDead = true
          this.spawnParticles()
          break;
        }
      }
    }

    // Detect solid ground and destroy self
    if (!this.pierce && game.getThing('level').checkWorldTileCollision(...this.position)) {
      this.isDead = true
      this.spawnParticles()
    }

    // Limit lifetime
    this.lifeTime --
    if (this.time < 0) {
      this.isDead = true
    }
  }

  spawnParticles() {
    // Make sure player is nearby to actually see the particles
    const player = game.getThing('player')
    const dist = vec2.squareDistance(player.position, this.position)
    if (dist < 18) {
      // soundmanager.playSound(
      //   ['drip', 'drip1', 'drip2'],
      //   u.inverseSquareMap(dist, 0, 18, 0.3, 0)
      // )
      for (let i = 0; i < 2; i ++) {
        const pos = this.position
        const vel = vec2.scale(vec2.angleToVector(Math.random() * Math.PI * 2), 0.05)
        game.addThing(new FireParticle(pos, vec2.add(vel, [0, -0.02])))
      }
      if (Math.random() < 0.4) {
        const pos = this.position
        const vel = vec2.scale(vec2.angleToVector(Math.random() * Math.PI * 2), 0.02)
        game.addThing(new SmokeParticle(pos, vec2.add(vel, [0, -0.02])))
      }
    }
  }
}
