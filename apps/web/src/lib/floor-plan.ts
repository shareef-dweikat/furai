import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'

export type Ring = Array<[number, number]>

export type WallShape = {
  outer: Ring
  holes: Ring[]
}

export type FloorPlan = {
  walls: WallShape[]
  floor: Ring
  wallHeight: number
  floorThickness: number
  span: number
}

export class FloorPlanError extends Error {
  constructor() {
    super('This file could not be read as a floor plan.')
    this.name = 'FloorPlanError'
  }
}

const RASTER_MAX = 1800
const PLAN_METERS = 12
const WALL_HEIGHT = 2.4
const FLOOR_THICKNESS = 0.08
const INF = 1e6

type Pt = [number, number]

type ViewBox = {
  x: number
  y: number
  w: number
  h: number
}

type EllipseCurveLike = {
  isEllipseCurve: true
  aX: number
  aY: number
  xRadius: number
  yRadius: number
  aStartAngle: number
  aEndAngle: number
  getPoint: (t: number) => { x: number; y: number }
}

type DoorArc = {
  hinge: Pt
  ends: [Pt, Pt]
  radius: number
}

export async function readFloorPlan(svgUrl: string): Promise<FloorPlan> {
  const svgText = await fetch(svgUrl).then((response) => response.text())
  const viewBox = readViewBox(svgText)
  const { width, height, pixels } = await rasterize(svgText, viewBox)
  const ink = inkMask(pixels)
  removePageFrames(ink, width, height)
  const distToBackground = chamfer(width, height, invert(ink))
  const inkDistances = distancesOnInk(distToBackground, ink)
  const thickness = percentile(inkDistances, 0.98)
  const typical = percentile(inkDistances, 0.5)
  // A page frame can be thicker than the walls. When furniture lines are much
  // thinner, cut above those lines instead of a fraction of the thickest ink.
  if (!Number.isFinite(thickness) || thickness < 2) throw new FloorPlanError()
  const threshold =
    typical * 3 < thickness
      ? Math.max(1.25, typical * 2.5, thickness * 0.22)
      : Math.max(1.25, thickness * 0.35)
  const walls = new Uint8Array(ink.length)
  let wallPixels = 0
  for (let index = 0; index < ink.length; index++) {
    if (ink[index] === 1 && distToBackground[index] >= threshold) {
      walls[index] = 1
      wallPixels++
    }
  }
  if (wallPixels < 80) throw new FloorPlanError()

  removePageFrames(walls, width, height)
  const doors = findDoorArcs(svgText, viewBox, width, height)
  const wallThickness = thickness * 2
  for (const door of doors) punchDoor(walls, width, height, door, wallThickness)

  const wallLoops = loopsFromMask(walls, width, height, 36)
  const nested = nestWalls(wallLoops)
  if (nested.length === 0) throw new FloorPlanError()

  const doorRadius =
    doors.length > 0 ? Math.max(...doors.map((door) => door.radius)) : Math.max(width, height) * 0.045
  const closeRadius = Math.min(
    doorRadius * 0.55 + threshold * 2,
    Math.max(width, height) * 0.12,
  )
  const floorLoop = footprint(walls, width, height, closeRadius)
  if (!floorLoop) throw new FloorPlanError()

  return toMeters(nested, floorLoop)
}

function readViewBox(svgText: string): ViewBox {
  const xml = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = xml.documentElement
  if (svg.localName !== 'svg') throw new FloorPlanError()
  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const [x, y, w, h] = viewBox.trim().split(/[\s,]+/).map(Number)
    if (w > 0 && h > 0) return { x, y, w, h }
  }
  const w = positiveLength(svg.getAttribute('width'), 1000)
  const h = positiveLength(svg.getAttribute('height'), 1000)
  return { x: 0, y: 0, w, h }
}

