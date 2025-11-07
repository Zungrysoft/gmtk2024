import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import Fertilizer from './fertilizer.js'
import FertilizerParticle from './fertilizerParticle.js'
import DestroyLeafParticle from './destroyleafparticle.js'
import FireParticle from './fireParticle.js'

export default class Plant extends Thing {
  validTileTypes = []
  isSprout = true
  isPotted = false
  timeSinceWatered = Number.MAX_SAFE_INTEGER
  variant = 'basic'
  animations = {
    idle: {
      frames: [0],
      speed: 1,
      frameSize: 48
    },
  }
  depth = -1
  timerDisplay = 0
  isIndestructible = false
  icons = []
  squash = [1, 1]

  constructor (pos, variant='basic', isSprout=true, isIndestructible=false) {
    super()
    this.position = pos
    this.variant = variant
    this.isSprout = isSprout
    this.isIndestructible = isIndestructible
  }

  update() {
    this.timeSinceWatered ++

    this.squash[0] = u.lerp(this.squash[0], 1, 0.15)
    this.squash[1] = u.lerp(this.squash[1], 1, 0.15)
    this.scale[0] = this.squash[0]
    this.scale[1] = this.squash[1]
  }

  water() {
    this.timeSinceWatered = 0
  }

  isBeingWatered() {
    return this.timeSinceWatered <= 1
  }

  growUp() {
    this.isSprout = false
    soundmanager.playSound('growplant', 0.15)
    this.squash[0] = 0.5
    this.squash[1] = 1.5
  }

  revertToSprout() {
    this.isSprout = true
  }

  getHitBoxes() {
    return []
  }

  getOverlapBoxes() {
    return this.getHitBoxes()
  }

  collideWithAabb (aabb, position = [0, 0]) {
    for (const box of this.getHitBoxes()) {
      const collided = u.checkAabbIntersection(box, aabb, [0, 0], position)
      if (collided) {
        return true
      }
    }

    return false
  }

  overlapWithAabb (aabb, position = [0, 0]) {
    for (const box of this.getOverlapBoxes()) {
      const collided = u.checkAabbIntersection(box, aabb, [0, 0], position)
      if (collided) {
        return true
      }
    }

    return false
  }

  consumeFertilizer(type) {
    const fertilizers = game.getThingsNear(...this.position, 2).filter(x => x instanceof Fertilizer)
    for (const thing of fertilizers) {
      if (
        this.overlapWithAabb(thing.aabb, thing.position) &&
        thing.type === type &&
        !thing.isPickedUp() &&
        !thing.isDead &&
        thing.contactDirections.down
      ) {
        thing.isDead = true
        return true
      }
    }
    return false
  }

  createFertilizerParticles(count=6, intensity=1) {
    for (let i = 0; i < count; i ++) {
      game.addThing(new FertilizerParticle(vec2.add(this.position, [0.5, 0.5]), intensity))
      soundmanager.playSound('feedplant', 0.2)
    }
  }

  setTimerDisplay(n) {
    this.timerDisplay = n
  }

  destroy(fire = false) {
    this.isDead = true

    // Particle effect
    for (let i = 0; i < 8; i ++) {
      const pos = vec2.add(this.position, [0.5, 1])
      const vel = [(Math.random()-0.5)* 0.2, Math.random()*-0.1 - 0.2]
      this.destroyParticle(pos, vel, fire)
    }

    soundmanager.playSound('killplant', 0.15)
  }

  destroyParticle(pos, vel, fire) {
    const particle = fire ? new FireParticle(pos, vel) : new DestroyLeafParticle(pos, vel)
    game.addThing(particle)
  }

  draw() {
    // This draw function is just for adding common UI elements all plants may want
    const { ctx } = game

    ctx.save()

    ctx.translate(0, 1)

    // Indestructible roots
    if (this.isIndestructible) {
      ctx.drawImage(game.assets.images.roots, ...this.position, 1, 2)
    }

    // Wait until further action
    if (this.icons.includes('timer')) {
      ctx.save()
      ctx.translate(0, 0.3)
      const segments = 9
      const segment = Math.ceil(u.clamp(this.timerDisplay, 0, 1) * segments)
      const timerImage = game.assets.images["timer" + segment]
      ctx.drawImage(timerImage, ...this.position, 1, 1)
      if (this.icons.includes('timerBlocked')) {
        ctx.drawImage(game.assets.images.timerBlocked, ...this.position, 1, 1)
      }
      ctx.restore()
    }

    // Blocked
    if (this.icons.includes('blocked')) {
      ctx.drawImage(game.assets.images.growIconBlocked, ...this.position, 1, 1)
    }

    // Needs Fertilizer
    if (this.icons.includes('fertilizer')) {
      ctx.drawImage(game.assets.images.growIconFertilizer, ...this.position, 1, 1)
    }

    // Needs Water
    if (this.icons.includes('water')) {
      ctx.drawImage(game.assets.images.growIconWater, ...this.position, 1, 1)
    }

    // Needs to not be watered
    if (this.icons.includes('noWater')) {
      ctx.drawImage(game.assets.images.growIconNoWater, ...this.position, 1, 1)
    }

    ctx.restore()
  }
}
