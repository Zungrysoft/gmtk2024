import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Shop extends Thing {
  isActive = false
  thingWasPaused = new WeakMap()

  update () {
    const player = game.getThing('player')
    const isPlayerInRange = (
      u.distance(this.position, player.position) < 5
    )

    // Toggle shop menu open/closed
    if (game.keysPressed.KeyS) {
      if (this.isActive) {
        game.getThings().forEach(thing => {
          thing.isPaused = this.thingWasPaused.get(thing)
        })
        game.getThing('shopmenu').finish()
        this.isActive = false
      } else if (isPlayerInRange) {
        const menu = game.addThing(new ShopMenu())
        game.getThings().forEach(thing => {
          this.thingWasPaused.set(thing, thing.isPaused)
          thing.isPaused = thing !== this && thing !== menu
        })
        this.isActive = true
      }
    }
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.font = 'italic bold 1px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('SHOP', 0, 0)
    ctx.restore()
  }
}

class ShopMenu extends Thing {
  selection = 0
  selectionAnim = 0
  items = [
    {
      name: 'Watering Can',
      price: 10,
      description: 'Waters stuff',
      image: 'wateringCan'
    },
    {
      name: 'Apple Seeds',
      price: 20,
      description: 'Grows apples!',
      image: 'apple'
    },
    {
      name: 'Pear Seeds',
      price: 40,
      description: 'Grows pears!',
      image: 'apple'
    }
  ]

  constructor () {
    super()
    game.setThingName(this, 'shopmenu')
    this.setTimer('intro', 12)
  }

  update () {
    super.update()
    this.selectionAnim = u.lerp(this.selectionAnim, this.selection, 0.2)
    if (game.keysPressed.ArrowRight) {
      this.selection += 1
    }
    if (game.keysPressed.ArrowLeft) {
      this.selection -= 1
    }
  }

  finish () {
    if (this.getTimer('finish')) { return }
    this.setTimer('finish', 6, () => { this.isDead = true })
  }

  postDraw () {
    const { ctx } = game
    ctx.save()
    if (this.getTimer('intro')) {
      ctx.translate(0, u.inverseSquareMap(this.getTimer('intro'), 0, 1, -1 * game.getHeight(), 0))
    }
    if (this.getTimer('finish')) {
      ctx.translate(0, u.inverseSquareMap(this.getTimer('finish'), 1, 0, -1 * game.getHeight(), 0))
    }

    ctx.save()
    ctx.fillStyle = 'rgba(0, 20, 80, 0.75)'
    ctx.fillRect(0, 0, game.getWidth(), game.getHeight())
    ctx.restore()

    const size = 180
    ctx.save()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 4
    ctx.translate(game.getWidth() / 2, game.getHeight() / 2)
    for (let i = 0; i < 10; i += 1) {
      const a = (this.selectionAnim - i) * Math.PI * 2 / 10 + Math.PI * 0.5
      const shopItem = this.items[i % this.items.length]

      const alpha = u.map(Math.sin(a), -0.25, 0.25, 0, 1, true)
      if (alpha <= 0) { continue }
      ctx.globalAlpha = alpha

      ctx.globalAlpha *= (
        shopItem.price > game.getThing('player').money
        ? 0.5
        : 1
      )

      const scale = u.map(Math.sin(a), 1, -1, 1, 0.35, true)
      ctx.save()
      ctx.translate(Math.cos(a) * 500, Math.sin(a) * 100 - 50)
      ctx.scale(scale, scale)
      ctx.beginPath()
      ctx.fillStyle = '#888'
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.rect(-size / 2, -size / 2, size, size)
      ctx.save()
      const img = game.assets.images[shopItem.image]
      ctx.scale(2, 2)
      ctx.translate(img.width / -2, img.height / -2)
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      ctx.stroke()

      ctx.save()
      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(shopItem.name, 0, -130)
      ctx.font = 'italic 18px Arial'
      ctx.fillText(shopItem.description, 0, 130)
      ctx.font = 'bold 40px Arial'
      ctx.textAlign = 'right'
      ctx.fillText('$' + shopItem.price, 80, 80)
      ctx.restore()

      ctx.restore()
    }
    ctx.restore()

    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'bold italic 100px Arial'
    ctx.textAlign = 'center'
    ctx.translate(game.getWidth() / 2, 150)
    ctx.fillText('SHOP', 0, 0)
    ctx.restore()

    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'bold italic 80px Arial'
    ctx.textAlign = 'left'
    ctx.translate(48, game.getHeight() - 48)
    ctx.fillText(`$${game.getThing('player').money}`, 0, 0)
    ctx.restore()

    ctx.restore()
  }
}
