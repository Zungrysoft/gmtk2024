import Pickupable from './pickupable.js'

export default class Apple extends Pickupable {
  aabb = [-0.45, -0.45, 0.45, 0.45]
  sprite = 'apple'
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }
  price = 5
}
