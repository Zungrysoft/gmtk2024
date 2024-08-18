import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'
import Player from './player.js'
import PlantHedge from './planthedge.js'
import Shop from './shop.js'
import Background from './background.js'

document.title = 'Game'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  guy: 'images/guy3.png',
  plantHedgeSprout: 'images/hedgeSprout.png',
  selectionBox: 'images/selectionBox.png',
  waterShot: 'images/waterShot.png',
  wateringCan: 'images/wateringcan.png',
})

game.assets.levels = await game.loadText({
  level1: 'levels/level1.json'
})

game.assets.data = await game.loadJson({
  seedSoilRequirements: 'data/seedSoilRequirements.json'
})

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
        game.addThing(new PlantHedge(thing.position, thing.data?.variant ?? 'basic'))
      }
    }

    // Set this Thing's name to level so that it can be accessed by
    // other Things
    game.setThingName(this, 'level')
  }

  draw () {
    const { ctx } = game
    const { tileSize } = this
    const tileValues = {
      1: '#75592f',
      2: '#330517',
      3: '#b2b2b8',
      4: '#1d1687',
    }

    // Render the grid tiles as black for now
    ctx.save()
    for (const [coordString, tileValue] of Object.entries(this.tileGrids[0])) {
      const coord = coordString.split(',').map(x => Number(x) * tileSize)
      ctx.fillStyle = tileValues[tileValue] ?? 'black'
      ctx.fillRect(coord[0], coord[1], tileSize, tileSize)
    }
    ctx.restore()
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
  game.addThing(new Player())
})
