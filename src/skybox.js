import * as game from 'game'
import * as gfx from 'webgl'
import * as mat from 'matrices'
import * as u from 'utils'
import Thing from 'thing'

export default class Skybox extends Thing {
  time = 0

  update () {
    this.time += 1 / 60
  }

  draw () {
    const { assets } = game

    const scale = 10_000

    // Skybox
    gfx.setShader(gfx.defaultShader)
    gfx.set('color', [1, 1, 1, 1])
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.sky)
    gfx.set('modelMatrix', mat.getTransformation({
      position: game.getCamera3D().position,
      scale: [scale, scale, -scale]
    }))
    gfx.drawMesh(game.assets.meshes.sphere)
    gfx.setTexture()

    // Ocean
    /*
    for (let i = 0; i <= 5; i += 1) {
      if (i === 5) {
        gfx.setShader(game.assets.shaders.water)
        gfx.set('time', this.time / 12)
        game.getCamera3D().setUniforms()
        gfx.setTexture(assets.textures.noise)
      } else {
        gfx.setTexture(game.assets.textures.blank)
        gfx.set('color', [0, 85 / 255, 1, i == 0 ? 1 : 0.45])
      }
      gfx.set('modelMatrix', mat.getTransformation({
        position: [
          game.getCamera3D().position[0],
          game.getCamera3D().position[1],
          u.map(i, 0, 5, -5, 0)
        ],
        scale: 1000
      }))
      gfx.drawMesh(game.assets.meshes.plane)
    }
    */

    // Water
    /*
    gfx.setShader(game.assets.shaders.water)
    gfx.set('time', this.time / 12)
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.noise)
    gfx.set('modelMatrix', mat.getTransformation({
      position: [game.getCamera3D().position[0], game.getCamera3D().position[1], 0],
      scale: 500
    }))
    gfx.drawMesh(game.assets.meshes.plane)
    */

    // Water
    /*
    gfx.setShader(game.assets.shaders.scrolling)
    gfx.set('offset', [this.time / 12, 0])
    gfx.set('scale', 1 / 24)
    gfx.set('color', [1, 1, 1, 1])
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.water)
    gfx.set('modelMatrix', mat.getTransformation({
      position: [game.getCamera3D().position[0], game.getCamera3D().position[1], 0],
      scale: 800
    }))
    gfx.drawMesh(game.assets.meshes.plane)
    */

    // Clouds
    /*
    gfx.setShader(game.assets.shaders.scrolling)
    gfx.set('offset', [this.time / 100, 0])
    gfx.set('scale', 1 / 500)
    gfx.set('color', [1, 1, 1, 0.75])
    game.getCamera3D().setUniforms()
    gfx.setTexture(assets.textures.clouds)
    gfx.set('modelMatrix', mat.getTransformation({
      position: [game.getCamera3D().position[0], game.getCamera3D().position[1], 250],
      scale
    }))
    gfx.drawMesh(game.assets.meshes.plane)
    */
  }
}
