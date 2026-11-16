import { useGLTF, useTexture } from '@react-three/drei'
import { createPortal, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial,
  CylinderGeometry, RepeatWrapping, SRGBColorSpace, type Texture,
} from 'three'
import { studioAsset } from './assets'
import { FILM_CENTRELINE } from './filmPath'

export const PROJECTOR_LENS = [0.00181669, 0.14355251, -0.11139495] as const
export const PROJECTOR_AXIS = [0, 0, -1] as const
const FRAME_PITCH = 0.00762
const TILE_LENGTH = 8 * FRAME_PITCH
const SUPPLY_RADIUS = 0.087
const TAKEUP_RADIUS = 0.057
const GLASS_LIGHT = new Color('#ffe5ae')
type Props = {
  position?: [number, number, number]
  rotationY?: number
  scale?: number
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  running?: boolean
  lamp?: { current: number }
  modelUrl?: string
  filmUrl?: string
}

// Each guide is described in the Y/Z plane of the print. Spin is the sign of its local X rotation.
type Point = readonly [number, number]
type Wheel = { centre: Point; radius: number; spin: 1 | -1 }
const SUPPLY: Wheel = { centre: [0.301983, -0.166953], radius: SUPPLY_RADIUS, spin: -1 }
const TAKEUP: Wheel = { centre: [0.278026, 0.166953], radius: TAKEUP_RADIUS, spin: 1 }
const OUTLET: Wheel = { centre: [0.135, 0.145], radius: 0.011, spin: -1 }
const TOP_GUIDE: Wheel = { centre: [0.298, -0.034], radius: 0.0125, spin: 1 }

function tangent(a: Wheel, b: Wheel): [Point, Point] {
  const dy = b.centre[0] - a.centre[0], dz = b.centre[1] - a.centre[1]
  const distance = Math.hypot(dy, dz)
  const k = (a.spin * a.radius - b.spin * b.radius) / distance
  const h = Math.sqrt(1 - k * k)
  const ny = (k * dy + h * dz) / distance, nz = (k * dz - h * dy) / distance
  const touch = (w: Wheel): Point => [w.centre[0] + w.spin * w.radius * ny, w.centre[1] + w.spin * w.radius * nz]
  return [touch(a), touch(b)]
}

function wrap(wheel: Wheel, start: Point, end: Point): Point[] {
  const angle = (p: Point) => Math.atan2(p[1] - wheel.centre[1], p[0] - wheel.centre[0])
  const a = angle(start), turn = Math.PI * 2
  const span = wheel.spin * ((wheel.spin * (angle(end) - a) + turn) % turn)
  const slices = Math.ceil(Math.abs(span) * 12)
  return Array.from({ length: slices + 1 }, (_, i) => [
    wheel.centre[0] + wheel.radius * Math.cos(a + span * i / slices),
    wheel.centre[1] + wheel.radius * Math.sin(a + span * i / slices),
  ])
}

function transportPath(): Point[] {
  const gate = FILM_CENTRELINE.slice(1, -1)
  const pin = (centre: Point): Wheel => ({ centre, radius: 0, spin: 1 })
  const [supplyExit] = tangent(SUPPLY, pin(gate[0]))
  const [, lowIn] = tangent(pin(gate[gate.length - 1]), OUTLET)
  const [lowOut, topIn] = tangent(OUTLET, TOP_GUIDE)
  const [topOut, takeupIn] = tangent(TOP_GUIDE, TAKEUP)
  // Two outside idlers take the returning film above the casing. Both free spans
  // are tangent to their bearings and stay in the groove of the take-up reel.
  return [supplyExit, ...gate, ...wrap(OUTLET, lowIn, lowOut), ...wrap(TOP_GUIDE, topIn, topOut), takeupIn]
}

