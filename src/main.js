import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'

document.title = 'Game'
game.setWidth(1280)
game.setHeight(720)
game.createCanvas2D()

game.assets.images = await game.loadImages({
  moon: 'images/moon.png'
})

class Test extends Thing {
  sprite = game.assets.images.moon
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 256 }
  }
  position = [game.getWidth() / 2, game.getHeight() / 2]

  update () {
    // Using the default move() method in Thing which handles movement
    // and collision detection as defined by the checkCollision()
    // method
    super.update()

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
    // Overloaded collision check to also consider the bottom of the
    // screen solid
    return super.checkCollision(x, y, z) || y > game.getHeight() - 64
  }
}

game.setScene(() => {
  game.addThing(new Test())
})
