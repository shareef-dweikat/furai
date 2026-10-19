import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import styled from 'styled-components'
import {
  Camera,
  DoubleSide,
  ExtrudeGeometry,
  NoToneMapping,
  Path,
  Shape,
} from 'three'
import {
  FloorPlanError,
  readFloorPlan,
  type Door,
  type FloorPlan,
  type Ring,
} from '../lib/floor-plan.ts'

const Stage = styled.div`
  position: relative;
  height: min(70vh, 640px);
  overflow: hidden;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background: #d9d3c7;

  &[data-mode='walk'] canvas {
    cursor: grab;
    touch-action: none;
  }

  &[data-dragging] canvas {
    cursor: grabbing;
  }
`

const Toolbar = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgb(255 252 247 / 0.88);
`

const ModeButton = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 6px 12px;
  background: transparent;
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: #efe8dc;
  }

  &[aria-pressed='true'] {
    background: #1c1915;
    color: #f7f3ec;
  }

  &[aria-pressed='true']:hover {
    background: #3a332c;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 2px;
  }
`

const Hint = styled.p`
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgb(255 252 247 / 0.88);
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.8rem;
  pointer-events: none;
`

const Status = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

const ChooseLink = styled(Link)`
  color: #1c1915;
`

export function ApartmentView({ svgUrl }: { svgUrl: string }) {
  return <ApartmentLoader key={svgUrl} svgUrl={svgUrl} />
}

function ApartmentLoader({ svgUrl }: { svgUrl: string }) {
  const [plan, setPlan] = useState<FloorPlan | null>(null)
  const [error, setError] = useState(false)
  const [mode, setMode] = useState<ViewMode>('walk')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let cancelled = false
    readFloorPlan(svgUrl)
      .then((next) => {
        if (!cancelled) setPlan(next)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        if (!(reason instanceof FloorPlanError)) console.error(reason)
        setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [svgUrl])

  if (error) {
    return (
      <Status>
        This file could not be read as a floor plan.{' '}
        <ChooseLink to="/space">Choose an SVG file</ChooseLink>
      </Status>
    )
  }

  if (!plan) return <Status>Building the apartment…</Status>

  return (
    <Stage
      role="region"
      aria-label="3D apartment"
      data-mode={mode}
      data-dragging={dragging ? 'true' : undefined}
    >
      <Toolbar role="group" aria-label="View">
        <ModeButton type="button" aria-pressed={mode === 'walk'} onClick={() => setMode('walk')}>
          Walk
        </ModeButton>
        <ModeButton
          type="button"
          aria-pressed={mode === 'overview'}
          onClick={() => setMode('overview')}
        >
          Overview
        </ModeButton>
      </Toolbar>
      {mode === 'walk' ? <Hint>Drag to look. WASD to walk.</Hint> : null}
      <Canvas
        camera={{ fov: 42, near: 0.05, far: 200, position: [14, 11.5, 14] }}
        gl={{ antialias: true, toneMapping: NoToneMapping }}
      >
        <color attach="background" args={['#d9d3c7']} />
        <hemisphereLight args={['#fffaf3', '#c4b8a4', 1.15]} />
        <directionalLight position={[8, 14, 6]} intensity={1.8} />
        <Shell plan={plan} />
        {mode === 'walk' ? (
          <Walker plan={plan} onDraggingChange={setDragging} />
        ) : (
          <Overview plan={plan} />
        )}
      </Canvas>
    </Stage>
  )
}

type ViewMode = 'walk' | 'overview'

const EYE_HEIGHT = 1.6
const PLAYER_RADIUS = 0.22
const WALK_SPEED = 2.4
const PITCH_LIMIT = Math.PI / 2 - 0.12
const LOOK_SPEED = 0.005

type Pose = {
  x: number
  z: number
  yaw: number
  pitch: number
}

type MoveKey = 'forward' | 'back' | 'left' | 'right'

const MOVE_KEYS: Record<string, MoveKey> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

function Walker({
  plan,
  onDraggingChange,
}: {
  plan: FloorPlan
  onDraggingChange: (dragging: boolean) => void
}) {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const navigation = useMemo(() => {
    const map = buildWalkMap(plan)
    return { map, pose: startPose(map) }
  }, [plan])
  const pose = useRef<Pose>({ ...navigation.pose })
  const keys = useRef({ forward: false, back: false, left: false, right: false })
  const drag = useRef<{ x: number; y: number; pointerId: number } | null>(null)

  useLayoutEffect(() => {
    applyPose(camera, pose.current)
  }, [camera])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const move = MOVE_KEYS[event.code]
      if (!move || event.metaKey || event.ctrlKey || event.altKey || typingTarget(event.target)) return
      keys.current[move] = true
      if (event.code.startsWith('Arrow')) event.preventDefault()
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const move = MOVE_KEYS[event.code]
      if (!move) return
      keys.current[move] = false
    }
    const clearKeys = () => {
      keys.current.forward = false
      keys.current.back = false
      keys.current.left = false
      keys.current.right = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
    }
  }, [])

  useEffect(() => {
    const element = gl.domElement
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      drag.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
      try {
        element.setPointerCapture(event.pointerId)
      } catch {
        // Looking still follows later move events when capture is unavailable.
      }
      onDraggingChange(true)
    }
    const onPointerMove = (event: PointerEvent) => {
      const current = drag.current
      if (!current || event.pointerId !== current.pointerId) return
      const dx = event.clientX - current.x
      const dy = event.clientY - current.y
      current.x = event.clientX
      current.y = event.clientY
      pose.current.yaw -= dx * LOOK_SPEED
      const nextPitch = pose.current.pitch - dy * LOOK_SPEED
      pose.current.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, nextPitch))
    }
    const endDrag = (event: PointerEvent) => {
      const current = drag.current
      if (!current || event.pointerId !== current.pointerId) return
      drag.current = null
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
      onDraggingChange(false)
    }
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', endDrag)
    element.addEventListener('pointercancel', endDrag)
    return () => {
      drag.current = null
      onDraggingChange(false)
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', endDrag)
      element.removeEventListener('pointercancel', endDrag)
    }
  }, [gl, onDraggingChange])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05) * WALK_SPEED
    const { forward, back, left, right } = keys.current
    let wishX = 0
    let wishZ = 0
    const yaw = pose.current.yaw
    const sin = Math.sin(yaw)
    const cos = Math.cos(yaw)
    const forwardX = -sin
    const forwardZ = -cos
    const rightX = cos
    const rightZ = -sin
    if (forward) {
      wishX += forwardX
      wishZ += forwardZ
    }
    if (back) {
      wishX -= forwardX
      wishZ -= forwardZ
    }
    if (right) {
      wishX += rightX
      wishZ += rightZ
    }
    if (left) {
      wishX -= rightX
      wishZ -= rightZ
    }
    const length = Math.hypot(wishX, wishZ)
    if (length > 0) {
      const next = slide(
        navigation.map,
        pose.current.x,
        pose.current.z,
        (wishX / length) * step,
        (wishZ / length) * step,
      )
      pose.current.x = next.x
      pose.current.z = next.z
    }
    applyPose(camera, pose.current)
  })

  return null
}

