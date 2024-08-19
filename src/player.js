import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as collisionutils from './collisionutils.js'
import Thing from 'thing'
import Plant from './plant.js'
import PlantHedge from './planthedge.js'
import WaterShot from './watershot.js'
import PlantApple from './plantapple.js'
import PlantClock from './plantclock.js'
import PlantOrange from './plantorange.js'
import Gate from './gate.js'

export default class Player extends Thing {
  sprite = game.assets.images.guy
  animations = {
    idle: {
      frames: [0, 1],
      speed: 0.04,
      frameSize: 96
    },
    run: {
      frames: [2],
      speed: 0,
      frameSize: 96
    },
    walk: {
      frames: [3],
      speed: 0,
      frameSize: 96
    },
    jump: {
      frames: [8],
      speed: 0,
      frameSize: 96
    },
    fall: {
      frames: [9],
      speed: 0,
      frameSize: 96
    },
    runJump: {
      frames: [10],
      speed: 0,
      frameSize: 96
    },
    runFall: {
      frames: [11],
      speed: 0,
      frameSize: 96
    },
    grab: { frames: [4], speed: 0, frameSize: 96 },
    unlock: { frames: [12], speed: 0, frameSize: 96 },
  }
  aabb = [-0.25, -0.25, 0.25, 1]
  jumpBuffer = 0
  time = 0
  coyoteFrames = 0
  direction = 1
  cameraOffset = [0, 0]
  squash = [1, 1]
  ownedTools = []
  selectedTools = {
    seedPacket: '',
    wateringDevice: '',
    trimmer: '',
  }
  selectedToolCategory = 'trimmer'
  money = 0
  visualMoney = 0
  depth = 10
  runFrames = 0
  wateringDeviceCooldowns = [0, 0, 0]
  placementPositionIndicatorScale = 1
  pickup = null // The thing you're currently picking up
  unlockAnimationItemImage = null
  unlockAnimationItemDescription = null
  isUnlockAnimationActive = false
  timer = 0
  isUsingSelectedTool = false
  keyColors = []

  constructor (position) {
    super()
    this.position = [...position]
    game.setThingName(this, 'player')
  }

