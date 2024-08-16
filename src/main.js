import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'

document.title = 'Game'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  guy: 'images/guy.png'
})

game.assets.levels = await game.loadText({
  level1: 'levels/level1.json'
})

class Level extends Thing {
  tileGrids = []
  tileSize = 64

  constructor (inputText) {
    super()

    const data = JSON.parse(inputText)

    // The level tile data are stored as chunks, so we can convert it
    // to a spatial grid to make it easier to work with
    this.tileGrids = data.layers.map(({ grid }) => {
      return u.chunkGridToSpatialGrid(grid)
    })

    // Set this Thing's name to level so that it can be accessed by
    // other Things
    game.setThingName(this, 'level')
  }

  draw () {
    const { ctx } = game
    const { tileSize } = this

    // Render the grid tiles as black for now
    ctx.save()
    ctx.fillStyle ='black'
    for (const [coordString, _tileValue] of Object.entries(this.tileGrids[0])) {
      const coord = coordString.split(',').map(x => Number(x) * tileSize)
      ctx.fillRect(coord[0], coord[1], tileSize, tileSize)
    }
    ctx.restore()
  }

  // Given a world-space coordinate, check the tile-space position to
  // see if there's a solid tile there
  checkWorldTileCollision (x, y) {
    const { tileSize } = this
    const tileCoord = [Math.floor(x / tileSize), Math.floor(y / tileSize)]
    return Boolean(this.tileGrids[0][tileCoord])
  }

  getTileAt (x, y) {
    const { tileSize } = this
    const tileCoord = [Math.floor(x / tileSize), Math.floor(y / tileSize)]
    return this.tileGrids[0][tileCoord]
  }
}

class Test extends Thing {
  sprite = game.assets.images.guy
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 128 }
  }

  update () {
    // Using the default move() method in Thing which handles movement
    // and collision detection as defined by the checkCollision()
    // method
    super.update()

    // Copy the player's position into the camera by value to prevent
    // weird double-reference stuff from happening just in case
    game.getCamera2D().position = [...this.position]

    const onGround = this.contactDirections.down
    const friction = 0.9
    const groundAcceleration = 2
    const airAcceleration = 1
    const acceleration = onGround ? groundAcceleration : airAcceleration
    
    // Calculate what the top speed of the player is on the ground,
    // where friction naturally cancels out any additional
    // acceleration. This is used to cap max player speed in the air
    const maxSpeed = groundAcceleration * friction / (1 - friction)

    // Apply gravity
    this.velocity[1] += 1

    // Friction
    if (onGround) {
      this.velocity[0] *= friction
    }

    // Jump when on ground, and cancel your jump early if you release
    // space
    if (game.keysDown.Space && onGround) {
      this.velocity[1] = -20
    }
    if (!game.keysDown.Space && this.velocity[1] < 0) {
      this.velocity[1] *= 0.7
    }

    // Move left and right, on ground speed is naturally clamped by
    // friction but in the air we have to artificially clamp it
    if (game.keysDown.ArrowRight) {
      this.velocity[0] += acceleration
      if (!onGround) {
        this.velocity[0] = Math.min(this.velocity[0], maxSpeed)
      }
    }
    if (game.keysDown.ArrowLeft) {
      this.velocity[0] -= acceleration
      if (!onGround) {
        this.velocity[0] = Math.max(this.velocity[0], -maxSpeed)
      }
    }
  }

  checkCollision (x, y, z) {
    if (super.checkCollision(x, y, z)) {
      return true
    }

    const w = 15
    const h = 64
    const headRoom = 8 // A little headroom to make low ceilings easier

    // Doing a bunch of point collisions around the perimeter of the
    // player's bounding box with the level's tile grid to simulate a
    // real bounding box collision with the world
    return (
      game.getThing('level').checkWorldTileCollision(x + w, y) ||
      game.getThing('level').checkWorldTileCollision(x - w, y) ||
      game.getThing('level').checkWorldTileCollision(x, y + h) ||
      game.getThing('level').checkWorldTileCollision(x, y - h + headRoom) ||
      game.getThing('level').checkWorldTileCollision(x + w, y + h) ||
      game.getThing('level').checkWorldTileCollision(x - w, y + h) ||
      game.getThing('level').checkWorldTileCollision(x + w, y - h + headRoom) ||
      game.getThing('level').checkWorldTileCollision(x - w, y - h + headRoom)
    )
  }
}

game.setScene(() => {
  game.addThing(new Level(game.assets.levels.level1))
  game.addThing(new Test())
})
