import * as game from 'game'

export default class Plant extends Thing {
    validTileTypes = []
    sprite = game.assets.images.guy
    animations = {
      idle: { frames: [0], speed: 0, frameSize: 128 }
    }
  
    canBePlantedAt(pos) {
        const tileType = game.getThing('level').getTileAt(pos)
        const soilType = game.getThing('level').getTileAt([pos[0], pos[1]-1])
        
        // Must be planted in an air tile and on a non-air tile
        if (tileType === 0 && soilType > 0) {
            // Can be planted on any tile
            if (self.validSoilTypes.includes('any')) {
                return true
            }
            
            // Can be planted on any soil tile
            if (self.validSoilTypes.includes('anySoil') && soilType < 16) {
                return true
            }
            
            // Has specific soil requirements
            if (self.validSoilTypes.includes(soilType)) {
                return true
            }
        }

        return false
    }
}
