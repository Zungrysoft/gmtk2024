import Pickupable from './pickupable.js'

export default class Fertilizer extends Pickupable {
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }

  constructor(position, type, isAttached=false) {
    super(position, isAttached)
    
    // Types
    if (type === 'ash') {
      this.type = 'ash'
      this.sprite = 'ash'
    }
    else if (type === 'coal') {
      this.type = 'coal'
      this.sprite = 'coal'
    }
    else if (type === 'ether') {
      this.type = 'ether'
      this.sprite = 'ether'
    }
    else if (type === 'orange') {
      this.type = 'orange'
      this.sprite = 'orange'
      this.value = 25
    }
    else if (type === 'banana') {
      this.type = 'banana'
      this.sprite = 'banana'
      this.value = 750
    }
    else {
      this.type = 'apple'
      this.sprite = 'apple'
      this.value = 1
    }
  }
}
