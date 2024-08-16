import * as game from 'game'
import * as u from 'utils'
import * as vec3 from 'vector3'
import * as vec2 from 'vector2'
import * as webgl from 'webgl'
import * as mat from 'matrices'
import Thing from 'thing'

const buildingFragSource = `
precision mediump float;

uniform sampler2D sideTexture;
uniform sampler2D topTexture;
uniform sampler2D bottomTexture;
uniform float textureScale;
uniform int blending;
uniform vec4 color;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  // Basic XY projection UV mapping
  vec2 uvNew = vec2(uv.xy);
  if (textureScale > 0.0) {
    uvNew = vec2(worldPosition.xy * textureScale);
  }

  // Walls
  if (abs(normal.z) <= 0.2) {
    if (abs(normal.y) <= 0.05) {
      uvNew.x = -1.0 * normal.x*worldPosition.y*textureScale;
      uvNew.y = -1.0 * worldPosition.z*textureScale;
    } else {
      uvNew.x = -1.0 * worldPosition.x*textureScale / normal.y;
      uvNew.y = -1.0 * worldPosition.z*textureScale;
    }
  }

  // Tops
  vec4 result = texture2D(sideTexture, uvNew);
  if (normal.z >= 0.7) {
    if (blending == 1) {
      result = mix(result, texture2D(topTexture, uvNew), clamp((normal.z-0.7)*10.0, 0.0, 1.0));
    } else {
      result = texture2D(topTexture, uvNew);
    }
  }

  if (normal.z < -0.7) {
    if (blending == 1) {
      result = mix(result, texture2D(bottomTexture, uvNew), clamp((normal.z-0.7)*10.0, 0.0, 1.0));
    } else {
      result = texture2D(bottomTexture, uvNew);
    }
  }

  // Basic shading
  float shading = 1.0;
  //float shading = mix(0.5, 1.0, normal.z/2.0 + 0.5);
  shading *= mix(0.5, 1.0, normal.x/2.0 + 0.75);
  //shading *= mix(1.0, 0.9, max(normal.x, 0.0));

  if (result.a == 0.0) { discard; }

  float alpha = min(1.0, worldPosition.z + 11.0);

  gl_FragColor = vec4(pow(shading, 1.0) * result.xyz, alpha) * color;
}
`

const scrollingFragSource = `
precision mediump float;

uniform sampler2D texture;
uniform sampler2D layerTexture;
uniform float textureScale;
uniform vec4 color;
uniform float time;
uniform mat4 viewMatrix;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  vec2 uv = worldPosition.xy;
  vec4 result = texture2D(texture, (uv + time * 0.03) * textureScale);

  result.a = min(result.a, 1.0);
  if (result.a == 0.0) { discard; }

  gl_FragColor = result * color;
}
`
const waterFragSource = `
precision mediump float;

uniform sampler2D texture;
uniform sampler2D layerTexture;
uniform float textureScale;
uniform vec4 color;
uniform float time;
uniform mat4 viewMatrix;
uniform float moonAngle;
uniform vec3 cameraPosition;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  vec2 uv = worldPosition.xy;
  uv.y *= 3.0;
  vec4 a = texture2D(texture, (uv + time * 0.03) * textureScale);
  vec4 b = texture2D(texture, (uv + time * 0.091) * textureScale * 0.34);
  vec4 result = (a + b * 2.0) / 3.0;
  result.a = result.r;
  vec2 ray = normalize(worldPosition.xy - cameraPosition.xy);
  float moonAngleDiff = dot(ray.xy, vec2(cos(moonAngle), sin(moonAngle)));
  result.rgb += max(moonAngleDiff - 0.75, 0.0);
  if (result.r < 0.65 && result.r > 0.25) { discard; }

  result.a = min(result.a, 1.0 - distance(cameraPosition.xy, worldPosition.xy) / 1500.0);
  if (result.a == 0.0) { discard; }

  gl_FragColor = result * color;
}
`