function positiveLength(value: string | null, fallback: number): number {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function rasterize(
  svgText: string,
  viewBox: ViewBox,
): Promise<{ width: number; height: number; pixels: Uint8ClampedArray }> {
  const aspect = viewBox.w / viewBox.h
  const width = aspect >= 1 ? RASTER_MAX : Math.max(1, Math.round(RASTER_MAX * aspect))
  const height = aspect >= 1 ? Math.max(1, Math.round(RASTER_MAX / aspect)) : RASTER_MAX
  const xml = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = xml.documentElement
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: 'image/svg+xml',
  })
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new FloorPlanError()
    context.drawImage(image, 0, 0, width, height)
    return { width, height, pixels: context.getImageData(0, 0, width, height).data }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function inkMask(pixels: Uint8ClampedArray): Uint8Array {
  const mask = new Uint8Array(pixels.length / 4)
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4
    const alpha = pixels[offset + 3]
    if (alpha < 128) continue
    const luminance =
      0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2]
    if (luminance < 165) mask[index] = 1
  }
  return mask
}

function invert(mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(mask.length)
  for (let index = 0; index < mask.length; index++) out[index] = mask[index] ? 0 : 1
  return out
}

function chamfer(width: number, height: number, seed: Uint8Array): Float32Array {
  const dist = new Float32Array(width * height)
  dist.fill(INF)
  for (let index = 0; index < seed.length; index++) if (seed[index]) dist[index] = 0

  const relax = (index: number, neighbor: number, step: number) => {
    const next = dist[neighbor] + step
    if (next < dist[index]) dist[index] = next
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x
      if (x > 0) relax(index, index - 1, 1)
      if (y > 0) relax(index, index - width, 1)
      if (x > 0 && y > 0) relax(index, index - width - 1, 1.41421356)
      if (x + 1 < width && y > 0) relax(index, index - width + 1, 1.41421356)
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x
      if (x + 1 < width) relax(index, index + 1, 1)
      if (y + 1 < height) relax(index, index + width, 1)
      if (x + 1 < width && y + 1 < height) relax(index, index + width + 1, 1.41421356)
      if (x > 0 && y + 1 < height) relax(index, index + width - 1, 1.41421356)
    }
  }
  return dist
}

function distancesOnInk(dist: Float32Array, ink: Uint8Array): number[] {
  const values: number[] = []
  for (let index = 0; index < ink.length; index++) {
    if (ink[index]) values.push(dist[index])
  }
  return values
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[index]
}

function removePageFrames(mask: Uint8Array, width: number, height: number) {
  const seen = new Uint8Array(mask.length)
  const margin = Math.max(2, Math.round(Math.min(width, height) * 0.02))
  const inset = Math.max(3, Math.round(Math.min(width, height) * 0.03))

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue
    const pixels: number[] = []
    const stack = [start]
    seen[start] = 1
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    while (stack.length > 0) {
      const index = stack.pop() as number
      pixels.push(index)
      const x = index % width
      const y = (index - x) / width
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      const neighbors = [index - 1, index + 1, index - width, index + width]
      if (x > 0 && mask[neighbors[0]] && !seen[neighbors[0]]) {
        seen[neighbors[0]] = 1
        stack.push(neighbors[0])
      }
      if (x + 1 < width && mask[neighbors[1]] && !seen[neighbors[1]]) {
        seen[neighbors[1]] = 1
        stack.push(neighbors[1])
      }
      if (y > 0 && mask[neighbors[2]] && !seen[neighbors[2]]) {
        seen[neighbors[2]] = 1
        stack.push(neighbors[2])
      }
      if (y + 1 < height && mask[neighbors[3]] && !seen[neighbors[3]]) {
        seen[neighbors[3]] = 1
        stack.push(neighbors[3])
      }
    }

    const touchesFrame =
      minX <= margin &&
      minY <= margin &&
      maxX >= width - 1 - margin &&
      maxY >= height - 1 - margin
    if (!touchesFrame) continue

    let interior = 0
    for (const index of pixels) {
      const x = index % width
      const y = (index - x) / width
      const onBorder =
        x - minX <= inset || maxX - x <= inset || y - minY <= inset || maxY - y <= inset
      if (!onBorder) interior++
    }
    if (interior / pixels.length < 0.08) {
      for (const index of pixels) mask[index] = 0
    }
  }
}

