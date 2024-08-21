import Thing from 'thing'

export default class WaterDeliverer extends Thing {
  lifeTime = 10
  plant = null
  aabb = null
  
  constructor (plant, duration) {
    super()
    
    this.plant = plant
    this.lifeTime = duration
  }

  update () {
    if (this.plant) {
      this.plant.water()
    }
    else {
      this.isDead = true
    }

    this.lifeTime --
    if (this.lifeTime < 0) {
      this.isDead = true
    }
  }
}