  update () {
    this.timer += 1

    if (this.isUnlockAnimationActive) {
      this.animation = 'unlock'
      this.updateTimers()
      this.animate()

      if (
        Object.values(game.keysPressed).some(Boolean) ||
        Object.values(game.buttonsPressed).some(Boolean)
      ) {
        this.isUnlockAnimationActive = false
        this.unlockAnimationCancel()
        this.unlockAnimationCancel = undefined
      }

      return
    }

    // If trapped inside something solid, like when getting pushed by
    // a hedge or something, try to get unstuck
    this.getUnstuck()

    // Using the default move() method in Thing which handles movement
    // and collision detection as defined by the checkCollision()
    // method
    this.updateTimers()
    this.move()
    this.animate()

    if (this.pickup) {
      const snappiness = 0.7
      this.pickup.position[0] = u.lerp(
        this.pickup.position[0],
        this.position[0] + this.direction * 0.8,
        snappiness
      )
      this.pickup.position[1] = this.position[1]
      this.pickup.velocity[0] = this.velocity[0]
      this.pickup.velocity[1] = this.velocity[1]
    }

    // Un-squash and stretch
    this.squash[0] = u.lerp(this.squash[0], 1, 0.15)
    this.squash[1] = u.lerp(this.squash[1], 1, 0.15)

    this.visualMoney = u.lerp(this.visualMoney, this.money, 0.1)

    // Camera handling, make sure to offset the camera to look ahead
    // in the direction the player is currently moving or looking
    this.cameraOffset[0] = (
      u.lerp(this.cameraOffset[0], this.direction * 1, 0.05)
    )
    this.cameraOffset[1] = u.lerp(
      this.cameraOffset[1],
      this.velocity[1],
      // The camera should move faster when the player is airborne
      this.velocity[1] === 0 ? 0.05 : 0.1
    )
    game.getCamera2D().position = [
      this.position[0] + this.cameraOffset[0],
      this.position[1] + this.cameraOffset[1]
    ]
    game.getCamera2D().scale = [48, 48] // Make one world unit one tile

    const runThreshold = 0.165

    // Switch running / walking / idle animation depending on speed
    this.animation = Math.abs(this.velocity[0]) < runThreshold ? 'walk' : 'run'
    if (Math.abs(this.velocity[0]) < 0.08) {
      this.animation = 'idle'
      this.runFrames = 0
    } else {
      this.runFrames += 1
      if (this.runFrames % 4 === 0 && this.contactDirections.down) {
        game.addThing(new DustParticle(
          [
            this.position[0] - this.direction * u.random(0.1, 0.3),
            this.position[1] + 0.9
          ],
          [
            u.random(this.direction * -0.02, this.direction * -0.04),
            u.random(-0.001, -0.01)
          ]
        ))
      }
    }
    if (this.velocity[1] < 0) {
      this.animation = (
        Math.abs(this.velocity[0]) < runThreshold
          ? 'jump'
          : 'runJump'
      )
    }
    if (this.velocity[1] > 0.03) {
      this.animation = (
        Math.abs(this.velocity[0]) < runThreshold
          ? 'fall'
          : 'runFall'
      )
    }
    if (this.velocity[1] > 0.06) {
      this.animation = Math.abs(this.velocity[0]) < runThreshold ? 'fall' : 'runFall'
    }

    const usingItem = game.keysDown.KeyA || game.buttonsDown[2]
    this.isUsingSelectedTool = usingItem
    const holdingItem = (
      (
        this.pickup ||
        ['wateringCan', 'waterGun'].includes(this.getSelectedTool())
      )
    )
    if (usingItem || holdingItem) {
      this.animation = 'grab'
    }

    const onGround = this.contactDirections.down
    const friction = usingItem && holdingItem ? 0.6 : 0.7
    const groundAcceleration = 3.5 / 48
    const airAcceleration = 0.5 / 48
    const acceleration = onGround ? groundAcceleration : airAcceleration

    // Calculate what the top speed of the player is on the ground,
    // where friction naturally cancels out any additional
    // acceleration. This is used to cap max player speed in the air
    const maxSpeed = groundAcceleration * friction / (1 - friction)

    // Apply gravity
    this.velocity[1] += 1 / 48

    // Chug along when running
    if (this.runFrames > 0 && onGround) {
      const s = Math.sin(this.runFrames * Math.PI * 2 / 10)
      this.squash[1] = u.map(s, -1, 1, 1, 0.93, true)
    }

    // Coyote frames
    this.coyoteFrames -= 1
    if (onGround) {
      if (this.coyoteFrames < 3) {
        this.squash[1] = 0.5
        for (let i = 0; i < 3; i += 1) {
          const dir = u.choose([1, -1])
          game.addThing(new DustParticle(
            [
              this.position[0] + u.random(-0.1, 0.1),
              this.position[1] + 0.9
            ],
            [
              u.random(dir * -0.02, dir * -0.04),
              u.random(-0.001, -0.01)
            ]
          ))
        }
      }
      this.coyoteFrames = 8
    }

    // Jump when on ground, and cancel your jump early if you release
    // space. Buffer times for pressing space too early (jumpBuffer)
    // and too late (coyoteTime)
    this.jumpBuffer -= 1
    if (game.keysPressed.Space || game.buttonsPressed[0]) {
      this.jumpBuffer = 10
    }
    if (this.jumpBuffer > 0 && this.coyoteFrames > 0) {
      this.velocity[1] = -0.41
      this.jumpBuffer = 0
      this.coyoteFrames = 0
      this.squash[1] = 1.5
      this.squash[0] = 0.5
    }
    if (!(game.keysDown.Space || game.buttonsDown[0]) && this.velocity[1] < 0) {
      this.velocity[1] *= 0.7
    }

    // Move left and right, on ground speed is naturally clamped by
    // friction but in the air we have to artificially clamp it
    if (game.keysDown.ArrowRight || game.buttonsDown[15]) {
      this.velocity[0] += acceleration
      if (!onGround) {
        this.velocity[0] = Math.min(this.velocity[0], maxSpeed)
      }
      if (!usingItem) {
        this.direction = u.sign(this.velocity[0]) || this.direction
      }
    }
    if (game.keysDown.ArrowLeft || game.buttonsDown[14]) {
      this.velocity[0] -= acceleration
      if (!onGround) {
        this.velocity[0] = Math.max(this.velocity[0], -maxSpeed)
      }
      if (!usingItem) {
        this.direction = u.sign(this.velocity[0]) || this.direction
      }
    }

    // Apply friction
    if (onGround) {
      this.velocity[0] *= friction
    }
    
    // ==============
    // Player actions
    // ==============

    // Grab objects
    if (game.keysPressed.KeyD || game.buttonsPressed[1]) {
      let nextPickup
      const grabPosition = [
        this.position[0] + this.direction * 0.5,
        this.position[1]
      ]
      const grabAabb = [-0.5, -0.5, 0.5, 1]
      for (const thing of game.getThingsInAabb(grabAabb, grabPosition)) {
        if (thing.isPickupable && thing !== this.pickup) {
          nextPickup = thing
          break
        }
      }
      this.pickup = nextPickup
    }

    // Switch tool category
    if (game.keysPressed.KeyS || game.buttonsPressed[3]) {
      this.cycleToolCategory()
    }

    // Switch sub tool
    if (game.keysPressed.KeyQ || game.buttonsPressed[4]) {
      this.cycleTool(true)
    }

    // Switch sub tool reverse
    if (game.keysPressed.KeyE || game.buttonsPressed[5]) {
      this.cycleTool(false)
    }

    // Use tool
    if (game.keysDown.KeyA || game.buttonsDown[2]) {
      this.useTool(game.keysPressed.KeyA || game.buttonsPressed[2])
    }

    if (game.keysPressed.KeyU) {
      this.unlockTool('wateringCan')
    }

    // Unlock all tools cheat
    if (game.keysDown.ShiftLeft && game.keysPressed.KeyJ) {
      this.unlockAllToolsCheat()
    }

    if (onGround && this.getSelectedTool().includes('seedPacket')) {
      this.placementPositionIndicatorScale = Math.min(this.placementPositionIndicatorScale + 0.2, 1.3)
    }
    else {
      this.placementPositionIndicatorScale = Math.max(this.placementPositionIndicatorScale - 0.2, -0.6)
    }
    this.placementPositionIndicatorFollow = Math.abs(this.velocity[0]) >= 0.1

    // Apply scaling
    this.scale[0] = this.direction * this.squash[0] / 48
    this.scale[1] = this.squash[1] / 48

    // Time trackers
    this.time ++
    for (let i = 0; i < this.wateringDeviceCooldowns.length; i ++) {
      this.wateringDeviceCooldowns[i] = Math.max(this.wateringDeviceCooldowns[i] - 1, 0)
    }
  }

