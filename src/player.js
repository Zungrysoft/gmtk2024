import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'
import Plant from './plant.js'

export default class Player extends Thing {
  sprite = game.assets.images.guy
  animations = {
    idle: {
      frames: [0],
      speed: 0,
      frameSize: 96
    }
  }
  scale = [1 / 48, 1 / 48]
  jumpBuffer = 0
  coyoteFrames = 0
  direction = 1
  cameraOffset = [0, 0]
  squash = [1, 1]

  update () {
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
    const friction = 0.8
    const groundAcceleration = 2.5 / 48
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
      if (this.coyoteFrames < 5) {
        this.squash[1] = 0.5
      }
      this.coyoteFrames = 6
    }

    // Jump when on ground, and cancel your jump early if you release
    // space. Buffer times for pressing space too early (jumpBuffer)
    // and too late (coyoteTime)
    this.jumpBuffer -= 1
    if (game.keysPressed.Space) {
      this.jumpBuffer = 6
    }
    if (this.jumpBuffer > 0 && this.coyoteFrames > 0) {
      this.velocity[1] = -0.41
      this.jumpBuffer = 0
      this.coyoteFrames = 0
      this.squash[1] = 1.5
      this.squash[0] = 0.5
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

  checkCollision (x, y, z) {
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
