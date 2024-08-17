import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'
import Plant from './plant.js'
import PlantHedge from './planthedge.js'

export default class Player extends Thing {
  sprite = game.assets.images.guy
  animations = {
    idle: {
      frames: [0],
      speed: 0,
      frameSize: 96
    }
  }
  aabb = [-0.5, -1, 0.5, 1]
  jumpBuffer = 0
  coyoteFrames = 0
  direction = 1
  cameraOffset = [0, 0]
  squash = [1, 1]
  money = 20

  constructor () {
    super()
    game.setThingName(this, 'player')
  }

  update () {
    // If trapped inside something solid, like when getting pushed by
    // a hedge or something, try to get unstuck
    this.getUnstuck()

    // Using the default move() method in Thing which handles movement
    // and collision detection as defined by the checkCollision()
    // method
    this.updateTimers()
    this.move()
    this.animate()

    // Un-squash and stretch
    this.squash[0] = u.lerp(this.squash[0], 1, 0.15)
    this.squash[1] = u.lerp(this.squash[1], 1, 0.15)

    // Camera handling, make sure to offset the camera to look ahead
    // in the direction the player is currently moving or looking
    this.cameraOffset[0] = (
      u.lerp(this.cameraOffset[0], this.direction * 1, 0.05)
    )
    this.cameraOffset[1] = u.lerp(
      this.cameraOffset[1],
      this.velocity[1],
      // The camera should move faster when the player is airborne
      this.velocity[1] === 0 ? 0.05 : 0.1
    )
    this.direction = u.sign(this.velocity[0]) || this.direction
    game.getCamera2D().position = [
      this.position[0] + this.cameraOffset[0],
      this.position[1] + this.cameraOffset[1]
    ]
    game.getCamera2D().scale = [48, 48] // Make one world unit one tile

    const onGround = this.contactDirections.down
    const friction = 0.7
    const groundAcceleration = 3.5 / 48
    const airAcceleration = 0.5 / 48
    const acceleration = onGround ? groundAcceleration : airAcceleration

    // Calculate what the top speed of the player is on the ground,
    // where friction naturally cancels out any additional
    // acceleration. This is used to cap max player speed in the air
    const maxSpeed = groundAcceleration * friction / (1 - friction)

    // Apply gravity
    this.velocity[1] += 1 / 48

    // Coyote frames
    this.coyoteFrames -= 1
    if (onGround) {
      if (this.coyoteFrames < 3) {
        this.squash[1] = 0.5
      }
      this.coyoteFrames = 8
    }

    // Jump when on ground, and cancel your jump early if you release
    // space. Buffer times for pressing space too early (jumpBuffer)
    // and too late (coyoteTime)
    this.jumpBuffer -= 1
    if (game.keysPressed.Space || game.buttonsPressed[0]) {
      this.jumpBuffer = 10
    }
    if (this.jumpBuffer > 0 && this.coyoteFrames > 0) {
      this.velocity[1] = -0.41
      this.jumpBuffer = 0
      this.coyoteFrames = 0
      this.squash[1] = 1.5
      this.squash[0] = 0.5
    }
    if (!(game.keysDown.Space || game.buttonsDown[0]) && this.velocity[1] < 0) {
      this.velocity[1] *= 0.7
    }

    // Move left and right, on ground speed is naturally clamped by
    // friction but in the air we have to artificially clamp it
    if (game.keysDown.ArrowRight || game.buttonsDown[15]) {
      this.velocity[0] += acceleration
      if (!onGround) {
        this.velocity[0] = Math.min(this.velocity[0], maxSpeed)
      }
    }
    if (game.keysDown.ArrowLeft || game.buttonsDown[14]) {
      this.velocity[0] -= acceleration
      if (!onGround) {
        this.velocity[0] = Math.max(this.velocity[0], -maxSpeed)
      }
    }

    // Apply friction
    if (onGround) {
      this.velocity[0] *= friction
    }

    // Debug: water all plants button
    if (game.keysDown.KeyJ) {
      for (const plant of game.getThings().filter(x => x instanceof Plant)) {
        plant.water()
      }
    }

    // Apply scaling
    this.scale[0] = this.direction * this.squash[0] / 48
    this.scale[1] = this.squash[1] / 48
  }

  draw () {
    // Move the sprite down a bit when it's being squashed, so it
    // looks like it's taking off from the ground when the player
    // jumps
    this.drawSprite(...this.position, 0, u.map(this.squash[1], 1, 0.5, 0, 32, true))
  }

  postDraw () {
    if (this.isPaused) { return }
    const { ctx } = game
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'italic bold 64px Arial'
    ctx.translate(64, 128)
    ctx.fillText(`${this.money}$`, 0, 0)
    ctx.restore()
  }

  // Get the player unstuck when trapped in a collision
  getUnstuck () {
    const [xLast, yLast] = this.position
    let a = 0
    let r = 1 / 16
    while (this.checkCollision()) {
      this.position[0] = xLast + Math.cos(a) * r
      this.position[1] = yLast + Math.sin(a) * r
      a += Math.PI * 2 / 4
      if (a > Math.PI * 2) {
        a -= Math.PI * 2
        r += r < 0.25 ? 1 / 48 : 0.25
      }
    }
  }

  checkPointCollision (x, y) {
    if (game.getThing('level').checkWorldTileCollision(x, y)) {
      return true
    }

    const hedgeHits = (
      this.getAllOverlaps()
      .filter(x => x instanceof PlantHedge)
      .some(hedge => (
        hedge.getHitbox().some(hitbox => (
          x >= hitbox[0] &&
          y >= hitbox[1] &&
          x <= hitbox[2] &&
          y <= hitbox[3]
        ))
      ))
    )
    if (hedgeHits) {
      return true
    }
  }

  checkCollision (x = this.position[0], y = this.position[1], z = 0) {
    if (super.checkCollision(x, y, z)) {
      return true
    }

    const w = 0.25
    const h = 1
    const headRoom = 0.4 // A little headroom to make low ceilings easier

    // Doing a bunch of point collisions around the perimeter of the
    // player's bounding box with the level's tile grid to simulate a
    // real bounding box collision with the world
    return (
      this.checkPointCollision(x + w, y) ||
      this.checkPointCollision(x - w, y) ||
      this.checkPointCollision(x, y + h) ||
      this.checkPointCollision(x, y - h + headRoom) ||
      this.checkPointCollision(x + w, y + h) ||
      this.checkPointCollision(x - w, y + h) ||
      this.checkPointCollision(x + w, y - h + headRoom) ||
      this.checkPointCollision(x - w, y - h + headRoom)
    )
  }
}