const quakeWaterFragSource = `
precision mediump float;

uniform sampler2D texture;
uniform sampler2D layerTexture;
uniform float textureScale;
uniform vec4 color;
uniform float time;
uniform mat4 viewMatrix;

varying vec2 uv;
varying vec3 normal;
varying vec4 worldPosition;
varying vec4 viewPosition;

void main() {
  float waveScale = 0.15;
  float waveFreq = 0.5 * (1.0 / 60.0);
  vec2 offset = vec2(
    sin((worldPosition.y * waveScale + time * waveFreq) * 3.14),
    sin((worldPosition.x * waveScale + time * waveFreq) * 3.14)
  );
  vec4 result = texture2D(texture, (worldPosition.xy + offset) * textureScale);

  result.a = viewPosition.z * 0.001 + 1.0;
  result.a = min(result.a, result.r);
  if (result.a == 0.0) { discard; }

/*
  float waveHeight = sin(worldPosition.x + worldPosition.y + time / 100.0);
  vec3 waveNormal = normalize(vec3(0, 0, waveHeight));
  vec3 toMoon = normalize(vec3(1, 0, 0.1));
  vec3 refractedDir = refract(toMoon, waveNormal, 1.0 / 3.0);
  result.rgb *= max(waveNormal, 0.0);
*/

  gl_FragColor = result * color;
}
`

const normalFragSource = `
precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec3 normal;
varying vec2 uv;

void main() {
  gl_FragColor = vec4(normal.xyz * 0.5 + 0.5, 1.0);
}
`

export default class City extends Thing {
  generator = null
  graph = {}
  prevGraph = {}
  plots = []
  streetMesh = webgl.createMesh()
  terrainMesh = webgl.createMesh()
  buildingsMesh = Array(5).fill(null).map(() => webgl.createMesh())
  sidewalkMesh = webgl.createMesh()
  parkMesh = webgl.createMesh()
  buildingBaseMesh = webgl.createMesh()
  buildingShader = webgl.createShader(buildingFragSource)
  waterShader = webgl.createShader(waterFragSource)
  drawMode = '3D'
  colors = []
  time = 0

  constructor () {
    super()
    this.generator = generate()
    game.getCamera3D().position[2] += 100
    //game.canvas3D.style.objectFit = 'fill'
    //game.setWidth(window.innerWidth)
    //game.setHeight(window.innerHeight)
    /*
    const colors = [[0.75, 0.75, 1]]
    while (colors.length < this.buildingsMesh.length) {
      colors.push([colors.at(-1)[0] + 0.1, colors.at(-1)[1], 1])
    }
    */
    const colors = [
      [0.125, 0.3, 1],
      [0.55, 0.1, 1],
      [0.09, 0.2, 1],
      [0.12, 0.6, 1],
      [0.12, 0.4, 1],
    ]
    this.colors = colors.map(c => [...u.hsvToRgb(c), 1])

    /*
    let done = false
    while (!done) {
      done = this.updateGenerator()
    }
    */
  }

  updateGenerator () {
    if (!this.generator) { return true }
    const { value, done } = (this.generator.next(), this.generator.next(), this.generator.next())
    if (done) {
      this.generator = null
      this.plots = findCycles(this.graph)
      this.remesh()
      //this.remeshTerrain()
    } else {
      this.graph = value
      if (Object.keys(this.graph).length % 10 === 0) {
        //this.plots.push(...findCycles(this.graph, this.prevGraph))
        this.plots = findCycles(this.graph)
        //this.prevGraph = { ...this.graph }
        if (Object.keys(this.graph).length % 40 === 0) {
          this.remesh()
        }
      }
    }
  }

