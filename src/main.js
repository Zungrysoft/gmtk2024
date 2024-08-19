import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'
import Player from './player.js'
import PlantHedge from './planthedge.js'
import Background from './background.js'
import Sprinkler from './sprinkler.js'
import Deployer from './deployer.js'
import LaserField from './laserfield.js'
import DrippingCeiling from './drippingceiling.js'
import PickupMoney from './pickupMoney.js'
import PickupTool from './pickuptool.js'

document.title = 'Game'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  guy: 'images/guy3.png',
  plantHedgeSprout: 'images/hedgeSprout.png',
  apple: 'images/apple.png',
  plantApple: 'images/appleTree.png',
  plantAppleSprout: 'images/appleSprout.png',
  orange: 'images/orange.png',
  plantOrangeSprout: 'images/orangeSprout.png',
  plantClock: 'images/clockPlant.png',
  plantClockSprout: 'images/clockSprout.png',
  plantingIndicator: 'images/plantingIndicator.png',
  plantingIndicatorError: 'images/plantingIndicatorError.png',
  waterShotSpeed1: 'images/waterShotSpeed1.png',
  waterShotSpeed2: 'images/waterShotSpeed2.png',
  waterShotSpeed3: 'images/waterShotSpeed3.png',
  waterShotSpeed4: 'images/waterShotSpeed4.png',
  waterDroplet: 'images/waterDroplet.png',
  fertilizerParticle: 'images/fertilizerParticle.png',
  timeRing: 'images/timeRing.png',
  sickle: 'images/sickle.png',
  wateringCan: 'images/wateringcan.png',
  waterGun: 'images/watergun.png',
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
  dustParticle: 'images/dust.png',
  sprinkler: 'images/sprinkler.png',
  ash: 'images/ash.png',
  deployer: 'images/deployer.png',
  timer0: 'images/timer0.png',
  timer1: 'images/timer1.png',
  timer2: 'images/timer2.png',
  timer3: 'images/timer3.png',
  timer4: 'images/timer4.png',
  timer5: 'images/timer5.png',
  timer6: 'images/timer6.png',
  timer7: 'images/timer7.png',
  timer8: 'images/timer8.png',
  timer9: 'images/timer9.png',
  growIconWater: 'images/growIconWater.png',
  growIconNoWater: 'images/growIconNoWater.png',
  growIconFertilizer: 'images/growIconFertilizer.png',
  growIconBlocked: 'images/growIconBlocked.png',
  laserField: 'images/laserField2.png',
  roots: 'images/roots.png',
  drip: 'images/drip.png',
  money: 'images/money.png'
})

game.assets.levels = await game.loadText({
  level1: 'levels/testWorld.json'
})

game.assets.data = await game.loadJson({
  plantingRequirements: 'data/plantingRequirements.json',
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
  depth = -10

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
      const pos = [Math.floor(thing.position[0]), Math.floor(thing.position[1])]
      if (thing.name === 'player') {
        game.addThing(new Player(pos))
      }
      if (thing.name === 'plantHedge') {
        game.addThing(new PlantHedge(
          pos,
          thing.data?.variant ?? 'basic',
          thing.data?.isSprout ?? false,
          thing.data?.isIndestructible ?? true,
        ))
      }
      if (thing.name === 'sprinkler') {
        game.addThing(new Sprinkler(pos))
      }
      if (thing.name === 'deployer') {
        game.addThing(new Deployer(pos, thing.data?.type ?? 'apple'))
      }
      if (thing.name === 'laserField') {
        game.addThing(new LaserField(pos, thing.data?.size ?? [1, 1]))
      }
      if (thing.name === 'drippingCeiling') {
        game.addThing(new DrippingCeiling(pos))
      }
      if (thing.name === 'money') {
        game.addThing(new PickupMoney(pos, thing.data?.money ?? 1))
      }
      if (thing.name === 'tool') {
        game.addThing(new PickupTool(pos, thing.data?.tool ?? 'wateringCan'))
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
    const tilesWide = game.getWidth() / 48
    const tilesTall = game.getHeight() / 48
    const camX = game.getCamera2D().position[0]
    const camY = game.getCamera2D().position[1]
    const minTileX = Math.floor(camX - tilesWide/2)
    const maxTileX = Math.ceil(camX + tilesWide/2)
    const minTileY = Math.floor(camY - tilesTall/2)
    const maxTileY = Math.ceil(camY + tilesTall/2)
    
    for (let x = minTileX; x <= maxTileX; x ++) {
      for (let y = minTileY; y <= maxTileY; y ++) {
        const tileValue = this.tileGrids[0][[x, y]]
        if (tileValue) {
          const tileVisual = tileValues[tileValue]

          if (typeof tileVisual === 'string') {
            ctx.save()
            ctx.fillStyle = tileVisual
            ctx.fillRect(x, y, tileSize, tileSize)
            ctx.restore()
            continue
          }

          ctx.save()
          ctx.translate(x, y)
          ctx.translate(-8 / 48, -8 / 48)
          ctx.scale(1 / 48, 1 / 48)
          ctx.drawImage(tileVisual, 0, 0)
          ctx.restore()
        }
      }
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

  // Used by plants to check if they are clear to grow somewhere
  isTileClear() {
    const tileCoord = [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)]

  }
}

game.setScene(() => {
  game.addThing(new Level(game.assets.levels.level1))
  game.addThing(new Background())
})