function findDoorArcs(svgText: string, viewBox: ViewBox, width: number, height: number): DoorArc[] {
  const data = new SVGLoader().parse(svgText)
  const longSide = Math.max(viewBox.w, viewBox.h)
  const doors: DoorArc[] = []

  for (const path of data.paths) {
    const style = path.userData?.style as { stroke?: string; strokeWidth?: number } | undefined
    const stroke = style?.stroke
    if (!stroke || stroke === 'none') continue
    const strokeWidth = Number(style?.strokeWidth ?? 1)

    for (const subPath of path.subPaths) {
      for (const curve of subPath.curves) {
        if (!isEllipse(curve)) continue
        const radius = (curve.xRadius + curve.yRadius) / 2
        const ratio = curve.xRadius / curve.yRadius
        if (ratio < 0.75 || ratio > 1.33) continue
        if (radius < longSide * 0.02 || radius > longSide * 0.2) continue
        if (strokeWidth > radius * 0.35) continue
        const sweep = arcSweep(curve.aStartAngle, curve.aEndAngle)
        if (sweep < Math.PI * 0.3 || sweep > Math.PI * 0.85) continue

        const start = curve.getPoint(0)
        const end = curve.getPoint(1)
        const toPixel = (x: number, y: number): Pt => [
          ((x - viewBox.x) / viewBox.w) * width,
          ((y - viewBox.y) / viewBox.h) * height,
        ]
        doors.push({
          hinge: toPixel(curve.aX, curve.aY),
          ends: [toPixel(start.x, start.y), toPixel(end.x, end.y)],
          radius: ((curve.xRadius / viewBox.w) * width + (curve.yRadius / viewBox.h) * height) / 2,
        })
      }
    }
  }
  return doors
}

function isEllipse(curve: object): curve is EllipseCurveLike {
  return 'isEllipseCurve' in curve && curve.isEllipseCurve === true
}

function arcSweep(start: number, end: number): number {
  let sweep = Math.abs(end - start) % (Math.PI * 2)
  if (sweep > Math.PI) sweep = Math.PI * 2 - sweep
  return sweep
}

function punchDoor(
  mask: Uint8Array,
  width: number,
  height: number,
  door: DoorArc,
  wallThickness: number,
) {
  const directions = door.ends.map((end) => [end[0] - door.hinge[0], end[1] - door.hinge[1]] as Pt)
  let best: Pt | null = null
  let bestRemoved = 0
  for (const direction of directions) {
    const removed = stampDoor(mask, width, height, door, direction, wallThickness, false)
    if (removed > bestRemoved) {
      bestRemoved = removed
      best = direction
    }
  }
  if (best && bestRemoved > 8) stampDoor(mask, width, height, door, best, wallThickness, true)
}

function stampDoor(
  mask: Uint8Array,
  width: number,
  height: number,
  door: DoorArc,
  direction: Pt,
  wallThickness: number,
  apply: boolean,
): number {
  const length = Math.hypot(direction[0], direction[1]) || 1
  const ux = direction[0] / length
  const uy = direction[1] / length
  const px = -uy
  const py = ux
  const reach = door.radius
  const halfWidth = wallThickness * 1.4
  const back = reach * 0.2
  const minX = Math.max(0, Math.floor(door.hinge[0] - reach - halfWidth))
  const maxX = Math.min(width - 1, Math.ceil(door.hinge[0] + reach + halfWidth))
  const minY = Math.max(0, Math.floor(door.hinge[1] - reach - halfWidth))
  const maxY = Math.min(height - 1, Math.ceil(door.hinge[1] + reach + halfWidth))
  let removed = 0

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - door.hinge[0]
      const dy = y + 0.5 - door.hinge[1]
      const along = dx * ux + dy * uy
      const across = dx * px + dy * py
      if (along < -back || along > reach || Math.abs(across) > halfWidth) continue
      const index = y * width + x
      if (!mask[index]) continue
      removed++
      if (apply) mask[index] = 0
    }
  }
  return removed
}

function footprint(walls: Uint8Array, width: number, height: number, radius: number): Pt[] | null {
  const dilated = dilate(walls, width, height, radius)
  const outer = largestLoop(dilated, width, height)
  if (!outer) return null
  const solid = fillPolygon(outer, width, height)
  const distOutside = chamfer(width, height, invert(solid))
  const eroded = new Uint8Array(walls.length)
  let count = 0
  for (let index = 0; index < solid.length; index++) {
    if (solid[index] && distOutside[index] >= radius) {
      eroded[index] = 1
      count++
    }
  }
  if (count < 40) return outer
  return largestLoop(eroded, width, height) ?? outer
}

