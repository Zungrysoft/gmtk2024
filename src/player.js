import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import Thing from 'thing'
import Plant from './plant.js'

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
      frames: [4],
      speed: 0,
      frameSize: 96
    },
    fall: {
      frames: [5],
      speed: 0,
      frameSize: 96
    }
  }
  aabb = [-0.5, -1, 0.5, 1]
  jumpBuffer = 0
  coyoteFrames = 0
  direction = 1
  cameraOffset = [0, 0]
  squash = [1, 1]
  ownedTools = ['sickle', 'seedPacketHedge', 'seedPacketApple', 'wateringCan', 'waterGun']
  selectedTools = {
    seedPacket: '',
    wateringDevice: '',
    trimmer: 'sickle',
  }
  selectedToolCategory = 'trimmer'
  money = 20
  runFrames = 0

  constructor () {
    super()
    game.setThingName(this, 'player')
  }

  update () {
    // If trapped inside something solid, like when getting pushed by
    // a hedge or something, try to get unstuck
    this.getUnstuck()

    // Using the default move() method in Thing which handles movement
    // and collision detection as defined by the checkCollision()
    // method
    this.updateTimers()
    this.move()
    this.animate()

    // Un-squash and stretch
    this.squash[0] = u.lerp(this.squash[0], 1, 0.15)
    this.squash[1] = u.lerp(this.squash[1], 1, 0.15)

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
    this.direction = u.sign(this.velocity[0]) || this.direction
    game.getCamera2D().position = [
      this.position[0] + this.cameraOffset[0],
      this.position[1] + this.cameraOffset[1]
    ]
    game.getCamera2D().scale = [48, 48] // Make one world unit one tile

    // Switch running / walking / idle animation depending on speed
    this.animation = Math.abs(this.velocity[0]) < 0.165 ? 'walk' : 'run'
    if (Math.abs(this.velocity[0]) < 0.08) {
      this.animation = 'idle'
      this.runFrames = 0
    } else {
      this.runFrames += 1
    }
    if (this.velocity[1] < 0) {
      this.animation = 'jump'
    }
    if (this.velocity[1] > 0) {
      this.animation = 'fall'
    }

    // Chug along when running
    if (this.runFrames > 0) {
      const s = Math.sin(this.runFrames * Math.PI * 2 / 10)
      this.squash[1] = u.map(s, -1, 1, 1, 0.95, true)
    }

    const onGround = this.contactDirections.down
    const friction = 0.7
    const groundAcceleration = 3.5 / 48
    const airAcceleration = 0.5 / 48
    const acceleration = onGround ? groundAcceleration : airAcceleration

    // Calculate what the top speed of the player is on the ground,
    // where friction naturally cancels out any additional
    // acceleration. This is used to cap max player speed in the air
    const maxSpeed = groundAcceleration * friction / (1 - friction)

    // Apply gravity
    this.velocity[1] += 1 / 48

    // Coyote frames
    this.coyoteFrames -= 1
    if (onGround) {
      if (this.coyoteFrames < 3) {
        this.squash[1] = 0.5
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
    }
    if (game.keysDown.ArrowLeft || game.buttonsDown[14]) {
      this.velocity[0] -= acceleration
      if (!onGround) {
        this.velocity[0] = Math.max(this.velocity[0], -maxSpeed)
      }
    }

    // Apply friction
    if (onGround) {
      this.velocity[0] *= friction
    }
    
    // ==============
    // Player actions
    // ==============

    // Switch tool category
    if (game.keysPressed.KeyS || game.buttonsPressed[3]) {
      this.cycleToolCategory()
    }

    // Switch sub tool
    if (game.keysPressed.KeyQ || game.buttonsPressed[5]) {
      this.cycleTool(false)
    }

    // Switch sub tool reverse
    if (game.keysPressed.KeyE || game.buttonsPressed[4]) {
      this.cycleTool(true)
    }

    // Use tool
    if (game.keysDown.KeyA || game.buttonsDown[2]) {
      this.useTool(game.keysPressed.KeyA || game.buttonsPressed[2])
    }

    // Apply scaling
    this.scale[0] = this.direction * this.squash[0] / 48
    this.scale[1] = this.squash[1] / 48
  }

  useTool(pressed) {
    const selectedTool = this.getSelectedTool()

    // Watering Can: waters plants in a small circle in front of the player 
    if (selectedTool === 'wateringCan') {
      const offset = [0.9 * this.direction, 0.4]
      const waterCenter = vec2.add(this.position, offset)
      const waterRadius = 0.8
      const aabb = [
        -waterRadius,
        -waterRadius,
        waterRadius,
        waterRadius,
      ]

      // Get all plants nearby (broad-phase collision)
      const plants = game.getThingsNear(...waterCenter, waterRadius).filter(e => e instanceof Plant)

      // Do collision check
      for (const plant of plants) {
        if (plant.collideWithAabb(aabb, waterCenter)) {
          plant.water()
        }
      }
    }
  }

  unlockTool (tool, toolMode) {
    if (!this.ownedTools.includes(tool)) {
      this.ownedTools.push(tool)
      this.setSelectedTool(tool)
    }

    // TODO: Play ITEM GET animation and sound
  }

  getToolCategories () {
    return {
      seedPacket: ['seedPacketApple', 'seedPacketPear', 'seedPacketHedge'],
      wateringDevice: ['wateringCan', 'waterGun', 'hose'],
      trimmer: ['sickle'],
    }
  }

  getToolCategory (tool) {
    const toolCategories = this.getToolCategories()
    for (const toolCategory in toolCategories) {
      const toolsInCategory = toolCategories[toolCategory]
      if (toolsInCategory.includes(tool)) {
        return toolCategory
      }
    }
  }

  getSelectedTool () {
    return this.selectedTools[this.selectedToolCategory]
  }

  setSelectedTool (tool) {
    const category = this.getToolCategory(tool)
    if (category) {
      this.selectedToolCategory = category
      this.selectedTools['category'] = tool
    }
    else {
      console.warn("Tried to select invalid tool " + tool)
    }
  }

  getOwnedToolCategories() {
    // Returns a set
    const toolCategories = this.getToolCategories()
    const ownedToolCategories = new Set()
    for (const toolCategory in toolCategories) {
      const toolsInCategory = toolCategories[toolCategory]
      if (new Set(toolsInCategory).intersection(new Set(this.ownedTools)).size > 0) {
        ownedToolCategories.add(toolCategory)
      }
    }
    return ownedToolCategories
  }

  getOwnedToolsInCategory (category) {
    return this.getToolCategories()[category]
  }

  cycleToolCategory () {
    // Count how many tool categories we have tools in
    const toolCategories = this.getToolCategories()
    const ownedToolCategories = this.getOwnedToolCategories()

    // If we only have one or zero tool categories, there is nothing for this key press to do
    if (ownedToolCategories.size <= 1) {
      // TODO: Play error sound
      return
    }
    
    // Cycle to next tool category
    let foundMyTool = false
    const toolCategoriesList = [...Object.keys(toolCategories), ...Object.keys(toolCategories)]
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
  }

  cycleTool (reverse=false) {
    const toolsInCategory = this.getToolCategories()[this.selectedToolCategory]
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
  }

  draw () {
    // Move the sprite down a bit when it's being squashed, so it
    // looks like it's taking off from the ground when the player
    // jumps
    this.drawSprite(...this.position, 0, u.map(this.squash[1], 1, 0.5, 0, 32, true))
  }

  postDraw () {
    if (this.isPaused) { return }
    const { ctx } = game
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = 'italic bold 64px Arial'
    ctx.translate(64, 128)
    ctx.fillText(`${this.money}$`, 0, 0)
    ctx.restore()
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

    for (const plant of this.getAllOverlaps()) {
      if (!(plant instanceof Plant)) { continue }
      const plantHit = plant.collideWithThing(this, [x, y])
      if (plantHit) {
        return true
      }
    }

    const w = 0.25
    const h = 1
    const headRoom = 0.4 // A little headroom to make low ceilings easier

    // Doing a bunch of point collisions around the perimeter of the
    // player's bounding box with the level's tile grid to simulate a
    // real bounding box collision with the world
    return (
      this.checkPointCollision(x + w, y) ||
      this.checkPointCollision(x - w, y) ||
      this.checkPointCollision(x, y + h) ||
      this.checkPointCollision(x, y - h + headRoom) ||
      this.checkPointCollision(x + w, y + h) ||
      this.checkPointCollision(x - w, y + h) ||
      this.checkPointCollision(x + w, y - h + headRoom) ||
      this.checkPointCollision(x - w, y - h + headRoom)
    )
  }
}
