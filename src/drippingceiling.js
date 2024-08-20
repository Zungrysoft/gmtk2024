import Thing from 'thing'
import WaterShot from './watershot.js'
import * as vec2 from 'vector2'
import * as game from 'game'

export default class DrippingCeiling extends Thing {
  sprite = game.assets.images.drip
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  dripTimer = 0
  enabled = true
  wateredSomethingTime = 0

  constructor(position) {
    super()
    this.position = [...position]
  }

  update() {
    super.update()

    // Drip water
    this.wateredSomethingTime ++
    this.dripTimer ++
    if (this.dripTimer % 60 === 0 && this.shouldWater()) {
      const pos = vec2.add(this.position, [0.5, 0.1])
      game.addThing(new WaterShot(pos, [0, 0], 0.6, false, this))
    }
  }

  shouldWater() {
    if (this.wateredSomethingTime < 60 * 15) {
      return true
    }
    if (vec2.distance(this.position, game.getThing('player').position) < 25) {
      return true
    }
    return false
  }

  wateredSomething() {
    this.wateredSomethingTime = 0
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.translate(0, -0.5)
    ctx.drawImage(this.sprite, ...this.position, 1, 1)
    ctx.restore()
  }
}
