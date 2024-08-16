import * as game from 'game'
import Thing from 'thing'

export default class Plant extends Thing {
    validTileTypes = []
    isSprout = true
    isPotted = false
    timeSinceWatered = 0
    variant = 'basic'

    constructor (pos) {
        super()
        this.position = pos
      }
  
    canBePlantedAt(pos) {
        const tileType = game.getThing('level').getTileAt(pos)
        const soilType = game.getThing('level').getTileAt([pos[0], pos[1]-1])
        
        // Must be planted in an air tile and on a non-air tile
        if (tileType === 0 && soilType > 0) {
            // Can be planted on any tile
            if (this.validSoilTypes.includes('any')) {
                return true
            }
            
            // Can be planted on any soil tile
            if (this.validSoilTypes.includes('anySoil') && soilType < 16) {
                return true
            }
            
            // Has specific soil requirements
            if (this.validSoilTypes.includes(soilType)) {
                return true
            }
        }

        return false
    }

    update() {
        this.timeSinceWatered ++
    }

    water() {
        this.timeSinceWatered = 0
    }

    isBeingWatered() {
        return this.timeSinceWatered <= 1
    }
 
    collide(other) {
        return false
    }
}
