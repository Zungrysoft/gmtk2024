import Pickupable from './pickupable.js'

export default class Fertilizer extends Pickupable {
  aabb = [-0.45, -0.45, 0.45, 0.45]
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }

  constructor(position, type, isAttached=false) {
    super(position, isAttached)
    
    // Types
    if (type === 'ash') {
      this.fertilizerType = 'ash'
      this.sprite = 'ash'
    }
    else {
      this.type = 'apple'
      this.sprite = 'apple'
      this.value = 1
    }
  }
}