  useTool(pressed) {
    const selectedTool = this.getSelectedTool()

    // Sickle
    if (selectedTool === 'sickle' && pressed) {
      // Simple implementation for now
      const plants = game.getThingsNear(...this.position, 2).filter(x => x.overlapWithAabb)
      for (const plant of plants) {
        if (plant.overlapWithAabb([-0.3, -0.3, 0.3, 0.3], vec2.add(this.position, [this.direction * 0.7, 0]))) {
          if (plant.isIndestructible) {
            // TODO: Play sound effect indicating failure to destroy plant
          }
          else {
            plant.destroy()
          }
        }
      }
    }

    // Watering Can: Spills water in front of the player
    if (selectedTool === 'wateringCan') {
      for (let i = 0; i < this.wateringDeviceCooldowns.length; i ++) {
        if (this.wateringDeviceCooldowns[i] === 0) {
          this.wateringDeviceCooldowns[i] = Math.floor(Math.random() * 9 + 2)
          const pos = vec2.add(this.position, [this.direction * 1.3, 0.3])
          this.shootWater(pos, this.direction, 0.4, 0.05 + this.velocity[0] * this.direction, 0.06)
          break
        }
      }
    }

    // Water gun: Long range water delivery apparatus
    else if (selectedTool === 'waterGun') {
      for (let i = 0; i < this.wateringDeviceCooldowns.length; i ++) {
        if (this.wateringDeviceCooldowns[i] === 0) {
          this.wateringDeviceCooldowns[i] = Math.floor(Math.random() * 8 + 2)
          const pos = vec2.add(this.position, [this.direction * 0.4, 0.3])
          this.shootWater(pos, this.direction, 0.7, 0.6 + this.velocity[0] * this.direction, 0.05)
          break
        }
      }
    }

    // Seed packet: Plants new plants
    else if (selectedTool.includes('seedPacket')) {
      const placementPos = this.getPlacementPosition()
      const tileReqs = game.assets.data.plantingRequirements[selectedTool]
      // Check tile type
      if (this.canBePlantedAt(placementPos, tileReqs)) {
        // Create Thing based on seed packet type
        if (selectedTool === 'seedPacketHedge') game.addThing(new PlantHedge(placementPos))
        if (selectedTool === 'seedPacketApple') game.addThing(new PlantApple(placementPos))
        if (selectedTool === 'seedPacketOrange') game.addThing(new PlantOrange(placementPos))
        if (selectedTool === 'seedPacketClock') game.addThing(new PlantClock(placementPos))
      }
    }
  }

