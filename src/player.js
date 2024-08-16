import * as game from 'game'
import * as u from 'utils'
import Thing from 'thing'
import Plant from './plant.js'

export default class Player extends Thing {
    sprite = game.assets.images.guy
    animations = {
      idle: { frames: [0], speed: 0, frameSize: 96 }
    }
    scale = [1 / 48, 1 / 48]
  
    update () {
      // Using the default move() method in Thing which handles movement
      // and collision detection as defined by the checkCollision()
      // method
      //super.update()
      this.updateTimers()
      this.move()
      this.animate()
  
      // Copy the player's position into the camera by value to prevent
      // weird double-reference stuff from happening just in case
      game.getCamera2D().position = [...this.position]
      game.getCamera2D().scale = [48, 48]
  
      const onGround = this.contactDirections.down
      const friction = 0.9
      const groundAcceleration = 2 / 48
      const airAcceleration = 1 / 48
      const acceleration = onGround ? groundAcceleration : airAcceleration
      
      // Calculate what the top speed of the player is on the ground,
      // where friction naturally cancels out any additional
      // acceleration. This is used to cap max player speed in the air
      const maxSpeed = groundAcceleration * friction / (1 - friction)
  
      // Apply gravity
      this.velocity[1] += 1 / 48
  
      // Friction
      if (onGround) {
        this.velocity[0] *= friction
      }
  
      // Jump when on ground, and cancel your jump early if you release
      // space
      if (game.keysDown.Space && onGround) {
        this.velocity[1] = -20 / 40
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

      // Debug: water all plants button
      if (game.keysDown.KeyJ) {
        for (const plant of game.getThings().filter(x => x instanceof Plant)) {
          plant.water()
        }
      }
    }
  
    move (iterations = 16) {
      const dx = this.velocity[0] / iterations
      const dy = this.velocity[1] / iterations
  
      for (const key in this.contactDirections) {
        this.contactDirections[key] = false
      }
  
      for (let i = 0; i < iterations; i += 1) {
        if (this.checkCollision(this.position[0] + dx, this.position[1])) {
          if (u.sign(dx) > 0) { this.contactDirections.right = true }
          if (u.sign(dx) < 0) { this.contactDirections.left = true }
          this.velocity[0] = 0
          break
        }
        this.position[0] += dx
      }
  
      for (let i = 0; i < iterations; i += 1) {
        if (this.checkCollision(this.position[0], this.position[1] + dy)) {
          if (u.sign(dy) > 0) { this.contactDirections.down = true }
          if (u.sign(dy) < 0) { this.contactDirections.up = true }
          this.velocity[1] = 0
          break
        }
        this.position[1] += dy
      }
    }
  
    checkCollision (x, y, z) {
      if (super.checkCollision(x, y, z)) {
        return true
      }
  
      const w = 0.25
      const h = 1
      const headRoom = 0.1 // A little headroom to make low ceilings easier
  
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