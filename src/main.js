import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as webgl from 'webgl'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import Player from './player.js'
import PlantHedge from './planthedge.js'
import Background from './background.js'
import Sprinkler from './sprinkler.js'
import Deployer from './deployer.js'
import LaserField from './laserfield.js'
import DrippingCeiling from './drippingceiling.js'
import PickupMoney from './pickupmoney.js'
import PickupTool from './pickuptool.js'
import SellZone from './sellzone.js'
import Shop from './shop.js'
import Gate from './gate.js'
import Tutorial from './tutorial.js'
import Fertilizer from './fertilizer.js'
import Dribbler from './dribbler.js'
import DeployerSwitch from './deployerswitch.js'
import PlantFan from './plantFan.js'
import PlantClock from './plantclock.js'
import Pickup from './pickup.js'
import Completion from './completion.js'

document.title = 'Growbot'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  guy: 'images/guy3.png',
  plantHedgeSprout: 'images/hedgeSprout.png',
  apple: 'images/apple.png',
  plantApple: 'images/appleTree.png',
  plantAppleSprout: 'images/appleSprout.png',
  seedPacketApple: 'images/seedPacketApple.png',
  orange: 'images/orange.png',
  plantOrangeSprout: 'images/orangeSprout.png',
  seedPacketOrange: 'images/seedPacketOrange.png',
  banana: 'images/banana.png',
  plantBananaSprout: 'images/bananaSprout.png',
  seedPacketBanana: 'images/seedPacketBanana.png',
  blueberry: 'images/blueberry.png',
  plantBlueberrySprout: 'images/blueberrySprout.png',
  seedPacketBlueberry: 'images/seedPacketBlueberry.png',
  plantClock: 'images/clockPlant.png',
  plantClockSprout: 'images/clockSprout.png',
  seedPacketClock: 'images/seedPacketClock.png',
  plantFan: 'images/fanPlant.png',
  plantFanSprout: 'images/fanSprout.png',
  seedPacketFan: 'images/seedPacketFan.png',
  plantingIndicator: 'images/plantingIndicator.png',
  plantingIndicatorError: 'images/plantingIndicatorError.png',
  waterShotSpeed1: 'images/waterShotSpeed1.png',
  waterShotSpeed2: 'images/waterShotSpeed2.png',
  waterShotSpeed3: 'images/waterShotSpeed3.png',
  waterShotSpeed4: 'images/waterShotSpeed4.png',
  waterDroplet: 'images/waterDroplet.png',
  fireShot: 'images/fireShot.png',
  fireParticle: 'images/fireParticle.png',
  smokeParticle: 'images/smokeParticle.png',
  fertilizerParticle: 'images/fertilizerParticle.png',
  timeRing: 'images/timeRing.png',
  sickle: 'images/sickle.png',
  wateringCan: 'images/wateringcan.png',
  waterGun: 'images/watergun.png',
  hose: 'images/hose.png',
  flamethrower: 'images/flamethrower.png',
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
  seedPacketHedge: 'images/seedPacketHedge.png',
  caveBackground: 'images/cavebackground1.png',
  dustParticle: 'images/dust.png',
  sprinkler: 'images/sprinkler.png',
  dribbler: 'images/dribbler.png',
  ash: 'images/ash.png',
  coal: 'images/coal.png',
  ether: 'images/ether.png',
  powder: 'images/powder.png',
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
  money: 'images/money.png',
  gateblue: 'images/gateBlue.png',
  gatered: 'images/gateRed.png',
  gategreen: 'images/gateGreen.png',
  gateyellow: 'images/gateYellow.png',
  keyblue: 'images/keyBlue.png',
  keyred: 'images/keyRed.png',
  keygreen: 'images/keyGreen.png',
  keyyellow: 'images/keyYellow.png',
  tutorialcontrols: 'images/tutorialControls.png',
  tutorialtool: 'images/tutorialtool.png',
  tutorialgrab: 'images/tutorialgrab.png',
  tutorialgrab2: 'images/tutorialgrab2.png',
  tutorialgrab3: 'images/tutorialGrab3.png',
  tutorialswitch: 'images/tutorialswitch.png',
  tutorialshop: 'images/tutorialshop.png',
  tutorialmode: 'images/tutorialMode.png',
  tutorialmode2: 'images/tutorialMode2.png',
  tutorialwin: 'images/tutorialWin.png',
  tutorialarch: 'images/tutorialArch.png',
  tutorialfan: 'images/tutorialFan.png',
  tutorialrecipes: 'images/tutorialRecipes.png',
  vendingmachine: 'images/vendingmachine.png',
  swipe: 'images/swipe.png',
  leafParticle: 'images/leafParticle.png',
  switch: 'images/switch.png',
  switchDown: 'images/switchDown.png',
  sellZone: 'images/sellzone.png',
  timerBlocked: 'images/timerBlocked.png',
  fanPlantIcon: 'images/fanPlantIcon.png'
})

game.assets.levels = await game.loadText({
  level1: 'levels/gameWorld.json'
})

game.assets.data = await game.loadJson({
  plantingRequirements: 'data/plantingRequirements.json',
  toolCategories: 'data/toolCategories.json',
})

