import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

export default class SellZone extends Thing {
  aabb = [-1, -1, 1, 1]
  scale = 1 / 48
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  depth = -100

  constructor (position = [0, 0]) {
    super()
    this.position = position
  }

  update () {
    super.update()
    const player = game.getThing('player')
    for (const thing of this.getAllOverlaps()) {
      if (
        thing.value &&
        player.pickup !== thing &&
        thing.contactDirections.down
      ) {
        thing.isDead = true
        player.money += thing.value
        soundmanager.playSound('sell', 0.5)
        game.addThing(new MoneyPopup(thing.value, vec2.add(this.position, [0, -1])))
      }
    }
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.fillStyle = 'green'
    ctx.globalAlpha = 0.5
    ctx.translate(...this.position)
    ctx.fillRect(-1, -1, 2, 2)
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.font = 'italic bold 26px Arial'
    ctx.textAlign = 'center'
    ctx.translate(...this.position)

    ctx.save()
    ctx.translate(0, -0.35)
    ctx.scale(1 / 48, 1 / 48)
    ctx.fillText('SELL', 0, 0)
    ctx.restore()

    ctx.save()
    ctx.translate(0, 0.45)
    ctx.scale(1 / 48, 1 / 48)
    ctx.fillText('FRUIT', 0, 0)
    ctx.restore()

    ctx.restore()
  }
}

class MoneyPopup extends Thing {
  depth = 100

  constructor (amount, position) {
    super()
    this.position = position
    this.amount = amount
    this.velocity[1] = -0.03
    this.setTimer('life', 80, () => { this.isDead = true })
  }

  update () {
    super.update()
    this.velocity[1] *= 0.9
  }

  draw () {
    const { ctx } = game
    if (this.getTimerFrames('life') < 30 && this.getTimerFrames('life') % 6 < 2) {
      //return
    }

    ctx.save()
    ctx.fillStyle = 'rgb(120, 255, 80)'
    ctx.globalAlpha = u.inverseSquareMap(this.getTimer('life'), 0.5, 1, 1, 0, true)
    ctx.textAlign = 'center'
    ctx.font = 'bold 36px Arial'
    ctx.translate(...this.position)
    ctx.scale(1 / 48, 1 / 48)
    ctx.fillText(`+$${this.amount}`, 0, 0)
    ctx.restore()
  }
}