function threadedStrip() {
  const positions: number[] = []
  const uv: number[] = []
  const indices: number[] = []
  let length = 0
  transportPath().forEach(([y, z], i, points) => {
    if (i) length += Math.hypot(y - points[i - 1][0], z - points[i - 1][1])
    positions.push(-0.00662, y, z, 0.01025, y, z)
    uv.push(0, length / TILE_LENGTH, 1, length / TILE_LENGTH)
    if (i) {
      const k = i * 2
      indices.push(k - 2, k - 1, k, k, k - 1, k + 1)
    }
  })
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

// A spool of stock fills the space *between* the original pressed-metal flanges.
// Map its face radially and its outer wrap lengthwise along the actual circumference.
function WoundPrint({ radius, edge, picture }: { radius: number; edge: Texture; picture: Texture }) {
  const geometry = useMemo(() => {
    const g = new CylinderGeometry(radius, radius, 0.0173, 128, 1)
    const uv = g.getAttribute('uv')
    // The first indexed group is the cylindrical wrap. The cap UVs stay planar.
    const side = g.groups[0], vertices = new Set<number>()
    for (let i = side.start; i < side.start + side.count; i++) vertices.add(g.index!.getX(i))
    for (const i of vertices) {
      const angle = uv.getX(i), across = uv.getY(i)
      uv.setXY(i, across, angle * Math.PI * 2 * radius / TILE_LENGTH)
    }
    return g
  }, [radius])
  useEffect(() => () => { geometry.dispose() }, [geometry])
  return <mesh name="WoundAcetate" geometry={geometry} rotation-z={-Math.PI / 2} position-x={-0.00025} castShadow receiveShadow>
    <meshStandardMaterial attach="material-0" map={picture} color="#ead1ab" roughness={0.32} metalness={0.12} />
    <meshStandardMaterial attach="material-1" map={edge} emissiveMap={edge} emissive="#54351d" emissiveIntensity={0.30} roughness={0.41} metalness={0.18} />
    <meshStandardMaterial attach="material-2" map={edge} emissiveMap={edge} emissive="#54351d" emissiveIntensity={0.30} roughness={0.41} metalness={0.18} />
  </mesh>
}

function Guide({ wheel, mount }: { wheel: Wheel; mount: Point }) {
  const [y, z] = wheel.centre, dy = y - mount[0], dz = z - mount[1]
  return <group>
    <mesh position={[0.027, y - dy / 2, z - dz / 2]} rotation-x={Math.atan2(dz, dy)} castShadow>
      <boxGeometry args={[0.0042, Math.hypot(dy, dz), 0.009]} />
      <meshStandardMaterial color="#817769" roughness={0.38} metalness={0.68} />
    </mesh>
    <group position={[0.0018, y, z]} rotation-z={-Math.PI / 2}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[wheel.radius - 0.0002, wheel.radius - 0.0002, 0.019, 40]} />
        <meshStandardMaterial color="#766b5f" metalness={0.72} roughness={0.32} />
      </mesh>
      {[-0.0105, 0.0105].map(x => <mesh key={x} position-y={x} castShadow>
        <cylinderGeometry args={[wheel.radius + 0.0022, wheel.radius + 0.0022, 0.0016, 40]} />
        <meshStandardMaterial color="#bdb6a7" metalness={0.7} roughness={0.32} />
      </mesh>)}
      <mesh position-y={0.0165}>
        <cylinderGeometry args={[0.0033, 0.0033, 0.025, 16]} />
        <meshStandardMaterial color="#3b352e" metalness={0.64} roughness={0.4} />
      </mesh>
    </group>
  </group>
}

export function FilmProjector({
  position, rotationY = 0, scale = 1, onClick, running = true, lamp,
  modelUrl = studioAsset('film-projector.glb'),
  filmUrl = studioAsset('projector-film.png'),
}: Props) {
  const { scene } = useGLTF(modelUrl)
  const [stock, winding] = useTexture([filmUrl, studioAsset('projector-winding.jpg')])
  const rig = useMemo(() => {
    const object = scene.clone(true)
    const body = object.getObjectByName('Body')!
    const lens = object.getObjectByName('LensGlass') as Mesh<BufferGeometry, MeshStandardMaterial>
    const glass = lens.material.clone()
    glass.emissive.copy(GLASS_LIGHT)
    lens.material = glass
    object.traverse(part => {
      if (part instanceof Mesh) part.castShadow = part.receiveShadow = true
    })
    body.traverse(part => {
      // This SKP already contains the threaded strip. Its split solid has no UVs.
      // The running print below uses the very same path over the original rollers.
      if (part instanceof Mesh && part.material.name === 'Film stock') part.visible = false
    })
    const supply = object.getObjectByName('ReelSupply')!, takeup = object.getObjectByName('ReelTakeup')!
    for (const reel of [supply, takeup]) reel.traverse(part => {
      if (part instanceof Mesh && part.material.name === 'Film stock') part.visible = false
    })
    return { object, glass, supply, takeup }
  }, [scene])
  const strip = useMemo(threadedStrip, [])
  const print = useMemo(() => {
    const texture = stock.clone()
    texture.wrapT = RepeatWrapping
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
    return texture
  }, [stock])
  const film = useMemo(() => print.clone(), [print])
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)'), [])

  useEffect(() => () => { rig.glass.dispose() }, [rig])
  useEffect(() => () => { film.dispose(); print.dispose() }, [film, print])
  useEffect(() => () => { strip.dispose() }, [strip])

  useFrame((_, dt) => {
    rig.glass.emissiveIntensity = 2.2 * (lamp?.current ?? (running ? 1 : 0))
    if (!running || reduced.matches) return
    const advance = Math.min(dt, 0.08) * 24 * FRAME_PITCH
    // Front roll unwinds down its left tangent; rear roll winds up its inner tangent.
    // Both surface speeds equal the transport speed at the gate.
    rig.supply.rotation.x -= advance / SUPPLY_RADIUS
    rig.takeup.rotation.x += advance / TAKEUP_RADIUS
    film.offset.y = (film.offset.y - advance / TILE_LENGTH) % 1
  })

  return (
    <group name="PaperbulletFilmProjector" position={position} rotation-y={rotationY} scale={scale} onClick={onClick}>
      <primitive object={rig.object} />
      {createPortal(<WoundPrint radius={SUPPLY_RADIUS} edge={winding} picture={print} />, rig.supply)}
      {createPortal(<WoundPrint radius={TAKEUP_RADIUS} edge={winding} picture={print} />, rig.takeup)}
      <Guide wheel={OUTLET} mount={[0.115, 0.085]} />
      <Guide wheel={TOP_GUIDE} mount={[0.211, -0.022]} />
      <mesh name="Threaded16mmPrint" geometry={strip} castShadow receiveShadow>
        <meshStandardMaterial map={film} emissiveMap={film} emissive="#674420" emissiveIntensity={0.24} alphaTest={0.36} side={DoubleSide} roughness={0.3} metalness={0.12} />
      </mesh>
    </group>
  )
}
