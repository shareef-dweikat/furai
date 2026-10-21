import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Product } from '../data/products.ts'

const Viewport = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background:
    radial-gradient(ellipse at 50% 70%, #fff8ee 0%, transparent 55%),
    linear-gradient(165deg, #efe6d8 0%, #ddd0bc 100%);

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
`

function createChair(): THREE.Group {
  const group = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({
    color: 0x8b6540,
    roughness: 0.55,
    metalness: 0.05,
  })
  const seat = new THREE.MeshStandardMaterial({
    color: 0xc4a882,
    roughness: 0.7,
  })

  const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.1), seat)
  seatMesh.position.y = 0.55
  group.add(seatMesh)

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.05, 0.12), wood)
  back.position.set(0, 1.15, -0.49)
  group.add(back)

  const legGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.55, 12)
  for (const [x, z] of [
    [-0.42, -0.42],
    [0.42, -0.42],
    [-0.42, 0.42],
    [0.42, 0.42],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, wood)
    leg.position.set(x, 0.275, z)
    group.add(leg)
  }

  return group
}

function createTable(): THREE.Group {
  const group = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({
    color: 0x6e4f32,
    roughness: 0.5,
    metalness: 0.08,
  })
  const top = new THREE.MeshStandardMaterial({
    color: 0xb8956c,
    roughness: 0.45,
  })

  const surface = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1.1), top)
  surface.position.y = 0.85
  group.add(surface)

  const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1)
  for (const [x, z] of [
    [-0.75, -0.4],
    [0.75, -0.4],
    [-0.75, 0.4],
    [0.75, 0.4],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, wood)
    leg.position.set(x, 0.4, z)
    group.add(leg)
  }

  return group
}

function createLamp(): THREE.Group {
  const group = new THREE.Group()
  const metal = new THREE.MeshStandardMaterial({
    color: 0x4a453f,
    roughness: 0.35,
    metalness: 0.55,
  })
  const shade = new THREE.MeshStandardMaterial({
    color: 0xf0e6d4,
    roughness: 0.85,
    metalness: 0,
  })

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 24), metal)
  base.position.y = 0.04
  group.add(base)

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16), metal)
  stem.position.y = 0.68
  group.add(stem)

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 24, 1, true), shade)
  cone.position.y = 1.4
  group.add(cone)

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff2c9,
      emissive: 0xffe4a3,
      emissiveIntensity: 0.6,
    }),
  )
  bulb.position.y = 1.2
  group.add(bulb)

  return group
}

function createModel(kind: Product['model']): THREE.Group {
  switch (kind) {
    case 'chair':
      return createChair()
    case 'table':
      return createTable()
    case 'lamp':
      return createLamp()
  }
}

export function ProductModelViewer({ model }: { model: Product['model'] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(2.4, 1.8, 2.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0.7, 0)
    controls.minDistance = 1.5
    controls.maxDistance = 6
    controls.maxPolarAngle = Math.PI / 2.05

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xfff5e8, 1.15)
    key.position.set(3, 5, 2)
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xdde6ff, 0.35)
    fill.position.set(-2.5, 2, -1)
    scene.add(fill)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        roughness: 0.95,
        metalness: 0,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const product = createModel(model)
    product.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(product)

    let frameId = 0
    const animate = () => {
      frameId = window.requestAnimationFrame(animate)
      product.rotation.y += 0.004
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth
      const nextHeight = container.clientHeight
      if (nextWidth === 0 || nextHeight === 0) {
        return
      }
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
      renderer.setSize(nextWidth, nextHeight)
    })
    resizeObserver.observe(container)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          for (const material of materials) {
            material.dispose()
          }
        }
      })
      renderer.domElement.remove()
    }
  }, [model])

  return <Viewport ref={containerRef} role="img" aria-label="3D product model" />
}