  shootWater(position, direction, scale, speed, spread) {
    // const r1 = Math.random()
    // const r2 = Math.random()
    // const vx = (Math.sqrt(r1)*2 - 1) * 0.06
    // const vy = (Math.sqrt(r2)*2 - 1) * 0.06
    // this.velocity = vec2.add(this.velocity, [vx, vy])

    // Randomly vary velocity
    let vel = direction > 0 ? [speed, -0.1] : [-speed, -0.1]
    const r1 = Math.random()
    const r2 = Math.random()
    const vx = (Math.sqrt(r1)*2 - 1) * spread * direction
    const vy = (Math.sqrt(r2)*2 - 1) * spread * 0.5
    vel = vec2.add(vel, [vx, vy])

    // Randomly vary position
    const dx = (Math.random()*2 - 1) * speed * 0.5
    const pos = vec2.add(position, [dx, 0])

    game.addThing(new WaterShot(pos, vel, scale))
  }

  getPlacementPosition() {
    return [
      Math.floor(this.position[0]),
      Math.floor(this.position[1] + 0.5),
    ]
  }

  updatePlacementPositionVisual() {
    const pp = vec2.add(this.getPlacementPosition(), [0, 1])
    let lerpRate = 0.3
    if (this.placementPositionIndicatorFollow) {
      pp[0] = this.position[0] - 0.5
      lerpRate = 0.6
    }
    if (this.placementPositionVisual) {
      this.placementPositionVisual = vec2.lerp(this.placementPositionVisual, pp, lerpRate)
    }
    else {
      this.placementPositionVisual = pp
    }
  }

  canBePlantedAt(pos, plantingRequirements) {
    const validTileTypes = plantingRequirements.soil ?? 'anySoil'
    const spacing = plantingRequirements.spacing ?? 0
    const tileType = game.getThing('level').getTileAt(...pos)
    const soilType = game.getThing('level').getTileAt(pos[0], pos[1]+1)

    // Must be planted in an air tile and on a non-air tile
    if (tileType === 0 && soilType > 0) {
      // Can be planted on any tile
      if (
        validTileTypes.includes('any') ||
        (validTileTypes.includes('anySoil') && soilType < 16) ||
        validTileTypes.includes(soilType)
      ) {
        // Can't plant on top of another plant
        // Sprouts are always 1x1, so only check that square
        let collided = false
        const plants = game.getThingsNear(...pos, 1).filter(e => e.collideWithAabb)
        for (const plant of plants) {
          if (plant.collideWithAabb([0.05, 0.05, 0.95, 0.95], pos)) {
            collided = true
            break
          }
          if (plant.position[0] === pos[0] && plant.position[1] === pos[1]) {
            collided = true
            break
          }
        }
        if (!collided) {
          return true
        }
      }
    }

    return false
  }

  unlockTool (tool) {
    if (!this.ownedTools.includes(tool)) {
      this.ownedTools.push(tool)
      this.setSelectedTool(tool)
    }

    // TODO: Play ITEM GET animation and sound

    const nameMap = {
      waterGun: 'Water Gun',
      wateringCan: 'Watering Can'
    }

    const descMap = {
      waterGun: 'Shoot water even farther!',
      wateringCan: 'Press A to water plants.'
    }

    this.unlockAnimationItemImage = tool
    this.unlockAnimationName = nameMap[tool] || tool
    this.unlockAnimationItemDescription = descMap[tool] || ''
    this.isUnlockAnimationActive = true
    const wasPaused = new WeakMap()
    game.getThings().forEach(thing => {
      wasPaused.set(thing, thing.isPaused)
      thing.isPaused = thing !== this
    })

    this.unlockAnimationCancel = () => {
      game.getThings().forEach(thing => {
        if (thing === this) { return }
        thing.isPaused = wasPaused.get(thing)
      })
    }
  }

