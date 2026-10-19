import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import styled from 'styled-components'
import {
  DoubleSide,
  ExtrudeGeometry,
  NoToneMapping,
  Path,
  Shape,
} from 'three'
import {
  FloorPlanError,
  readFloorPlan,
  type FloorPlan,
  type Ring,
} from '../lib/floor-plan.ts'

const Frame = styled.div`
  height: min(70vh, 640px);
  overflow: hidden;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background: #d9d3c7;
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
    <Frame role="img" aria-label="3D apartment shell">
      <Canvas
        camera={{ fov: 42, near: 0.05, far: 200, position: [14, 11.5, 14] }}
        gl={{ antialias: true, toneMapping: NoToneMapping }}
      >
        <color attach="background" args={['#d9d3c7']} />
        <hemisphereLight args={['#fffaf3', '#c4b8a4', 1.15]} />
        <directionalLight position={[8, 14, 6]} intensity={1.8} />
        <Shell plan={plan} />
        <OrbitControls
          makeDefault
          enableDamping
          target={[0, 0.4, 0]}
          maxPolarAngle={Math.PI / 2 - 0.08}
          minDistance={plan.span * 0.2}
          maxDistance={plan.span * 4}
        />
      </Canvas>
    </Frame>
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
    </>
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