function Overview({ plan }: { plan: FloorPlan }) {
  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    placeOverviewCamera(camera)
  }, [camera])

  return (
    <OrbitControls
      makeDefault
      enableDamping
      target={[0, 0.4, 0]}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minDistance={plan.span * 0.2}
      maxDistance={plan.span * 4}
    />
  )
}

function Shell({ plan }: { plan: FloorPlan }) {
  return (
    <>
      <Slab
        outer={plan.floor}
        holes={[]}
        depth={plan.floorThickness}
        color="#e7dccb"
        drop={plan.floorThickness}
      />
      {plan.walls.map((wall, index) => (
        <Slab
          key={index}
          outer={wall.outer}
          holes={wall.holes}
          depth={plan.wallHeight}
          color="#f4f1ea"
          drop={0}
        />
      ))}
      {plan.doors.map((door, index) => (
        <DoorPanel key={index} door={door} wallHeight={plan.wallHeight} />
      ))}
    </>
  )
}

const DOOR_LEAF_HEIGHT = 2.05
const DOOR_LEAF_THICKNESS = 0.045

function DoorPanel({ door, wallHeight }: { door: Door; wallHeight: number }) {
  const leafHeight = Math.min(DOOR_LEAF_HEIGHT, wallHeight * 0.86)
  const headerHeight = Math.max(0, wallHeight - leafHeight)
  const leafThickness = Math.min(DOOR_LEAF_THICKNESS, door.thickness * 0.55)

  return (
    <group position={[door.x, 0, door.z]} rotation={[0, door.angle, 0]}>
      <mesh position={[0, leafHeight / 2, 0]}>
        <boxGeometry args={[door.width, leafHeight, leafThickness]} />
        <meshStandardMaterial color="#b08968" roughness={0.72} metalness={0} />
      </mesh>
      {headerHeight > 0 ? (
        <mesh position={[0, leafHeight + headerHeight / 2, 0]}>
          <boxGeometry args={[door.width, headerHeight, door.thickness]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.92} metalness={0} />
        </mesh>
      ) : null}
    </group>
  )
}

