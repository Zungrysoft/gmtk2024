import Pickupable from './pickupable.js'
import * as vec2 from 'vector2'

export default class Fertilizer extends Pickupable {
  animations = {
    idle: { frames: [0], speed: 0, frameSize: 48 }
  }

  constructor(position, type, isAttached=false, isGiant=false) {
    super(position, isAttached)

    if (isGiant) {
      this.isGiant = true
      this.scale *= 2
      this.aabb = [-0.9, -0.9, 0.9, 0.9]
      this.isPickupable = false
      this.position = vec2.add(this.position, [0.5, 0.5])
    }
    
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
    else if (type === 'powder') {
      this.type = 'powder'
      this.sprite = 'powder'
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
    else if (type === 'blueberry') {
      this.type = 'blueberry'
      this.sprite = 'blueberry'
      this.value = 50000
    }
    else {
      this.type = 'apple'
      this.sprite = 'apple'
      this.value = 1
    }
  }
}
