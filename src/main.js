import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'
import Player from './player.js'
import PlantHedge from './planthedge.js'
import Shop from './shop.js'
import Background from './background.js'
import Apple from './apple.js'
import SellZone from './sellzone.js'
import Sprinkler from './sprinkler.js'

document.title = 'Game'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  guy: 'images/guy3.png',
  plantHedgeSprout: 'images/hedgeSprout.png',
  plantApple: 'images/appleTree.png',
  plantAppleSprout: 'images/appleSprout.png',
  plantClock: 'images/clockPlant.png',
  plantClockSprout: 'images/clockSprout.png',
  plantingIndicator: 'images/plantingIndicator.png',
  plantingIndicatorError: 'images/plantingIndicatorError.png',
  waterShotSpeed1: 'images/waterShotSpeed1.png',
  waterShotSpeed2: 'images/waterShotSpeed2.png',
  waterShotSpeed3: 'images/waterShotSpeed3.png',
  waterShotSpeed4: 'images/waterShotSpeed4.png',
  waterDroplet: 'images/waterDroplet.png',
  wateringCan: 'images/wateringcan.png',
  ground: 'images/ground.png',
  dirt1: 'images/dirt1.png',
  dirt2: 'images/dirt2.png',
  dirt3: 'images/dirt3.png',
  dirt4: 'images/dirt4.png',
  hedge: 'images/hedge.png',
  hedgeSide: 'images/hedgeSide.png',
  hedgeTopMark: 'images/hedgeTopMark.png',
  hedgeTopMarkSide: 'images/hedgeTopMarkSide.png',
  hedgeBottomMarkUp: 'images/hedgeBottomMarkUp.png',
  hedgeBottomMarkDown: 'images/hedgeBottomMarkDown.png',
  hedgeBottomMarkRight: 'images/hedgeBottomMarkRight.png',
  hedgeBottomMarkLeft: 'images/hedgeBottomMarkLeft.png',
  caveBackground: 'images/cavebackground1.png',
  apple: 'images/apple.png',
  sprinkler: 'images/sprinkler.png',
  timeRing: 'images/timeRing.png',
})

game.assets.levels = await game.loadText({
  level1: 'levels/level1.json'
})

game.assets.data = await game.loadJson({
  seedSoilRequirements: 'data/seedSoilRequirements.json',
  toolCategories: 'data/toolCategories.json',
})

const tileValues = {
  1: game.assets.images.dirt1,
  2: game.assets.images.dirt2, //'#330517',
  3: game.assets.images.dirt3, //'#b2b2b8',
  4: game.assets.images.dirt4, //'#1d1687',
  16: game.assets.images.ground
}

class Level extends Thing {
  tileGrids = []
  tileSize = 1

  constructor (inputText) {
    super()

    const data = JSON.parse(inputText)

    // The level tile data are stored as chunks, so we can convert it
    // to a spatial grid to make it easier to work with
    this.tileGrids = data.layers.map(({ grid }) => {
      return u.chunkGridToSpatialGrid(grid)
    })

    // Spawn level things
    const things = data.layers[0].things
    for (const thing of things) {
      if (thing.name === 'plantHedge') {
        game.addThing(new PlantHedge(thing.position, thing.data?.variant ?? 'basic', false))
      }
      if (thing.name === 'sprinkler') {
        game.addThing(new Sprinkler(thing.position))
      }
    }

    // Set this Thing's name to level so that it can be accessed by
    // other Things
    game.setThingName(this, 'level')
  }

  draw () {
    const { ctx } = game
    const { tileSize } = this

    // Render the grid tiles as black for now
    for (const [coordString, tileValue] of Object.entries(this.tileGrids[0])) {
      const coord = coordString.split(',').map(x => Number(x) * tileSize)
      const tileVisual = tileValues[tileValue]

      if (typeof tileVisual === 'string') {
        ctx.save()
        ctx.fillStyle = tileVisual
        ctx.fillRect(coord[0], coord[1], tileSize, tileSize)
        ctx.restore()
        continue
      }

      ctx.save()
      ctx.translate(coord[0], coord[1])
      ctx.translate(-8 / 48, -8 / 48)
      ctx.scale(1 / 48, 1 / 48)
      ctx.drawImage(tileVisual, 0, 0)
      ctx.restore()
    }
  }

  // Given a world-space coordinate, check the tile-space position to
  // see if there's a solid tile there
  checkWorldTileCollision (x, y) {
    const tileCoord = [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)]
    return Boolean(this.tileGrids[0][tileCoord])
  }

  getTileAt (x, y) {
    const tileCoord = [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)]
    return this.tileGrids[0][tileCoord] ?? 0
  }
}

game.setScene(() => {
  game.addThing(new Level(game.assets.levels.level1))
  game.addThing(new Background())
  game.addThing(new Shop())
  game.addThing(new Apple())
  game.addThing(new SellZone([10, 8]))
  game.addThing(new Player())
})
