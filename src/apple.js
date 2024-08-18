import Pickupable from './pickupable.js'

export default class Apple extends Pickupable {
  aabb = [-0.5, -0.5, 0.5, 0.5]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  price = 5
}
