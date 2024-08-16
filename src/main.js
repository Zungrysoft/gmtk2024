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
  velocity = [0.1, 0.1]
  position = [game.getWidth() / 2, game.getHeight() / 2]

  update () {
    super.update()
  }
}

game.setScene(() => {
  game.addThing(new Test())
})