function Slab({
  outer,
  holes,
  depth,
  color,
  drop,
}: {
  outer: Ring
  holes: Ring[]
  depth: number
  color: string
  drop: number
}) {
  const geometry = useMemo(() => {
    if (outer.length < 3) return null
    try {
      const extruded = new ExtrudeGeometry(toShape(outer, holes), {
        depth,
        bevelEnabled: false,
      })
      extruded.rotateX(-Math.PI / 2)
      return extruded
    } catch {
      return null
    }
  }, [outer, holes, depth])

  useEffect(() => () => geometry?.dispose(), [geometry])
  if (!geometry) return null

  return (
    <mesh geometry={geometry} position={[0, -drop, 0]}>
      <meshStandardMaterial color={color} roughness={0.92} metalness={0} side={DoubleSide} flatShading />
    </mesh>
  )
}

function toShape(outer: Ring, holes: Ring[]): Shape {
  const shape = new Shape()
  appendRing(shape, forceWinding(outer.map(toShapePoint), true))
  for (const hole of holes) {
    if (hole.length < 3) continue
    const path = new Path()
    appendRing(path, forceWinding(hole.map(toShapePoint), false))
    shape.holes.push(path)
  }
  return shape
}

function toShapePoint([x, z]: [number, number]): [number, number] {
  return [x, -z]
}

function appendRing(path: Path, points: Array<[number, number]>) {
  const [first, ...rest] = points
  path.moveTo(first[0], first[1])
  for (const [x, y] of rest) path.lineTo(x, y)
}

function forceWinding(points: Array<[number, number]>, counterClockwise: boolean) {
  const area = signedArea(points)
  const isCounterClockwise = area > 0
  if (isCounterClockwise === counterClockwise) return points
  return [...points].reverse()
}

function signedArea(points: Array<[number, number]>): number {
  let area = 0
  for (let index = 0; index < points.length; index++) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function applyPose(camera: Camera, pose: Pose) {
  camera.position.set(pose.x, EYE_HEIGHT, pose.z)
  camera.rotation.order = 'YXZ'
  camera.rotation.set(pose.pitch, pose.yaw, 0)
}

function placeOverviewCamera(camera: Camera) {
  camera.rotation.order = 'XYZ'
  camera.up.set(0, 1, 0)
  camera.position.set(14, 11.5, 14)
  camera.lookAt(0, 0.4, 0)
}

function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

const WALK_CELL = 0.08

type WalkMap = {
  originX: number
  originZ: number
  cell: number
  columns: number
  rows: number
  blocked: Uint8Array
}

function startPose(map: WalkMap): Pose {
  const spot = findStand(map, true) ?? findStand(map, false) ?? { x: 0, z: 0 }
  return { x: spot.x, z: spot.z, yaw: clearestYaw(map, spot.x, spot.z), pitch: 0 }
}

function findStand(map: WalkMap, padded: boolean): { x: number; z: number } | null {
  const originX = map.originX + (map.columns * map.cell) / 2
  const originZ = map.originZ + (map.rows * map.cell) / 2
  if (fits(map, originX, originZ, padded)) return { x: originX, z: originZ }

  let bestX = 0
  let bestZ = 0
  let bestScore = Infinity
  for (let x = map.originX; x <= map.originX + map.columns * map.cell; x += 0.4) {
    for (let z = map.originZ; z <= map.originZ + map.rows * map.cell; z += 0.4) {
      if (!fits(map, x, z, padded)) continue
      const score = (x - originX) ** 2 + (z - originZ) ** 2
      if (score >= bestScore) continue
      bestScore = score
      bestX = x
      bestZ = z
    }
  }
  return bestScore < Infinity ? { x: bestX, z: bestZ } : null
}

function fits(map: WalkMap, x: number, z: number, padded: boolean): boolean {
  return padded ? canStand(map, x, z) : walkable(map, x, z)
}

function clearestYaw(map: WalkMap, x: number, z: number): number {
  let bestYaw = 0
  let bestClear = -1
  const reach = Math.max(map.columns, map.rows) * map.cell
  for (let index = 0; index < 16; index++) {
    const yaw = (index / 16) * Math.PI * 2
    const dx = -Math.sin(yaw)
    const dz = -Math.cos(yaw)
    let clear = 0
    for (let distance = 0.25; distance <= reach; distance += 0.25) {
      if (!walkable(map, x + dx * distance, z + dz * distance)) break
      clear = distance
    }
    if (clear > bestClear) {
      bestClear = clear
      bestYaw = yaw
    }
  }
  return bestYaw
}

function slide(map: WalkMap, x: number, z: number, dx: number, dz: number) {
  if (canStand(map, x + dx, z + dz)) return { x: x + dx, z: z + dz }
  if (canStand(map, x + dx, z)) return { x: x + dx, z }
  if (canStand(map, x, z + dz)) return { x, z: z + dz }
  return { x, z }
}

function canStand(map: WalkMap, x: number, z: number): boolean {
  if (!walkable(map, x, z)) return false
  for (let index = 0; index < 8; index++) {
    const angle = (index / 8) * Math.PI * 2
    if (!walkable(map, x + Math.cos(angle) * PLAYER_RADIUS, z + Math.sin(angle) * PLAYER_RADIUS)) {
      return false
    }
  }
  return true
}

function walkable(map: WalkMap, x: number, z: number): boolean {
  const column = Math.floor((x - map.originX) / map.cell)
  const row = Math.floor((z - map.originZ) / map.cell)
  if (column < 0 || row < 0 || column >= map.columns || row >= map.rows) return false
  return map.blocked[row * map.columns + column] === 0
}

function buildWalkMap(plan: FloorPlan): WalkMap {
  const points = [
    ...plan.floor,
    ...plan.walls.flatMap((wall) => wall.outer),
    ...plan.doors.map((door) => [door.x, door.z] as [number, number]),
  ]
  const bounds = ringBounds(points)
  const hull = convexHull(points)
  const pad = 0.6
  const originX = bounds.minX - pad
  const originZ = bounds.minZ - pad
  const columns = Math.max(1, Math.ceil((bounds.maxX + pad - originX) / WALK_CELL))
  const rows = Math.max(1, Math.ceil((bounds.maxZ + pad - originZ) / WALK_CELL))
  const blocked = new Uint8Array(columns * rows)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = originX + (column + 0.5) * WALK_CELL
      const z = originZ + (row + 0.5) * WALK_CELL
      const inside = pointInPolygon([x, z], hull) || pointInPolygon([x, z], plan.floor)
      if (!inside || hitsWall(plan, x, z)) blocked[row * columns + column] = 1
    }
  }
  clearDoorOpenings(plan, blocked, originX, originZ, columns, rows)
  return { originX, originZ, cell: WALK_CELL, columns, rows, blocked }
}

