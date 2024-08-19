import * as game from 'game'
import Pickup from './pickup.js'

export default class PickupTool extends Pickup {
  constructor(position, tool, seedVariant='basic') {
    super(position)
    this.tool = tool
    this.sprite = tool
    this.seedVariant = seedVariant
  }

  collect() {
    super.collect()
    const player = game.getThing('player')
    player.unlockTool(this.tool)
  }
}
