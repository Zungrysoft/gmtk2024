import * as game from 'game'
import * as vec2 from 'vector2'
import * as u from 'utils'
import Thing from 'thing'

export default class Gate extends Thing {
  aabb = [0, 0, 1, 3]
  depth = -20
  size = [1, 1]
  opened = false
  openAmount = 0

  constructor (position, color) {
    super()
    this.position = [...position]
    this.closedPosition = [...position]
    this.openPosition = vec2.add(position, [0, 3.5])
    this.color = color
    this.sprite = game.assets.images["gate" + color]
  }

  update() {
    const player = game.getThing('player')
    if (
      player.keyColors.includes(this.color) &&
      !this.opened &&
      u.checkAabbIntersection([-2, -1, 3, 4], player.aabb, this.position, player.position)
    ) {
      this.opened = true
    }
    if (this.opened) {
      this.openAmount = Math.min(this.openAmount + 0.03, 1)
    }
    this.position = vec2.lerp(this.closedPosition, this.openPosition, this.openAmount)
  }

  collideWithAabb (aabb, position = [0, 0]) {
    const collided = u.checkAabbIntersection(this.aabb, aabb, this.position, position)
    if (collided) {
      return true
    }
    return false
  }

  draw () {
    const { ctx } = game

    ctx.save()
    ctx.drawImage(this.sprite, ...this.position, 1, 3)
    ctx.restore()
  }
}
