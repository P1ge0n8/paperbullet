import { useEffect, useMemo } from 'react'
import {
  BufferGeometry, CanvasTexture, DoubleSide, ExtrudeGeometry, Float32BufferAttribute,
  LatheGeometry, Path, Shape, SRGBColorSpace, Vector2,
} from 'three'

const TAU = Math.PI * 2

function usePaint(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    draw(canvas.getContext('2d')!)
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [width, height, draw])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function canLabel(g: CanvasRenderingContext2D) {
  g.fillStyle = '#e5ac35'
  g.fillRect(0, 0, 1024, 384)
  g.fillStyle = '#252621'
  g.fillRect(0, 0, 1024, 46)
  g.fillRect(0, 271, 1024, 113)
  g.fillStyle = '#ae5331'
  g.fillRect(0, 242, 1024, 20)
  for (const x of [24, 536]) {
    g.fillStyle = '#28271f'
    g.font = 'bold 116px Helvetica, Arial, sans-serif'
    g.fillText('35', x, 201)
    g.font = 'bold 40px Helvetica, Arial, sans-serif'
    g.fillText('mm', x + 136, 200)
    g.font = 'bold 24px monospace'
    g.fillText('COLOR NEGATIVE', x + 18, 93)
    g.fillStyle = '#f1e4c2'
    g.font = 'bold 28px monospace'
    g.fillText('36 EXP.', x + 17, 321)
    for (let i = 0; i < 12; i++) {
      if (i % 5 === 3) continue
      g.fillRect(x + 255 + (i % 6) * 28, 285 + Math.floor(i / 6) * 27, 21, 21)
    }
  }
}

function leaderPaint(g: CanvasRenderingContext2D) {
  g.fillStyle = '#80512e'
  g.fillRect(0, 0, 768, 192)
  for (let i = 0; i < 5; i++) {
    const toned = g.createLinearGradient(0, 38, 20, 156)
    toned.addColorStop(0, '#573729')
    toned.addColorStop(0.65, '#4a3027')
    toned.addColorStop(1, '#684532')
    g.fillStyle = toned
    g.fillRect(i * 164 + 6, 40, 152, 112)
  }
  g.fillStyle = '#cf9a53'
  g.font = '11px monospace'
  for (let i = 0; i < 5; i++) g.fillText(String(18 + i), i * 164 + 14, 166)
  for (let i = 0; i < 34; i++) {
    for (const y of [10, 171]) {
      g.clearRect(i * 23 + 3, y, 12, 11)
    }
  }
}

function bentLeader() {
  const verts: number[] = [], tex: number[] = [], inds: number[] = []
  const segments = 54
  for (let j = 0; j <= segments; j++) {
    const t = j / segments
    const x = 0.043 + 0.153 * t
    const z = 0.004 + 0.029 * Math.sin(5.2 * t) + 0.068 * t * t
    const bottom = 0.006 + 0.003 * Math.sin(Math.PI * t)
    const width = 0.085 * (1 - 0.39 * Math.max(0, (t - 0.78) / 0.22))
    const twist = t * 0.8
    verts.push(x, bottom, z, x, bottom + width * Math.cos(twist), z - width * Math.sin(twist))
    tex.push(t, 0, t, 1)
    if (j < segments) {
      const q = j * 2
      inds.push(q, q + 1, q + 2, q + 2, q + 1, q + 3)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(verts, 3))
  geo.setAttribute('uv', new Float32BufferAttribute(tex, 2))
  geo.setIndex(inds)
  geo.computeVertexNormals()
  return geo
}

function StillFilm() {
  const label = usePaint(1024, 384, canLabel)
  const leader = usePaint(768, 192, leaderPaint)
  const strip = useMemo(bentLeader, [])
  return (
    <group name="35mm still film" position={[0.05, 0, 0.20]} rotation-y={-0.38}>
      <mesh castShadow receiveShadow position-y={0.061} rotation-y={-0.18}>
        <cylinderGeometry args={[0.045, 0.045, 0.11, 64, 1, true]} />
        <meshStandardMaterial map={label} roughness={0.46} metalness={0.23} />
      </mesh>
      {[0.006, 0.117].map(y => (
        <group key={y} position-y={y}>
          <mesh castShadow receiveShadow><cylinderGeometry args={[0.047, 0.047, 0.010, 64]} /><meshStandardMaterial color="#343430" roughness={0.4} metalness={0.51} /></mesh>
          <mesh position-y={0.005} rotation-x={Math.PI / 2}><torusGeometry args={[0.0445, 0.0012, 6, 64]} /><meshStandardMaterial color="#666159" roughness={0.39} metalness={0.69} /></mesh>
        </group>
      ))}
      <mesh castShadow position-y={0.128}><cylinderGeometry args={[0.017, 0.018, 0.012, 40]} /><meshStandardMaterial color="#30302b" roughness={0.59} /></mesh>
      <mesh position-y={0.135}><cylinderGeometry args={[0.010, 0.010, 0.002, 32]} /><meshStandardMaterial color="#171918" roughness={0.72} /></mesh>
      <mesh position-y={0.137} rotation-y={0.22}><boxGeometry args={[0.018, 0.003, 0.004]} /><meshStandardMaterial color="#45453c" roughness={0.58} /></mesh>
      <mesh castShadow position={[0.044, 0.057, -0.003]}><boxGeometry args={[0.012, 0.102, 0.014]} /><meshStandardMaterial color="#22211e" roughness={0.91} /></mesh>
      <mesh geometry={strip} castShadow receiveShadow><meshStandardMaterial map={leader} alphaTest={0.55} side={DoubleSide} roughness={0.34} metalness={0.12} /></mesh>
    </group>
  )
}

function flange() {
  const s = new Shape()
  s.absarc(0, 0, 0.18, 0, TAU, false)
  const hole = new Path()
  hole.absarc(0, 0, 0.015, 0, TAU, true)
  s.holes.push(hole)
  // Rounded punch-outs leave a continuous pressed-metal web between spokes.
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + 0.11
    const slot = new Path()
    const xy = (x: number, y: number): [number, number] => [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y]
    slot.moveTo(...xy(0.064, -0.013))
    slot.bezierCurveTo(...xy(0.063, -0.032), ...xy(0.091, -0.038), ...xy(0.138, -0.043))
    slot.bezierCurveTo(...xy(0.154, -0.045), ...xy(0.160, -0.026), ...xy(0.159, 0.003))
    slot.bezierCurveTo(...xy(0.158, 0.030), ...xy(0.148, 0.045), ...xy(0.135, 0.042))
    slot.bezierCurveTo(...xy(0.089, 0.032), ...xy(0.063, 0.020), ...xy(0.064, -0.013))
    s.holes.push(slot)
  }
  return new ExtrudeGeometry(s, {depth:0.0024, bevelEnabled:true, bevelSize:0.001, bevelThickness:0.00065, bevelSegments:2, curveSegments:16})
}

