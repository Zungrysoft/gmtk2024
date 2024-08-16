import * as game from 'game'
import * as u from 'utils'
import * as webgl from 'webgl'
import Thing from 'thing'
import City from './city.js'
import FirstPersonCamera from './firstpersoncamera.js'
import Skybox from './skybox.js'

class CameraController2D extends Thing {
  constructor () {
    super()
    game.getCamera2D().position[0] -= game.getWidth() / 2
    game.getCamera2D().position[1] -= game.getHeight() / 2
  }

  update () {
    if (game.mouse.leftButton) {
      const { scale } = game.getCamera2D()
      game.getCamera2D().position[0] -= game.mouse.delta[0] / scale[0]
      game.getCamera2D().position[1] -= game.mouse.delta[1] / scale[1]
    }

    if (game.mouse.scrollDelta[1]) {
      let scale = 1.1
      if (game.mouse.scrollDelta[1] > 0) {
        scale = 1 / scale
      }
      game.getCamera2D().scale[0] *= scale
      game.getCamera2D().scale[1] *= scale
    }
  }
}

document.title = 'Game'
game.setWidth(1280 / 2)
game.setHeight(800 / 2)
game.createCanvas3D({ antialias: false })
game.createCanvas2D()

game.assets.meshSources = await game.loadText({
  cube: 'models/cube.obj',
  cylinder: 'models/cylinder.obj',
  sphere: 'models/sphere.obj',
  plane: 'models/plane.obj',
})

game.assets.meshes = Object.fromEntries(
  Object.entries(game.assets.meshSources).map(([name, meshSource]) => [
    name, webgl.createMesh(meshSource)
  ])
)

game.assets.images = await game.loadImages({
  sky: 'images/skytest4.png',
  grass: 'images/grass.png',
  noise: 'images/noise2.png',
  water: 'images/water1.png',
  building1: 'images/building5.png',
  building2: 'images/building1.png',
  building3: 'images/building6.png',
  sidewalk: 'images/sidewalk.png',
  asphalt: 'images/asphalt.png',
  window: 'images/gradient.png',
  buildingBase1: 'images/base1.png',
  glowMoon: 'images/glowmoon.png'
})

/*
game.assets.textures = Object.fromEntries(
  Object.entries(game.assets.images).map(([name, image]) => [
    name, webgl.createTexture(image, '')
  ])
)
  */
game.assets.textures = game.loadTexturesFromImages(game.assets.images)

game.setScene(() => {
  game.addThing(new CameraController2D())
  // game.addThing(new Skybox())
  game.addThing(new FirstPersonCamera())
  game.addThing(new City())
})