  unlockAllToolsCheat () {
    let allTools = []
    for (const toolCategory of this.getToolCategories()) {
      for (const tool of toolCategory.tools) {
        allTools.push(tool)
      }
    }
    this.ownedTools = allTools
  }

  getToolCategories () {
    return game.assets.data.toolCategories
  }

  getToolCategory (tool) {
    const toolCategories = this.getToolCategories()
    for (const toolCategory of toolCategories) {
      const toolsInCategory = toolCategory.tools
      if (toolsInCategory.includes(tool)) {
        return toolCategory
      }
    }
  }

  getSelectedTool () {
    if (this.pickup) {
      return 'pickup'
    }
    return this.selectedTools[this.selectedToolCategory]
  }

  setSelectedTool (tool) {
    const category = this.getToolCategory(tool).name
    if (category) {
      this.selectedToolCategory = category
      this.selectedTools[category] = tool
    }
    else {
      console.warn("Tried to select invalid tool " + tool)
    }
  }

  getOwnedToolCategories() {
    // Returns a set
    const toolCategories = this.getToolCategories()
    const ownedToolCategories = new Set()
    for (const toolCategory of toolCategories) {
      const toolsInCategory = toolCategory.tools
      if (new Set(toolsInCategory).intersection(new Set(this.ownedTools)).size > 0) {
        ownedToolCategories.add(toolCategory.name)
      }
    }
    return ownedToolCategories
  }

  getOwnedToolsInCategory (category) {
    const toolCategories = this.getToolCategories()
    for (let i = 0; i < toolCategories.length; i ++) {
      if (toolCategories[i].name === category) {
        return [...(
          new Set(toolCategories[i].tools)
          .intersection(new Set(this.ownedTools))
        )]
      }
    }
    return []
  }

  cycleToolCategory () {
    // Count how many tool categories we have tools in
    const toolCategories = this.getToolCategories()
    const ownedToolCategories = this.getOwnedToolCategories()
    const toolCategoryNames = toolCategories.map(e => e.name)

    // If we only have one or zero tool categories, there is nothing for this key press to do
    if (ownedToolCategories.size <= 1) {
      // TODO: Play error sound
      return
    }
    
    // Cycle to next tool category
    let foundMyTool = false
    const toolCategoriesList = [...toolCategoryNames, ...toolCategoryNames]
    for (const toolCategory of toolCategoriesList) {
      if (foundMyTool && ownedToolCategories.has(toolCategory)) {
        this.selectedToolCategory = toolCategory
        break
      }
      if (toolCategory === this.selectedToolCategory) {
        foundMyTool = true
      }
    }

    // Confirm a tool is selected in that category
    if (!this.ownedTools.includes(this.getSelectedTool())) {
      this.selectedTools[this.selectedToolCategory] = this.getOwnedToolsInCategory(this.selectedToolCategory)[0]
    }

    // TODO: Play item cycle sound and remove console log
    console.log(this.getSelectedTool())

    this.setTimer('swapHotbar', 10)
  }

  cycleTool (reverse=false) {
    const toolCategories = this.getToolCategories()
    let toolsInCategory
    for (let i = 0; i < toolCategories.length; i ++) {
      if (toolCategories[i].name === this.selectedToolCategory) {
        toolsInCategory = toolCategories[i].tools
      }
    }
    
    const ownedToolsInCategory = new Set(toolsInCategory).intersection(new Set(this.ownedTools))

    // If we only have one or zero tools in this category, there is nothing for this key press to do
    if (ownedToolsInCategory.size <= 1) {
      // TODO: Play error sound
      return
    }

    // Cycle to next tool in category
    let foundMyTool = false
    const toolsList = reverse ? [...toolsInCategory, ...toolsInCategory].reverse() : [...toolsInCategory, ...toolsInCategory]
    for (const tool of toolsList) {
      if (foundMyTool && this.ownedTools.includes(tool)) {
        this.selectedTools[this.selectedToolCategory] = tool
        break
      }
      if (tool === this.getSelectedTool()) {
        foundMyTool = true
      }
    }

    // TODO: Play item cycle sound and remove console log
    console.log(this.getSelectedTool())

    this.setTimer('cycleTool', 10)
  }

