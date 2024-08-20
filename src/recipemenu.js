import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'

const recipes = [
  {
    name: 'Apple Tree',
    id: 'seedPacketApple',
    description: [
      'Takes any fertilizer.',
      'Produces one apple and dies.'
    ],
    image: ['plantApple', 'apple']
  },
  {
    name: 'Hedge',
    id: 'seedPacketHedge',
    description: [
      'Takes any fertilizer.',
      'Produces one apple and dies.'
    ],
    image: 'hedge'
  },
  {
    name: 'Orange Tree',
    id: 'seedPacketOrange',
    description: [
      'Takes any fertilizer.',
      'Produces one apple and dies.'
    ],
    image: ['plantApple', 'orange']
  },
  {
    name: 'Clock Flower',
    id: 'seedPacketClock',
    description: [
      'Takes any fertilizer.',
      'Produces one apple and dies.'
    ],
    image: 'plantClock'
  },
  {
    name: 'Banana Tree',
    id: 'seedPacketBanana',
    description: [
      'Takes any fertilizer.',
      'Produces one apple and dies.'
    ],
    image: ['plantApple', 'banana']
  },
]

export default class RecipeMenu extends Thing {
  selection = 0
  selectionAnim = 0
  holdFrames = 0
  thingWasPaused = new WeakMap()

  constructor (customRecipes) {
    super()
    game.setThingName(this, 'recipemenu')

    if (customRecipes === undefined) {
      this.recipes = recipes
    } else {
      if (typeof customRecipes === 'string') {
        customRecipes = [customRecipes]
      }
      this.recipes = recipes.filter(r => customRecipes.includes(r.id))
    }

    game.getThings().forEach(thing => {
      this.thingWasPaused.set(thing, thing.isPaused)
      thing.isPaused = thing !== this
    })

    this.setTimer('canDie', typeof customRecipes === 'string' ? 60 : 10)
  }

  update () {
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
      if (this.selection > this.recipes.length - 1) {
        this.selection = this.recipes.length - 1
      } else {
        soundmanager.playSound('uitoggle2', 0.15, [1.0, 1.1])
      }
    }
    if (left) {
      this.selection -= 1
      if (this.selection < 0) {
        this.selection = 0
      } else {
        soundmanager.playSound('uitoggle2', 0.15, [0.7, 0.8])
      }
    }

    const cancel = (
      game.keysPressed.KeyZ || game.buttonsPressed[2]
    )

    if (cancel && !this.getTimer('canDie')) {
      this.isDead = true
    }
  }

  onDeath () {
    game.getThings().forEach(thing => {
      thing.isPaused = this.thingWasPaused.get(thing)
    })
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
      const recipe = this.recipes[i]
      if (!recipe) { continue }

      const alpha = u.map(Math.sin(a), -0.25, 0.25, 0, 1, true)
      if (alpha <= 0) { continue }
      ctx.globalAlpha = alpha

      const scale = u.map(Math.sin(a), 1, -1, 1, 0.35, true)

      const w = 450
      const h = 380
      ctx.save()
      ctx.translate(Math.cos(a) * 1000, Math.sin(a) * 100 - 50)
      ctx.scale(scale, scale)
      ctx.beginPath()
      ctx.fillStyle = 'rgb(0, 0, 0, 0.5)'
      ctx.fillRect(-w / 2, -h / 2, w, h)
      ctx.rect(-w / 2, -h / 2, w, h)
      ctx.save()
      ctx.translate(w / 2 - 16 - 128, h / -2 + 16)
      const images = recipe.image
      for (const img of Array.isArray(images) ? images : [images]) {
        ctx.drawImage(game.assets.images[img], 0, 0)
        ctx.translate(0, 128)
      }
      ctx.restore()
      ctx.stroke()

      ctx.save()
      ctx.translate(w / -2 + 32, 0)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px Arial'
      ctx.fillText(recipe.name, 0, -130)
      ctx.font = 'italic 18px Arial'
      ctx.translate(0, 64)
      for (const line of recipe.description) {
        ctx.fillText(line, 0, 0)
        ctx.translate(0, 32)
      }
      ctx.restore()
      ctx.restore()
    }
    ctx.restore()

    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'bold italic 100px Arial'
    ctx.textAlign = 'center'
    ctx.translate(game.getWidth() / 2, 150)
    ctx.fillText(this.recipes.length > 1 ? 'RECIPES' : 'NEW RECIPE', 0, 0)
    ctx.restore()

    if (this.recipes.length === 0) {
      ctx.save()
      ctx.fillStyle = 'white'
      ctx.font = 'bold italic 40px Arial'
      ctx.textAlign = 'center'
      ctx.translate(game.getWidth() / 2, game.getHeight() / 2)
      ctx.fillText('Your recipe list is empty!', 0, 0)
      ctx.restore()
    }

    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'bold italic 20px Arial'
    ctx.textAlign = 'right'
    ctx.translate(game.getWidth() - 48, game.getHeight() - 48)
    ctx.fillText(`Press Z to exit`, 0, 0)
    ctx.restore()

    ctx.restore()
  }
}
