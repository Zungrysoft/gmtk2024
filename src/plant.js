import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Fertilizer from './fertilizer.js'
import FertilizerParticle from './fertilizerParticle.js'

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

  constructor (pos, variant='basic', isSprout=true, isIndestructible=false) {
    super()
    this.position = pos
    this.variant = variant
    this.isSprout = isSprout
    this.isIndestructible = isIndestructible
  }

  update() {
    this.timeSinceWatered ++
  }

  water() {
    this.timeSinceWatered = 0
  }

  isBeingWatered() {
    return this.timeSinceWatered <= 1
  }

  growUp() {
    this.isSprout = false
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

  collideWithThing (other, position = [undefined, undefined]) {
    if (position[0] === undefined) { position[0] = other.position[0] }
    if (position[1] === undefined) { position[1] = other.position[1] }
    return this.collideWithAabb(other.aabb, position)
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

  overlapWithThing (other, position = [undefined, undefined]) {
    if (position[0] === undefined) { position[0] = other.position[0] }
    if (position[1] === undefined) { position[1] = other.position[1] }
    return this.overlapWithAabb(other.aabb, position)
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
        this.overlapWithThing(thing) &&
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
    }
  }

  setTimerDisplay(n) {
    this.timerDisplay = n
  }

  setIcon(n) {
    this.icon = n
  }

  destroy() {
    this.isDead = true
  }

  draw() {
    // This draw function is just for adding common UI elements all plants may want
    const { ctx } = game

    ctx.save()

    if (this.isIndestructible) {
      ctx.save()
      ctx.translate(0, 1)
      ctx.drawImage(game.assets.images.roots, ...this.position, 1, 2)
      ctx.restore()
    }

    if (this.icon === 'timer') {
      ctx.translate(0, 1)
      const segments = 9
      const segment = Math.ceil(u.clamp(this.timerDisplay, 0, 1) * segments)
      const timerImage = game.assets.images["timer" + segment]
      ctx.drawImage(timerImage, ...this.position, 1, 1)
    }

    ctx.restore()
  }
}