  remesh () {
    // Mesh streets
    const streetVerts = []
    const streetWidth = 7
    for (const [vertex, connections] of Object.entries(this.graph)) {
      const p1 = vertex.split(',').map(Number)
      for (const connection of connections) {
        const p2 = connection.split(',').map(Number)

        let px = p2[1] - p1[1]
        let py = p2[0] - p1[0]
        const pMag = Math.sqrt(px ** 2 + py ** 2)
        px *= streetWidth / pMag
        py *= streetWidth / -pMag

        const v1 = [p1[0] - px, p1[1] - py, 0, 0, 0, 0, 0, 0]
        const v2 = [p1[0] + px, p1[1] + py, 0, 1, 0, 0, 0, 0]
        const v3 = [p2[0] - px, p2[1] - py, 0, 0, 1, 0, 0, 0]
        const v4 = [p2[0] + px, p2[1] + py, 0, 1, 1, 0, 0, 0]

        streetVerts.push(...updateNormals([
          ...v2, ...v1, ...v3,
          ...v3, ...v4, ...v2
        ]))

        const points = [v1, v3, v2, v4]
        const h = -40
        for (let i = 0; i < points.length; i += 1) {
          const a = points[i]
          const b = points[(i + 1) % points.length]
          const tu = 1
          const tv = 1
          streetVerts.push(...updateNormals([
            a[0], a[1], 0, 0,  0, 0, 0, 0,
            a[0], a[1], h, 0,  tv, 0, 0, 0,
            b[0], b[1], 0, tu, 0, 0, 0, 0,
            a[0], a[1], h, 0,  tv, 0, 0, 0,
            b[0], b[1], h, tu, tv, 0, 0, 0,
            b[0], b[1], 0, tu, 0, 0, 0, 0,
          ]))
        }
      }
    }

    const wallGenerator = (points, h = 100) => {
      const result = []
      const tu = 1 // u.distance(p1, p2) // 10
      const tv = Math.abs(h) / 60
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i]
        const b = points[(i + 1) % points.length]
        result.push(
          a[0], a[1], 0, 0,  0, 0, 0, 0,
          a[0], a[1], h, 0,  tv, 0, 0, 0,
          b[0], b[1], 0, tu, 0, 0, 0, 0,
          a[0], a[1], h, 0,  tv, 0, 0, 0,
          b[0], b[1], h, tu, tv, 0, 0, 0,
          b[0], b[1], 0, tu, 0, 0, 0, 0,
        )
      }
      return updateNormals(result)
    }

    const ceilingGenerator = (points, h = 100) => {
      const result = []
      for (let i = 2; i < points.length; i += 1) {
        const a = points[0]
        const b = points[i - 1]
        const c = points[i]
        result.push(
          b[0], b[1], h, 0, 0, 0, 0, 1,
          a[0], a[1], h, 0, 0, 0, 0, 1,
          c[0], c[1], h, 0, 0, 0, 0, 1,
        )
      }
      return updateNormals(result)
    }

    const buildingGenerator = (points, h = 100) => ([
      ...wallGenerator(points, h),
      ...ceilingGenerator(points, h)
    ])

    const windowGenerator = (
      points,
      h = 100,
      { width = 5, height = 6, story = 10, offset = 2, run = 1.75, darkness = 0.25 }
    ) => {
      const rng = u.randomizer()
      const result = []
      for (let z = 0; z < h - 10; z += story) {
        for (let i = 0; i < points.length; i += 1) {
          const a = points[i]
          const b = points[(i + 1) % points.length]
          const sideLength = u.distance(a, b)
          const moveVector = vec2.normalize(vec2.subtract(b, a))
          for (let x = sideLength % (width * run); x < sideLength - width; x += width * run) {
            const zb = z + offset
            const zt = z + offset + height
            const p1 = vec2.add(a, vec2.scale(moveVector, x))
            const p2 = vec2.add(a, vec2.scale(moveVector, x + width))
            let u0 = 0
            let u1 = 0.5
            let v0 = 0
            let v1 = 0.5
            if (rng() > 0.5) {
              u0 += 0.5
              u1 += 0.5
            }
            if (rng() < darkness) {
              v0 += 0.5
              v1 += 0.5
            }
            u0 += 0.01; u1 -= 0.01
            v0 += 0.01; v1 -= 0.01
            result.push(
              p1[0], p1[1], zb, u1, v0, 0, 0, 0,
              p1[0], p1[1], zt, u1, v0, 0, 0, 0,
              p2[0], p2[1], zb, u0, v1, 0, 0, 0,
              p1[0], p1[1], zt, u1, v0, 0, 0, 0,
              p2[0], p2[1], zt, u0, v0, 0, 0, 0,
              p2[0], p2[1], zb, u0, v1, 0, 0, 0,
            )
          }
        }
      }
      return updateNormals(result)
    }

    // Mesh buildings
    const buildingVerts = this.buildingsMesh.map(() => [])
    const sidewalkVerts = []
    const parkVerts = []
    const buildingBaseVerts = []
    for (const plot of this.plots) {
      let plotCoords = plot.map(c => c.split(',').map(Number))

      // Flip winding order, if it's wrong
      const norm = vec3.getNormalOf(
        [...plotCoords[0], 0],
        [...plotCoords[1], 0],
        [...plotCoords[2], 0],
      )
      if (norm[2] < 0) {
        plotCoords = plotCoords.reverse()
      }

      // Calculate the centerpoint of the plot for various reasons
      const avgPoint = [0, 0]
      for (const coord of plotCoords) {
        avgPoint[0] += coord[0] / plotCoords.length
        avgPoint[1] += coord[1] / plotCoords.length
      }

      // The inwards angle of this plot vertex
      const plotAngles = plotCoords.map((p2, i, coords) => {
        const p1 = coords.at((i - 1) % coords.length)
        const p3 = coords.at((i + 1) % coords.length)
        const l1 = vec2.subtract(p1, p2)
        const l2 = vec2.subtract(p3, p2)
        const dot = vec2.dotProduct
        const mag = vec2.magnitude
        return Math.acos(dot(l1, l2) / (mag(l1) * mag(l2)))
      })

      // The inward vectors of this plot vertex, the perpendiculars of
      // both street vectors
      const plotInwardVectors = plotCoords.map((p2, i, coords) => {
        const p1 = coords.at((i - 1) % coords.length)
        const p3 = coords.at((i + 1) % coords.length)
        const l1 = vec2.normalize(vec2.subtract(p1, p2))
        const l2 = vec2.normalize(vec2.subtract(p2, p3))
        const perp1 = vec2.rotate(l1, Math.PI / -2)
        const perp2 = vec2.rotate(l2, Math.PI / -2)
        return [perp1, perp2]
      })

      // The average inward vector of this plot vertex
      const plotInwardVector = plotInwardVectors.map(([perp1, perp2]) => (
        vec2.normalize([
          (perp1[0] + perp2[0]) / 2,
          (perp1[1] + perp2[1]) / 2
        ])
      ))

      const iterateCoord = (coord, i, width) => {
        const [perp1, perp2] = plotInwardVectors[i]
        let newCoord = [...coord]
        let delta = vec2.subtract(newCoord, coord)
        while (vec2.dotProduct(delta, perp1) < width || vec2.dotProduct(delta, perp2) < width) {
          newCoord = vec2.add(newCoord, plotInwardVector[i])
          delta = vec2.subtract(newCoord, coord)
        }
        return newCoord
      }

      // Shrink size of building to only 2/3 of the plot, to give
      // streets some space to breathe
      const buildingCoords = plotCoords.map((coord, i) => (
        iterateCoord(coord, i, 12)
      ))

      const windowCoords = plotCoords.map((coord, i) => (
        iterateCoord(coord, i, 11)
      ))

      const sidewalkCoords = plotCoords.map((coord, i) => (
        iterateCoord(coord, i, 6)
      ))

      // Calculate height of building
      const falloff = (
        u.inverseSquareMap(u.distance(...avgPoint, 0, 0), 0, 1500, 1, 0, true)
      )
      const noise = 0.5 * (u.noise(...avgPoint) + 1)
      const value = noise * falloff
      const height = u.map(value, 0, 1, 50, 400, true)

      // Randomly choose a material for the building/windows based on noise
      const material = (
        Math.round(u.map(u.noise(...avgPoint), -1, 1, 0, 4, true))
      )

      // Change window styling based on the height of the building
      const windowParams = {}
      windowParams.darkness = (
        u.clamp(u.map(u.noise(...avgPoint.map(x => x * 21.73)), 0, 1, 0.65, 0.85), 0.65, 0.85)
      )
      if (height >= 200) {
        windowParams.height = 8
        windowParams.run = 1.1
      }
      if (height >= 100 && height < 200) {
        windowParams.run = 1
        windowParams.height = 4.5
      }

      // If the plot is big, make it a park instead of a building
      if (plot.length <= 5) {
        sidewalkVerts.push(...buildingGenerator(sidewalkCoords, 0.25))
        buildingVerts[material].push(...windowGenerator(windowCoords, height, windowParams))
        buildingBaseVerts.push(...buildingGenerator(buildingCoords, height))
      } else {
        parkVerts.push(...buildingGenerator(sidewalkCoords, 0.2))
      }
    }

    // Intersections
    const intersectionRadius = streetWidth
    const intersections = Object.keys(this.graph).map(key => {
      const result = []
      const coord1 = key.split(',').map(Number)
      this.graph[key].forEach(neighbor => {
        const coord2 = neighbor.split(',').map(Number)
        const angle = vec2.angleTowards(coord1, coord2)
        const streetVector = vec2.toMagnitude(vec2.angleToVector(angle), intersectionRadius)
        const streetNormalVector = vec2.rotate(streetVector, Math.PI / 2)
        const p1 = vec2.add(vec2.add(streetVector, streetNormalVector), coord1)
        const p2 = vec2.add(vec2.add(streetVector, vec2.scale(streetNormalVector, -1)), coord1)
        result.push(p2, p1)
      })
      return result
    })
    intersections.flatMap(i => wallGenerator(i, 50)).forEach(v => streetVerts.push(v))

    let vertCount = 0
    for (const [material, verts] of Object.entries(buildingVerts)) {
      webgl.modifyMesh(this.buildingsMesh[material], verts)
      vertCount += verts.length / 8
    }
    webgl.modifyMesh(this.sidewalkMesh, sidewalkVerts)
    vertCount += sidewalkVerts.length / 8
    webgl.modifyMesh(this.parkMesh, parkVerts)
    vertCount += sidewalkVerts.length / 8
    webgl.modifyMesh(this.buildingBaseMesh, buildingBaseVerts)
    vertCount += buildingBaseVerts.length / 8
    webgl.modifyMesh(this.streetMesh, streetVerts)
    vertCount += streetVerts.length / 8
    console.log('triangles: ' + String(vertCount / 3))
  }

  remeshTerrain () {
    const tileSize = 12
    //const seed = [+ new Date(), + new Date()]
    const seed = [200_000, 500_000]

    const distMap = {}
    for (const vert in this.graph) {
      const [x, y] = vert.split(',').map(x => Math.floor(Number(x) / tileSize))
      const radius = 50
      for (let dx = -radius; dx < radius; dx += 1) {
        for (let dy = -radius; dy < radius; dy += 1) {
          const coord = [x + dx, y + dy]
          distMap[coord] = Math.min(u.distance(...coord, x, y), distMap[coord] ?? Infinity)
        }
      }
    }

    const heightMap = {}
    for (const coord in distMap) {
      const [x, y] = coord.split(',').map(Number).map(x => x * 0.4)
      const noiseInfluenceIn = u.map(distMap[coord], 4, 12, 0, 1, true)
      const noiseValue = u.octaveNoise(x + seed[0], y + seed[1]) * 200
      heightMap[coord] = (noiseValue < 0 ? 1 : noiseInfluenceIn) * noiseValue
      heightMap[coord] = u.map(distMap[coord], 20, 30, heightMap[coord], -30, true)
      heightMap[coord] -= 0.025
    }

    const verts = []
    for (const coord in heightMap) {
      let [x, y] = coord.split(',').map(Number)
      if (
        ([x + 1, y + 1] in heightMap) &&
        ([x, y + 1] in heightMap) &&
        ([x + 1, y] in heightMap)
      ) {
        const ox = x
        const oy = y
        const s = tileSize
        const hs = 1
        x *= s
        y *= s
        const v1 = [x, y, heightMap[[ox, oy]] * hs, 0, 0, 0, 0, 0]
        const v2 = [x + s, y, heightMap[[ox + 1, oy]] * hs, 1, 0, 0, 0, 0]
        const v3 = [x, y + s, heightMap[[ox, oy + 1]] * hs, 0, 1, 0, 0, 0]
        const v4 = [x + s, y + s, heightMap[[ox + 1, oy + 1]] * hs, 1, 1, 0, 0, 0]
        verts.push(...updateNormals([
          ...v2, ...v1, ...v3,
          ...v3, ...v4, ...v2
        ]))
      }
    }

    webgl.modifyMesh(this.terrainMesh, verts)
  }

  update () {
    this.time += 1
    this.updateGenerator()

    game.setWidth(window.innerWidth)
    game.setHeight(window.innerHeight)

    if (game.keysPressed.KeyZ) {
      this.drawMode = this.drawMode === '3D' ? '2D' : '3D'
      game.getThing('player').isPaused = this.drawMode !== '3D'
      if (this.drawMode === '2D') {
        game.mouse.unlock()
      }
    }
  }

  preDraw () {
    //webgl.clearScreen([0x11 / 255, 0x22 / 255, 0x44 / 255, 1])
    //const gl = webgl.getGlContext()
    // gl.depthFunc(gl.ALWAYS)
  }

  draw () {
    if (this.drawMode === '3D') {
      this.drawModel()
    } else {
      this.drawMap()
    }
  }

  drawMap () {
    const { ctx } = game

    webgl.clearScreen([0x11 / 255, 0x22 / 255, 0x44 / 255, 1])

    // Plots
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = 'red'
    for (const plot of this.plots) {
      const plotCoords = plot.map(c => c.split(',').map(Number))
      ctx.beginPath()
      ctx.moveTo(...plotCoords[0])
      for (let i = 1; i < plotCoords.length; i += 1) {
        ctx.lineTo(...plotCoords[i])
      }
      ctx.fill()
    }
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    webgl.set('color', [0.75, 0.5, 0, 1])
    webgl.set('color', [0.25, 0.5, 1, 0.5])
    for (const [vertex, connections] of Object.entries(this.graph)) {
      for (const connection of connections) {
        ctx.beginPath()
        const p1 = vertex.split(',').map(Number)
        const p2 = connection.split(',').map(Number)
        ctx.moveTo(...p1)
        ctx.lineTo(...p2)
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  drawModel () {
    // game.getCamera3D().setUniforms()
    // webgl.set('modelMatrix', mat.getTransformation({ position: [10, 0, 0] }))
    // webgl.set('color', [255, 0, 0, 1])

    const camera = game.getCamera3D()
    const gl = webgl.getGlContext()

    // Skybox
    const skyboxScale = 10_000
    webgl.setShader()
    webgl.set('color', [1, 1, 1, 1])
    game.getCamera3D().setUniforms()
    webgl.setTexture(game.assets.textures.sky)
    webgl.set('modelMatrix', mat.getTransformation({
      position: camera.position,
      scale: [skyboxScale, skyboxScale, -skyboxScale]
    }))
    webgl.drawMesh(game.assets.meshes.sphere)
    webgl.setTexture()

    //gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)

    // Streets
    webgl.setShader(this.buildingShader)
    webgl.set('color', [1, 1, 1, 1])
    game.getCamera3D().setUniforms()
    webgl.setTexture()//game.assets.textures.asphalt)
    webgl.set('textureScale', 1 / (2 ** 5))
    webgl.drawMesh(this.streetMesh)

    // Terrain
    webgl.setTexture(game.assets.textures.grass)
    webgl.set('color', [0.2, 0.2, 0.2, 1])
    webgl.drawMesh(this.terrainMesh)

    // Building base textures
    webgl.set('textureScale', 1 / (2 ** 2))
    webgl.set('color', [1, 1, 1, 1])
    webgl.setTexture(game.assets.textures.buildingBase1)
    webgl.drawMesh(this.buildingBaseMesh)

    // Sidewalk
    webgl.setTexture(game.assets.textures.sidewalk)
    webgl.set('textureScale', 1 / (2 ** 2.5))
    webgl.set('color', [1, 1, 1, 1])
    webgl.drawMesh(this.sidewalkMesh)

    // Parks
    webgl.setTexture(game.assets.textures.grass)
    webgl.set('textureScale', 1 / (2 ** 3.5))
    webgl.set('color', [1, 1, 1, 1])
    webgl.drawMesh(this.parkMesh)

    // Water
    webgl.setShader(this.waterShader)
    game.getCamera3D().setUniforms()
    webgl.set('modelMatrix', mat.getTransformation({
      position: [camera.position[0], camera.position[1], -10]
    }))
    webgl.setTexture(game.assets.textures.noise)
    webgl.setTexture(game.assets.textures.water)
    webgl.set('layerTexture', 1, 'int')
    webgl.setTexture(game.assets.textures.noise, 1)
    webgl.set('textureScale', 1 / (2 ** 6))
    webgl.set('color', [1, 1, 1, 0.8])
    webgl.set('time', this.time)
    webgl.set('moonAngle', Math.PI * 2 / 3)
    webgl.set('cameraPosition', camera.position)
    webgl.drawQuad(
      [-10_000, -10_000, 0],
      [-10_000, 10_000, 0],
      [10_000, -10_000, 0],
      [10_000, 10_000, 0]
    )

    // Building windows
    webgl.setShader()
    game.getCamera3D().setUniforms()
    webgl.setTexture(game.assets.textures.window)
    for (const [i, color] of Object.entries(this.colors)) {
      webgl.set('color', color)
      webgl.drawMesh(this.buildingsMesh[i])
    }

    // Moon
    webgl.setShader(webgl.billboardShader)
    game.getCamera3D().setUniforms()
    const moonAngle = Math.PI * 2 / 3
    const moonDistance = 2000
    webgl.set('modelMatrix', mat.getTransformation({
      position: [
        camera.position[0] + Math.cos(moonAngle) * moonDistance,
        camera.position[1] + Math.sin(moonAngle) * moonDistance,
        camera.position[2] + 600
      ],
      scale: 400
    }))
    webgl.setTexture(game.assets.textures.glowMoon)
    webgl.drawBillboard()

    gl.disable(gl.CULL_FACE)
  }
}

function * generate () {
  const graph = { '0,0': [] }
  const angleGraph = { '0,0': 0 }
  const unusedGraph = { '0,0': 1 }
  //u.setSeed(+ new Date())

  const addConnection = (v1, v2) => {
    if (graph[String(v1)]?.includes(String(v2))) { return false }
    if (graph[String(v2)]?.includes(String(v1))) { return false }
    if (graph[String(v1)].length >= 4) { return false }
    graph[String(v1)].push(String(v2))
    graph[String(v2)].push(String(v1))
    return true
  }

  const generateVertex = (x, y, ox, oy, angle) => {
    for (const vertexString of Object.keys(graph)) {
      const vertex = vertexString.split(',').map(Number)
      if (u.distance(vertex[0], vertex[1], x, y) < 50) {
        if (Math.abs(u.distance(vertex[0], vertex[1], ox, oy) - (Math.sqrt(2) * 60)) < 2) {
          return [vertex, false]
        }
        unusedGraph[vertex] = (unusedGraph[vertex] || 0) + 1
        return [vertex, true]
      }
    }
    const vert = [Math.round(x), Math.round(y)]
    graph[vert] = []
    unusedGraph[vert] = 1
    angleGraph[vert] = angle
    return [vert, true]
  }

  const createConnection = (vertexString) => {
    const vertex = vertexString.split(',').map(Number)
    const angle = (
      u.random() > 0.08//0.025
        ? angleGraph[vertexString] + u.choose([0, Math.PI / 2, Math.PI / -2])
        : u.random() * 2 * Math.PI
    )
    const x = vertex[0] + Math.cos(angle) * 60
    const y = vertex[1] + Math.sin(angle) * 60
    const [child, isConnecting] = generateVertex(x, y, vertex[0], vertex[1], angle)
    return isConnecting && addConnection(vertex, child)
  }

  for (let i = 0; i < 1000; i += 1) {
    const noiseMap = (x, y) => {
      const freq = 1 / 301.3
      return u.noise(x * freq, y * freq) + u.distance(x, y, 0, 0) / 1500
    }
    const vertices = Object.keys(unusedGraph).sort((x, _y) => {
      const v1 = noiseMap(...x.split(',').map(Number))
      //const v2 = noiseMap(...y.split(',').map(Number))
      return v1 //- v2
    })
    for (const vertex of vertices) {
      if (createConnection(vertex)) {
        unusedGraph[vertex] -= 1
        if (unusedGraph[vertex] <= 0) {
          delete unusedGraph[vertex]
        }
        break
      }
    }
    yield graph
  }

  // Trim loose streets
  let isTrimming = true
  let trimCount = 0
  while (isTrimming && trimCount < 5) {
    isTrimming = false
    trimCount += 1
    for (const vertex in graph) {
      if (graph[vertex].length <= 1) {
        for (const other in graph) {
          graph[other] = graph[other].filter(x => x !== vertex)
        }
        delete graph[vertex]
        isTrimming = true
      }
    }
  }
}

function findCycles (graph, prevGraph = {}) {
  const cycles = []
  const uniqueCycles = new Set()

  const checkSplit = (cycle) => {
    for (const vert of cycle) {
      let t = 0
      for (const neighbor of graph[vert]) {
        if (cycle.includes(neighbor)) {
          t += 1
        }
      }
      if (t > 2) {
        return true
      }
    }
    return false
  }

  const dfs = (node, parent = null, path = []) => {
    if (path.length >= 7) { return }

    for (const neighbor of graph[node]) {
      if (neighbor === parent) { continue }

      // Found a node in the path, therefore we have a cycle here
      if (path.includes(neighbor)) {
        const cycle = path.slice(path.indexOf(neighbor))

        const cycleKey = [...cycle].sort().join('$')
        if (!uniqueCycles.has(cycleKey)) {
          uniqueCycles.add(cycleKey)
          if (!checkSplit(cycle)) {
            cycles.push(cycle)
          }
        }
        continue
      }

      // Otherwise, keep exploring the graph
      dfs(neighbor, node, [...path, neighbor])
    }
  }

  for (const key of Object.keys(graph)) {
    if (key in prevGraph) { continue }
    dfs(key, null, [key])
  }

  const cornerOwners = {}

  const getCorners = (cycle) => {
    const result = []
    for (let i = 0; i < cycle.length; i += 1) {
      const corner = [
        cycle[i],
        cycle[(i + 1) % cycle.length],
        cycle[(i + 2) % cycle.length],
      ]
      result.push(String([...corner].sort()))
    }
    return result
  }

  for (const cycle of cycles) {
    for (const corner of getCorners(cycle)) {
      if (corner in cornerOwners) {
        if (cornerOwners[corner].length < cycle.length) {
          cornerOwners[corner] = cycle
        }
      } else {
        cornerOwners[corner] = cycle
      }
    }
  }

  return cycles.filter(cycle => (
    getCorners(cycle).every(corner => cornerOwners[corner] === cycle)
  ))
}

function updateNormals (verts) {
  for (let i = 0; i < verts.length; i += 24) {
    // Don't overwrite preset normals
    if (verts[i + 5] !== 0 || verts[i + 6] !== 0 || verts[i + 7] !== 0) {
      continue
    }
    const v1 = [verts[i], verts[i + 1], verts[i + 2]]
    const v2 = [verts[i + 8], verts[i + 8 + 1], verts[i + 8 + 2]]
    const v3 = [verts[i + 16], verts[i + 16 + 1], verts[i + 16 + 2]]
    const normal = vec3.getNormalOf(v1, v2, v3);
    [verts[i + 5], verts[i + 6], verts[i + 7]] = normal;
    [verts[i + 8 + 5], verts[i + 8 + 6], verts[i + 8 + 7]] = normal;
    [verts[i + 16 + 5], verts[i + 16 + 6], verts[i + 16 + 7]] = normal;
  }
  return verts
}