function coilSurface(g: CanvasRenderingContext2D) {
  g.fillStyle = '#332d24'
  g.fillRect(0, 0, 512, 512)
  for (let i = 6; i < 255; i += 1.8) {
    const light = 44 + Math.round(20 * (Math.sin(i * 0.86) + 1))
    g.strokeStyle = 'rgb(' + light + ',' + (light - 7) + ',' + (light - 15) + ')'
    g.lineWidth = 1
    g.beginPath()
    g.arc(256, 256, i, 0, TAU)
    g.stroke()
  }
}

function gaugeLabel(g: CanvasRenderingContext2D) {
  g.fillStyle = '#ddcba0'
  g.fillRect(0, 0, 384, 120)
  g.fillStyle = '#38352b'
  g.font = 'bold 71px Helvetica, Arial, sans-serif'
  g.fillText('16 mm', 24, 82)
  g.fillStyle = '#91492c'
  g.fillRect(316, 0, 10, 120)
}

function CinemaReel() {
  const plate = useMemo(flange, [])
  const wound = usePaint(512, 512, coilSurface)
  const gauge = usePaint(384, 120, gaugeLabel)
  return (
    <group name="16mm motion picture reel" position={[0.69, 0, 0.19]} rotation-y={-0.15}>
      {[0.004, 0.047].map(y => (
        <group key={y} position-y={y}>
          <mesh geometry={plate} rotation-x={-Math.PI / 2} castShadow receiveShadow>
            <meshStandardMaterial color="#9c9e96" metalness={0.72} roughness={0.36} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position-y={0.002}>
            <torusGeometry args={[0.178, 0.0015, 6, 96]} />
            <meshStandardMaterial color="#bebcb0" metalness={0.68} roughness={0.33} />
          </mesh>
        </group>
      ))}
      <mesh castShadow receiveShadow position-y={0.026}><cylinderGeometry args={[0.029,0.029,0.041,40,1,true]} /><meshStandardMaterial color="#777a71" metalness={0.58} roughness={0.4}/></mesh>
      <mesh castShadow position-y={0.027}><cylinderGeometry args={[0.149, 0.149, 0.035, 96, 1, true]} /><meshStandardMaterial color="#393127" roughness={0.38} /></mesh>
      <mesh position-y={0.045} rotation-x={-Math.PI / 2}><ringGeometry args={[0.018, 0.149, 96]} /><meshStandardMaterial map={wound} roughness={0.48} metalness={0.18} /></mesh>
      <mesh position-y={0.046} rotation-x={-Math.PI / 2}><torusGeometry args={[0.048, 0.0025, 8, 64]} /><meshStandardMaterial color="#777971" metalness={0.65} roughness={0.38} /></mesh>
      <mesh position-y={0.049} rotation-x={-Math.PI / 2}><torusGeometry args={[0.018, 0.0028, 8, 40]} /><meshStandardMaterial color="#76776c" roughness={0.35} metalness={0.65} /></mesh>
      <mesh position={[0.101,0.0505,-0.067]} rotation={[-Math.PI/2,0,0.56]}><planeGeometry args={[0.058,0.015]} /><meshStandardMaterial map={gauge} roughness={0.85} /></mesh>
    </group>
  )
}

function BrassProp() {
  const body = useMemo(() => {
    const p = [[0,0],[0.97,0],[1,0.13],[0.94,0.21],[0.93,0.35],[1,0.40],[0.98,2.61],[0.94,2.73],[0,2.73]]
    return new LatheGeometry(p.map(([x,y])=>new Vector2(x,y)),40)
  },[])
  const tip = useMemo(() => {
    const p = [[0,2.69],[0.89,2.69],[0.88,2.95],[0.82,3.24],[0.68,3.51],[0.48,3.77],[0.27,3.93],[0.10,4.01],[0,4.03]]
    return new LatheGeometry(p.map(([x,y])=>new Vector2(x,y)),40)
  },[])
  return (
    <group name="Brass film prop" position={[0.29,0.020,0.29]} rotation={[-0.11,-0.30,-Math.PI/2]}>
      <group scale={0.02}>
        <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial color="#b89449" metalness={0.73} roughness={0.36} /></mesh>
        <mesh geometry={tip} castShadow receiveShadow><meshStandardMaterial color="#ae704c" metalness={0.61} roughness={0.37} /></mesh>
      </group>
    </group>
  )
}

export function DeskProps() {
  return (
    <group name="Qianggao film objects">
      <StillFilm />
      <BrassProp />
      <CinemaReel />
    </group>
  )
}