function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const dist = chamfer(width, height, mask)
  const out = new Uint8Array(mask.length)
  for (let index = 0; index < mask.length; index++) {
    if (dist[index] <= radius) out[index] = 1
  }
  return out
}

function toMeters(walls: Array<{ outer: Pt[]; holes: Pt[][] }>, floor: Pt[]): FloorPlan {
  const bounds = ringBounds(floor)
  const longSide = Math.max(bounds.width, bounds.height)
  if (longSide < 1) throw new FloorPlanError()
  const scale = PLAN_METERS / longSide
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const project = (points: Pt[]): Ring =>
    points.map(([x, y]) => [(x - centerX) * scale, (y - centerY) * scale])

  return {
    walls: walls.map((shape) => ({
      outer: project(shape.outer),
      holes: shape.holes.map(project),
    })),
    floor: project(floor),
    wallHeight: WALL_HEIGHT,
    floorThickness: FLOOR_THICKNESS,
    span: PLAN_METERS,
  }
}

function ringBounds(points: Pt[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

type Loop = { pts: Pt[]; area: number; sample: Pt }

function loopsFromMask(mask: Uint8Array, width: number, height: number, minArea: number): Loop[] {
  return traceContours(mask, width, height)
    .map((points) => {
      const pts = simplifyClosed(points, 3.2)
      return { pts, area: signedArea(pts), sample: interiorPoint(pts) }
    })
    .filter((loop) => loop.pts.length >= 3 && Math.abs(loop.area) >= minArea)
}

function largestLoop(mask: Uint8Array, width: number, height: number): Pt[] | null {
  const loops = loopsFromMask(mask, width, height, 40)
  loops.sort((a, b) => Math.abs(b.area) - Math.abs(a.area))
  return loops[0]?.pts ?? null
}

function nestWalls(loops: Loop[]): Array<{ outer: Pt[]; holes: Pt[][] }> {
  const sorted = [...loops].sort((a, b) => Math.abs(b.area) - Math.abs(a.area))
  const shapes: Array<{ outer: Pt[]; holes: Pt[][]; area: number }> = []
  for (const loop of sorted) {
    let parent: (typeof shapes)[number] | null = null
    for (const shape of shapes) {
      if (!pointInPolygon(loop.sample, shape.outer)) continue
      if (shape.holes.some((hole) => pointInPolygon(loop.sample, hole))) continue
      parent = shape
      break
    }
    if (!parent) {
      shapes.push({ outer: loop.pts, holes: [], area: loop.area })
      continue
    }
    if (Math.sign(loop.area) !== Math.sign(parent.area)) parent.holes.push(loop.pts)
    else shapes.push({ outer: loop.pts, holes: [], area: loop.area })
  }
  return shapes.map(({ outer, holes }) => ({ outer, holes }))
}

function traceContours(mask: Uint8Array, width: number, height: number): Pt[][] {
  const segments: Array<[Pt, Pt]> = []
  const bit = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 0 : mask[y * width + x]
  const add = (a: Pt, b: Pt) => segments.push([a, b])

  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const code = bit(x, y) | (bit(x + 1, y) << 1) | (bit(x + 1, y + 1) << 2) | (bit(x, y + 1) << 3)
      if (code === 0 || code === 15) continue
      const top: Pt = [x + 1, y + 0.5]
      const right: Pt = [x + 1.5, y + 1]
      const bottom: Pt = [x + 1, y + 1.5]
      const left: Pt = [x + 0.5, y + 1]
      switch (code) {
        case 1:
          add(left, top)
          break
        case 2:
          add(top, right)
          break
        case 3:
          add(left, right)
          break
        case 4:
          add(right, bottom)
          break
        case 5:
          add(left, bottom)
          add(top, right)
          break
        case 6:
          add(top, bottom)
          break
        case 7:
          add(left, bottom)
          break
        case 8:
          add(bottom, left)
          break
        case 9:
          add(bottom, top)
          break
        case 10:
          add(bottom, right)
          add(left, top)
          break
        case 11:
          add(bottom, right)
          break
        case 12:
          add(right, left)
          break
        case 13:
          add(right, top)
          break
        case 14:
          add(top, left)
          break
        default:
          break
      }
    }
  }

  const next = new Map<string, Array<{ pt: Pt; to: string }>>()
  for (const [start, end] of segments) {
    const from = pointKey(start)
    const to = pointKey(end)
    const list = next.get(from) ?? []
    list.push({ pt: end, to })
    next.set(from, list)
  }

  const used = new Set<string>()
  const loops: Pt[][] = []
  for (const [start, outs] of next) {
    for (const out of outs) {
      if (used.has(`${start}>${out.to}`)) continue
      const loop: Pt[] = []
      let current = start
      let closed = false
      for (let guard = 0; guard < segments.length + 2; guard++) {
        const options = next.get(current)
        const step = options?.find((option) => !used.has(`${current}>${option.to}`))
        if (!step) break
        used.add(`${current}>${step.to}`)
        loop.push(step.pt)
        current = step.to
        if (current === start) {
          closed = true
          break
        }
      }
      if (closed && loop.length >= 4) loops.push(loop)
    }
  }
  return loops
}

