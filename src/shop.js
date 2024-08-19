import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'

export default class Shop extends Thing {
  sprite = 'vendingmachine'
  isActive = false
  thingWasPaused = new WeakMap()
  scale = [1 / 48, 1 / 48]
  animations = {
    idle: {
      frames: [0],
      speed: 0,
      frameSize: 128
    },
  }
  squash = [1, 1]
  frame = 0

  constructor(position) {
    super()
    this.position = [...position]
  }

  update () {
    const player = game.getThing('player')
    const isPlayerInRange = (
      u.distance(this.position, player.position) < 5
    )

    const cancel = (
      game.keysPressed.ArrowUp ||
      game.keysPressed.KeyZ ||
      game.buttonsPressed[2] ||
      game.buttonsPressed[12]
    )

    this.squash[0] = u.lerp(this.squash[0], 1, 0.15)
    this.squash[1] = u.lerp(this.squash[1], 1, 0.15)

    const isActive = Boolean(game.getThing('shopmenu'))

    if (isActive && cancel) {
      game.getThings().forEach(thing => {
        thing.isPaused = this.thingWasPaused.get(thing)
      })
      game.getThing('shopmenu').finish()
    }

    // Toggle shop menu open/closed
    if (isPlayerInRange && !isActive) {
      this.frame += 1
      const t = this.frame / 20
      this.squash[0] = u.map(Math.abs(Math.sin(t)), 0, 1, 0.8, 1, true)
      this.squash[1] = u.map(Math.abs(Math.cos(t)), 0, 1, 0.8, 1.1, true)

      if (game.keysPressed.ArrowUp || game.buttonsPressed[12]) {
        const menu = game.addThing(new ShopMenu())
        game.getThings().forEach(thing => {
          this.thingWasPaused.set(thing, thing.isPaused)
          thing.isPaused = thing !== this && thing !== menu
        })
      }
    } else {
      this.frame = 0
    }

    this.scale[0] = this.squash[0] * 1 / 48
    this.scale[1] = this.squash[1] * 1 / 48
  }

  close() {
    
  }

  draw () {
    this.drawSprite(...this.position, 0, u.map(this.squash[1], 1, 0.5, 0, 90) + 80)

    const { ctx } = game
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'white'
    ctx.font = 'italic bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.translate(...this.position)
    ctx.scale(1 / 48, 1 / 48)
    ctx.fillText('SHOP', 0, 0)
    ctx.restore()
  }
}

class ShopMenu extends Thing {
  selection = 0
  selectionAnim = 0
  holdFrames = 0
  canBuy = true

  constructor () {
    super()
    game.setThingName(this, 'shopmenu')
    this.setTimer('shopmenu', 12)
    this.regenerateShop()
  }

  update () {
    const player = game.getThing('player')
    if (player.isUnlockAnimationActive) {
      return
    }

    super.update()
    this.selectionAnim = u.lerp(this.selectionAnim, this.selection, 0.2)
    const rightButton = game.keysDown.ArrowRight || game.buttonsDown[15]
    const leftButton = game.keysDown.ArrowLeft || game.buttonsDown[14]
    if (rightButton || leftButton) {
      this.holdFrames += 1
    } else {
      this.holdFrames = 0
    }
    const { holdFrames } = this
    const inputAcceptable = (
      holdFrames === 1 || (holdFrames >= 20 && holdFrames % 5 === 0)
    )
    const right = rightButton && inputAcceptable
    const left = leftButton && inputAcceptable

    if (right) {
      this.selection += 1
      if (this.selection > this.items.length - 1) {
        this.selection = this.items.length - 1
      }
    }
    if (left) {
      this.selection -= 1
      if (this.selection < 0) {
        this.selection = 0
      }
    }

    // Buy item
    if (this.canBuy) {
      if (
        game.keysPressed.KeyX ||
        game.buttonsPressed[0]
      ) {
        const selection = this.items[this.selection]
        if (player.money >= selection.price) {
          player.money -= selection.price
          this.canBuy = false
          this.after(10, () => { this.canBuy = true })
          if (selection.givenTool) {
            player.unlockTool(selection.givenTool)
          }
          else if (selection.givenKey) {
            player.unlockKey(selection.givenKey)
          }
          this.regenerateShop()
        }
        else {
          // TODO: Error Sound
        }
      }
    }
  }

  regenerateShop() {
    this.items = [
      {
        name: 'Watering Can',
        price: 2,
        description: 'Waters plants',
        image: 'wateringCan',
        givenTool: 'wateringCan',
      },
      {
        name: 'Yellow Key',
        price: 6,
        description: 'Unlocks the Yellow Gate',
        image: 'keyyellow',
        givenKey: 'yellow',
      },
    ].filter(x => !this.itemAlreadyOwned(x))

    if (this.selection >= this.items.length) {
      this.selection = this.items.length - 1
    }
  }

  itemAlreadyOwned(item) {
    const player = game.getThing('player')
    if (player.ownedTools.includes(item.givenTool)) {
      return true
    }
    if (player.keyColors.includes(item.givenKey)) {
      return true
    }
    return false
  }

  finish () {
    if (this.getTimer('finish')) { return }
    this.setTimer('finish', 6, () => { this.isDead = true })
  }

  postDraw () {
    if (game.getThing('player').isUnlockAnimationActive) { return }

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
    for (let i = this.selection - 4; i < this.selection + 4; i += 1) {
      const a = (this.selectionAnim - i) * Math.PI * 2 / 10 + Math.PI * 0.5
      const shopItem = this.items[i]
      if (!shopItem) { continue }

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

    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'bold italic 20px Arial'
    ctx.textAlign = 'right'
    ctx.translate(game.getWidth() - 48, game.getHeight() - 48)
    ctx.fillText(`Press Z to cancel`, 0, 0)
    ctx.restore()

    ctx.restore()
  }
}