game.assets.sounds = await game.loadAudio({
  jump: 'sounds/jump.wav',
  land: 'sounds/Shooting Bow&Arrow 13.wav',
  drive: 'sounds/engine-6000.mp3',
  drip: 'sounds/water-dripping-63539.wav',
  drip1: 'sounds/water-dripping-63539.wav',
  drip2: 'sounds/water-dripping-63539.wav',
  sprinkle: 'sounds/spray-87676.mp3',
  sprinklerSprinkle: 'sounds/spray-87676.mp3',
  uitoggle1: 'sounds/uitoggle1.wav',
  uitoggle2: 'sounds/uitoggle2.wav',
  sell: 'sounds/Cash register 5.wav',
  buy: 'sounds/Item purchase 21.wav',
  sickle: 'sounds/sickle.wav',
  getcoin: 'sounds/getcoin.wav',
  killplant: 'sounds/killplant.wav',
  growplant: 'sounds/growplant.wav',
  plantplant: 'sounds/plantplant.wav',
  realplantplant: 'sounds/realplantplant.wav',
  fire: 'sounds/fire.wav',
  fire1: 'sounds/fire.wav',
  fire2: 'sounds/fire.wav',
  upgrade: 'sounds/upgrade.wav',
  resetclick: 'sounds/resetclick.wav',
  opengate: 'sounds/opengate.wav',
  getpoints: 'sounds/getpoints.wav',
  getpoints1: 'sounds/getpoints.wav',
  getpoints2: 'sounds/getpoints.wav',
  getpoints3: 'sounds/getpoints.wav',
  getpoints4: 'sounds/getpoints.wav',
  feedplant: 'sounds/feedplant.wav',
  error: 'sounds/error.wav',
  fan: 'sounds/fan.mp3',
  energy: 'sounds/energy.wav',
  music1: 'sounds/music2.ogg'
})
soundmanager.setSoundsTable(game.assets.sounds)

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
        if (!game.getThing('player')) {
          game.addThing(new Player(pos))
        }
      }
      if (thing.name === 'plantHedge') {
        game.addThing(new PlantHedge(
          pos,
          thing.data?.variant ?? 'basic',
          thing.data?.isSprout ?? false,
          thing.data?.isIndestructible ?? true,
        ))
      }
      if (thing.name === 'plantFan') {
        game.addThing(new PlantFan(
          pos,
          thing.data?.variant ?? 'basic',
          thing.data?.isSprout ?? false,
          thing.data?.isIndestructible ?? true,
        ))
      }
      if (thing.name === 'plantClock') {
        game.addThing(new PlantClock(
          pos,
          thing.data?.variant ?? 'basic',
          thing.data?.isSprout ?? false,
          thing.data?.isIndestructible ?? true,
        ))
      }
      if (thing.name === 'sprinkler') {
        game.addThing(new Sprinkler(vec2.add(pos, [0.5, 0.5]), thing.data?.power ?? 1))
      }
      if (thing.name === 'dribbler') {
        game.addThing(new Dribbler(vec2.add(pos, [0.5, 0.5]), thing.data?.direction ?? 1))
      }
      if (thing.name === 'deployer') {
        game.addThing(new Deployer(
          pos,
          thing.data?.type ?? 'apple',
          thing.data?.isGiant ?? false,
        ))
      }
      if (thing.name === 'deployerSwitch') {
        game.addThing(new DeployerSwitch(pos, thing.data?.radius ?? 10))
      }
      if (thing.name === 'fertilizer') {
        game.addThing(new Fertilizer(
          vec2.add(pos, [0.5, 0.5]),
          thing.data?.type ?? 'apple',
          false,
          thing.data?.isGiant ?? false,
        ))
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
      if (thing.name === 'sellZone') {
        game.addThing(new SellZone(pos))
      }
      if (thing.name === 'shop') {
        game.addThing(new Shop(pos))
      }
      if (thing.name === 'gate') {
        game.addThing(new Gate(pos, thing.data?.color ?? 'yellow'))
      }
      if (thing.name === 'tutorial') {
        game.addThing(new Tutorial(pos, thing.data?.tutorial ?? 'controls'))
      }
      if (thing.name === 'completion') {
        game.addThing(new Completion(pos))
      }
    }

    game.getThing('player').totalPickups = game.getThings().filter(x => x instanceof Pickup).length

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
  isTileClear(pos, thing) {
    const [x, y] = pos
    const tileCoord = [Math.floor(x / this.tileSize), Math.floor(y / this.tileSize)]
    if (this.tileGrids[0][tileCoord]) {
      return false
    }
    const plants = game.getThingsNear(...pos, 1).filter(e => e.collideWithAabb && e !== thing)
    for (const plant of plants) {
      if (plant.collideWithAabb([0.05, 0.05, 0.95, 0.95], tileCoord)) {
        return false
      }
      if (plant.position[0] === pos[0] && plant.position[1] === pos[1]) {
        return false
      }
    }
    return true
  }
}

game.setScene(() => {
  game.addThing(new Level(game.assets.levels.level1))
  game.addThing(new Background())
})
