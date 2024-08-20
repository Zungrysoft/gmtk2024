import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Pickup extends Thing {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  time = 0
  scale = 1/48

  constructor(position) {
    super()
    this.position = [...position]
  }

  update() {
    super.update()

    this.time += 1

    // Check for player collision
    const player = game.getThing('player')
    if (u.checkAabbIntersection(this.aabb, player.aabb, this.position, player.position)) {
      this.collect()
    }
  }

  collect() {
    this.isDead = true
    game.getThing('player').foundPickups ++
  }

  draw() {
    const { ctx } = game

    ctx.save()
    ctx.translate(0, Math.sin(this.time / 30) * 0.2)
    super.draw()
    ctx.restore()
  }
}