function clearDoorOpenings(
  plan: FloorPlan,
  blocked: Uint8Array,
  originX: number,
  originZ: number,
  columns: number,
  rows: number,
) {
  for (const door of plan.doors) {
    const reach = door.width / 2
    const depth = Math.max(door.thickness, 0.24)
    const minColumn = Math.max(0, Math.floor((door.x - reach - originX) / WALK_CELL))
    const maxColumn = Math.min(columns - 1, Math.ceil((door.x + reach - originX) / WALK_CELL))
    const minRow = Math.max(0, Math.floor((door.z - reach - originZ) / WALK_CELL))
    const maxRow = Math.min(rows - 1, Math.ceil((door.z + reach - originZ) / WALK_CELL))
    const cos = Math.cos(door.angle)
    const sin = Math.sin(door.angle)
    for (let row = minRow; row <= maxRow; row++) {
      for (let column = minColumn; column <= maxColumn; column++) {
        const x = originX + (column + 0.5) * WALK_CELL - door.x
        const z = originZ + (row + 0.5) * WALK_CELL - door.z
        const localX = x * cos - z * sin
        const localZ = x * sin + z * cos
        if (Math.abs(localX) <= door.width / 2 - 0.04 && Math.abs(localZ) <= depth / 2) {
          blocked[row * columns + column] = 0
        }
      }
    }
  }
}

function hitsWall(plan: FloorPlan, x: number, z: number): boolean {
  if (insideWallSolid(plan, x, z)) return true
  const offset = WALK_CELL * 0.45
  return (
    insideWallSolid(plan, x + offset, z) ||
    insideWallSolid(plan, x - offset, z) ||
    insideWallSolid(plan, x, z + offset) ||
    insideWallSolid(plan, x, z - offset)
  )
}

function insideWallSolid(plan: FloorPlan, x: number, z: number): boolean {
  for (const wall of plan.walls) {
    if (!pointInPolygon([x, z], wall.outer)) continue
    if (!wall.holes.some((hole) => pointInPolygon([x, z], hole))) return true
  }
  return false
}

function convexHull(points: Array<[number, number]>): Ring {
  const sorted = dedupePoints(points).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (sorted.length < 3) return sorted
  const cross = (origin: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])
  const lower: Array<[number, number]> = []
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }
  const upper: Array<[number, number]> = []
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function dedupePoints(points: Array<[number, number]>): Array<[number, number]> {
  const seen = new Set<string>()
  const unique: Array<[number, number]> = []
  for (const point of points) {
    const key = `${point[0].toFixed(3)},${point[1].toFixed(3)}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(point)
  }
  return unique
}

function pointInPolygon(point: [number, number], polygon: Ring): boolean {
  if (polygon.length < 3) return false
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

function ringBounds(points: Ring) {
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const [x, z] of points) {
    if (x < minX) minX = x
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (z > maxZ) maxZ = z
  }
  return { minX, minZ, maxX, maxZ }
}
