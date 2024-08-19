import * as game from 'game'
import Pickup from './pickup.js'

export default class PickupMoney extends Pickup {
  sprite = 'money'

  constructor(position, money) {
    super(position)
    this.money = money
  }

  collect() {
    super.collect()
    game.getThing('player').money += this.money
  }
}
