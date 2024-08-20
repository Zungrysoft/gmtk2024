import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import Thing from 'thing'
import Deployer from './deployer.js'

export default class DeployerSwitch extends Thing {
  aabb = [0, 0, 1, 1]
  sprite = game.assets.images.switch
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  depth = -40
  downTime = 0

  constructor (position, radius) {
    super()
    this.position = [...position]
    this.radius = radius
  }

  update () {
    super.update()

    // Detect player
    const player = game.getThing('player')
    if (u.checkAabbIntersection(this.aabb, player.aabb, this.position, player.position)) {
      if (this.downTime === 0) {
        // Reactivate deployers
        this.activateDeployers()
      }
      this.downTime = 25
    }
    
    this.downTime = Math.max(this.downTime - 1, 0)

    this.sprite = this.downTime === 0 ? game.assets.images.switch : game.assets.images.switchDown
  }

  activateDeployers() {
    const things = game.getThingsNear(...this.position, this.radius).filter(x => x instanceof Deployer)
    for (const thing of things) {
      if (vec2.distance(this.position, thing.position) < this.radius) {
        thing.deployObject()
      }
    }
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.drawImage(this.sprite, ...this.position, 1, 1)
    ctx.restore()
  }
}