function pointKey(point: Pt): string {
  return `${Math.round(point[0] * 2)},${Math.round(point[1] * 2)}`
}

function signedArea(points: Pt[]): number {
  let area = 0
  for (let index = 0; index < points.length; index++) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function simplifyClosed(points: Pt[], epsilon: number): Pt[] {
  const clean = dedupe(points, 0.75)
  if (clean.length <= 4) return clean
  // First and last points are neighbors on the loop. Simplifying that open
  // chain keeps the corners and drops the pixel steps along each wall.
  const simplified = simplifyOpen(clean, epsilon)
  return simplified.length >= 3 ? simplified : clean
}

function dedupe(points: Pt[], min: number): Pt[] {
  const out: Pt[] = []
  for (const point of points) {
    const previous = out[out.length - 1]
    if (!previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= min) {
      out.push(point)
    }
  }
  if (out.length > 2) {
    const first = out[0]
    const last = out[out.length - 1]
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < min) out.pop()
  }
  return out
}

function simplifyOpen(points: Pt[], epsilon: number): Pt[] {
  if (points.length <= 2) return points
  const keep = new Array<boolean>(points.length).fill(false)
  keep[0] = true
  keep[points.length - 1] = true
  const stack: Array<[number, number]> = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [start, end] = stack.pop() as [number, number]
    const [x1, y1] = points[start]
    const [x2, y2] = points[end]
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.hypot(dx, dy) || 1
    let maxDist = 0
    let index = -1
    for (let pointIndex = start + 1; pointIndex < end; pointIndex++) {
      const [x, y] = points[pointIndex]
      const dist = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length
      if (dist > maxDist) {
        maxDist = dist
        index = pointIndex
      }
    }
    if (index !== -1 && maxDist > epsilon) {
      keep[index] = true
      stack.push([start, index], [index, end])
    }
  }
  return points.filter((_, index) => keep[index])
}

function interiorPoint(polygon: Pt[]): Pt {
  for (let index = 0; index < polygon.length; index++) {
    const [x1, y1] = polygon[index]
    const [x2, y2] = polygon[(index + 1) % polygon.length]
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.hypot(dx, dy)
    if (length < 1) continue
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const nx = -dy / length
    const ny = dx / length
    const left: Pt = [midX + nx * 0.75, midY + ny * 0.75]
    if (pointInPolygon(left, polygon)) return left
    const right: Pt = [midX - nx * 0.75, midY - ny * 0.75]
    if (pointInPolygon(right, polygon)) return right
  }
  return polygon[0]
}

function pointInPolygon(point: Pt, polygon: Pt[]): boolean {
  const [x, y] = point
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index]
    const [xj, yj] = polygon[previous]
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function fillPolygon(points: Pt[], width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    const scanY = y + 0.5
    const crossings: number[] = []
    for (let index = 0; index < points.length; index++) {
      const [x1, y1] = points[index]
      const [x2, y2] = points[(index + 1) % points.length]
      if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
        crossings.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1))
      }
    }
    crossings.sort((a, b) => a - b)
    for (let index = 0; index + 1 < crossings.length; index += 2) {
      const start = Math.max(0, Math.ceil(crossings[index]))
      const end = Math.min(width - 1, Math.floor(crossings[index + 1]))
      for (let x = start; x <= end; x++) mask[y * width + x] = 1
    }
  }
  return mask
}
