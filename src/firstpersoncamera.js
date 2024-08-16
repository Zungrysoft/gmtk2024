import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import Thing from 'thing'

export default class FirstPersonCamera extends Thing {
  direction = u.angleTowards(
    0, 0,
    game.getCamera3D().lookVector[0], game.getCamera3D().lookVector[1]
  )
  pitch = 0

  constructor () {
    super()
    game.setThingName(this, 'player')
  }

  update () {
    const camera = game.getCamera3D()
    let speed = game.keysDown.ShiftLeft ? 10 : 2
    if (game.keysDown.ControlLeft) {
      speed = 0.25
    }

    if (game.keysDown.KeyA) {
      camera.position[0] -= Math.cos(this.direction + Math.PI / 2) * speed
      camera.position[1] -= Math.sin(this.direction + Math.PI / 2) * speed
    }

    if (game.keysDown.KeyW) {
      camera.position[0] += Math.cos(this.direction) * speed
      camera.position[1] += Math.sin(this.direction) * speed
    }

    if (game.keysDown.KeyD) {
      camera.position[0] += Math.cos(this.direction + Math.PI / 2) * speed
      camera.position[1] += Math.sin(this.direction + Math.PI / 2) * speed
    }

    if (game.keysDown.KeyS) {
      camera.position[0] -= Math.cos(this.direction) * speed
      camera.position[1] -= Math.sin(this.direction) * speed
    }

    if (game.keysDown.KeyE) {
      camera.position[2] += speed
    }

    if (game.keysDown.KeyQ) {
      camera.position[2] -= speed
    }

    if (game.mouse.leftClick) {
      game.mouse.lock()
    }
    if (game.mouse.isLocked()) {
      this.direction += game.mouse.rawDelta[0] / 500
      this.pitch -= game.mouse.rawDelta[1] / 500
      this.pitch = u.clamp(this.pitch, -Math.PI / 2, Math.PI / 2)
      camera.lookVector = vec3.anglesToVector(this.direction, this.pitch)
    }

    camera.updateMatrices()
  }
}