  draw () {
    const { ctx } = game

    if (this.isUnlockAnimationActive) {
      ctx.save()
      ctx.fillStyle = '#000B28'
      ctx.globalAlpha = 0.5
      const camera = game.getCamera2D()
      ctx.translate(...camera.position)
      ctx.translate(game.getWidth() * -0.5, game.getHeight() * -0.5)
      ctx.fillRect(0, 0, game.getWidth(), game.getHeight())
      ctx.restore()

      this.scale = [1 / 48, 1 / 48]
    }


    // Move the sprite down a bit when it's being squashed, so it
    // looks like it's taking off from the ground when the player
    // jumps
    this.drawSprite(...this.position, 0, u.map(this.squash[1], 1, 0.5, 0, 32, true))

    if (this.isUnlockAnimationActive) {
      ctx.save()
      ctx.translate(
        this.position[0],
        this.position[1] - 2
      )
      ctx.fillStyle = 'yellow'
      ctx.globalAlpha = 0.5
      ctx.scale(2, 2)
      ctx.beginPath()
      ctx.arc(0, 0, u.map(Math.sin(this.timer / 14), -1, 1, 0.6, 0.7), 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.translate(0.25, 0.15)
      ctx.scale(1 / 48, 1 / 48)
      this.drawSpriteFrame(this.unlockAnimationItemImage, 0, 64)
      ctx.restore()

      ctx.save()
      ctx.translate(
        this.position[0],
        this.position[1] - 4
      )
      ctx.scale(1 / 48, 1 / 48)
      ctx.textAlign = 'center'
      ctx.font = 'italic bold 58px Arial'
      ctx.fillStyle = '#000B28'
      ctx.fillText(`You found the ${this.unlockAnimationName}!`, 4, 4)
      ctx.fillStyle = 'yellow'
      ctx.fillText(`You found the ${this.unlockAnimationName}!`, 0, 0)
      ctx.restore()

      ctx.save()
      ctx.translate(
        this.position[0],
        this.position[1] + 2.5
      )
      ctx.scale(1 / 48, 1 / 48)
      ctx.textAlign = 'center'
      ctx.font = 'italic bold 24px Arial'
      ctx.fillStyle = '#000B28'
      const str = this.unlockAnimationItemDescription
      ctx.fillText(str, 4, 4)
      ctx.fillStyle = 'white'
      ctx.fillText(str, 0, 0)
      ctx.restore()

      const camera = game.getCamera2D()
      ctx.save()
      ctx.translate(
        camera.position[0] + 12,
        camera.position[1] + 6
      )
      ctx.scale(1 / 48, 1 / 48)
      ctx.textAlign = 'right'
      ctx.font = 'italic bold 24px Arial'
      ctx.fillStyle = '#000B28'
      const contStr = 'Press any key to continue...'
      ctx.fillText(contStr, 4, 4)
      ctx.fillStyle = 'white'
      ctx.fillText(contStr, 0, 0)
      ctx.restore()

      return
    }

    // Selection box for planting seeds
    this.updatePlacementPositionVisual()
    if (
      this.placementPositionVisual &&
      this.getSelectedTool().includes('seedPacket')
    ) {
      let sprite = game.assets.images.plantingIndicator
      const tileReqs = game.assets.data.plantingRequirements[this.getSelectedTool()]
      if (!this.canBePlantedAt(this.getPlacementPosition(), tileReqs)) {
        sprite = game.assets.images.plantingIndicatorError
      }
      const sc = u.clamp(this.placementPositionIndicatorScale, 0, 1)
      ctx.save()
      ctx.drawImage(
        sprite,
        ...vec2.add(this.placementPositionVisual, [0.5-sc/2, 0.5-sc/2]),
        sc,
        sc,
      )
      ctx.globalAlpha = u.map(Math.sin(this.time / 10), -1, 1, 0.6, 0.5)
      ctx.restore()
    }

    let heldItemPosition = [1.1, 0.4]
    let heldItemImage = this.getSelectedTool()

    // Draw the held sickle
    if (
      ['sickle', 'wateringCan', 'waterGun'].includes(this.getSelectedTool())
    ) {
      ctx.save()
      ctx.translate(...this.position)
      ctx.scale(...this.squash)
      ctx.translate(0, u.map(this.squash[1], 1, 0.5, 0, 0.4, true))
      ctx.translate(this.direction * heldItemPosition[0], heldItemPosition[1])
      ctx.scale(this.direction, 1)
      ctx.scale(1 / 48, 1 / 48)
      this.drawSpriteFrame(heldItemImage)
      ctx.restore()
    }
  }

  postDraw () {
    if (this.isUnlockAnimationActive) { return }
    if (this.isPaused) { return }
    const { ctx } = game
    ctx.save()
    ctx.font = 'italic bold 64px Arial'
    ctx.translate(64, 128)
    const moneyScale = (
      u.inverseSquareMap(Math.abs(this.money - this.visualMoney), 0, 5, 1, 1.3)
    )
    ctx.scale(moneyScale, moneyScale)
    ctx.fillStyle = '#000B28'
    ctx.fillText(`$${Math.round(this.visualMoney)}`, 4, 4)
    ctx.fillStyle = 'white'
    ctx.fillText(`$${Math.round(this.visualMoney)}`, 0, 0)
    ctx.restore()

    let i = 0
    for (const tool of this.getOwnedToolsInCategory(this.selectedToolCategory)) {
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 4
      ctx.translate(64, game.getHeight() - 128)
      ctx.translate(i * 80, 0)

      const anim = Math.cos(this.getTimer('swapHotbar') * Math.PI * 2)
      ctx.translate(0, u.map(anim, 0, -1, 0, 24, true))
      //ctx.fillRect(0, 0, 64, 64)

      ctx.translate(32, 32)
      const scale = (
        this.getTimer('cycleTool') && tool === this.getSelectedTool()
        ? u.squareMap(this.getTimer('cycleTool'), 0, 1, 1.25, 1)
        : 1
      )
      ctx.scale(scale, scale)
      ctx.beginPath()
      ctx.arc(0, 0, 36, 0, Math.PI * 2)
      ctx.fill()

      if (tool === this.getSelectedTool()) {
        //ctx.beginPath()
        //ctx.rect(0, 0, 64, 64)
        ctx.stroke()
      }

      const image = game.assets.images[tool]
      if (image) {
        ctx.drawImage(image, -24, -24)
      }
      ctx.restore()

      i += 1
    }
  }

  // Get the player unstuck when trapped in a collision
  getUnstuck () {
    const [xLast, yLast] = this.position
    let a = 0
    let r = 1 / 16
    while (this.checkCollision()) {
      this.position[0] = xLast + Math.cos(a) * r
      this.position[1] = yLast + Math.sin(a) * r
      a += Math.PI * 2 / 4
      if (a > Math.PI * 2) {
        a -= Math.PI * 2
        r += r < 0.25 ? 1 / 48 : 0.25
      }
    }
  }

  checkPointCollision (x, y) {
    if (game.getThing('level').checkWorldTileCollision(x, y)) {
      return true
    }
  }

  checkCollision (x = this.position[0], y = this.position[1], z = 0) {
    if (super.checkCollision(x, y, z)) {
      return true
    }
    return collisionutils.checkCollision(this.aabb, x, y)
  }
}

class DustParticle extends Thing {
  sprite = 'dustParticle'
  scale = 0.7 / 48
  animation = {
    idle: {
      frames: [0, 1],
      speed: 0.5,
      frameSize: 64
    }
  }

  constructor (position, velocity) {
    super()
    this.position = position
    this.velocity = velocity
    this.setTimer('life', 30, () => { this.isDead = true })
  }

  draw () {
    const { ctx } = game
    ctx.save()
    ctx.globalAlpha = u.map(this.getTimer('life'), 0.5, 1, 0.35, 0, true)
    super.draw()
    ctx.restore()
  }
}
