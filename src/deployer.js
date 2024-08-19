import * as game from 'game'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Fertilizer from './fertilizer.js'
import Dribbler from './dribbler.js'
import Sprinkler from './sprinkler.js'

export default class Deployer extends Thing {
  sprite = game.assets.images.deployer
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  deployedObject = null
  depth = 8

  constructor (position, type) {
    super()
    this.position = [...position]
    this.type = type
  }

  update () {
    // Check if deployed object is dead to deploy a new one
    if (!this.deployedObject || this.deployedObject.isDead) {
      this.deployObject()
    }
  }

  deployObject() {
    if (this.deployedObject) {
      this.deployedObject.isDead = true
    }
    this.deployedObject = this.createNewObject()
    game.addThing(this.deployedObject)
  }

  createNewObject() {
    const pos = vec2.add(this.position, [0.5, 0.5])
    if (this.type === 'dribbler') {
      return new Dribbler(pos)
    }
    if (this.type === 'sprinkler') {
      return new Sprinkler(pos)
    }
    return new Fertilizer(pos, this.type)
  }

  deviceTrigger() {
    this.deployObject()
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.drawImage(this.sprite, ...vec2.add(this.position, [0, -0.4]), 1, 1)
    ctx.restore()
  }
}
