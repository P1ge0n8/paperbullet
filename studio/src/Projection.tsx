import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, MathUtils, Mesh, PerspectiveCamera, ShaderMaterial, SRGBColorSpace, Vector2, Vector3 } from 'three'
import { BEAM, BEAM_VERT, DUST, DUST_VERT, VERT, WALL } from './shaders'
import { LENS, SCREEN, TRANSITION_DURATION, type Controls } from './set'
import { studioAsset } from './assets'
import { quad } from './projectedPage'
import { studioLabels, useStudioLocale } from './locale'

const smooth = (x: number) => MathUtils.smootherstep(MathUtils.clamp(x, 0, 1), 0, 1)
const wallUVs = [[-0.5,-0.5],[0.5,-0.5],[0.5,0.5],[-0.5,0.5]] as const

function useTitle() {
  const locale = useStudioLocale()
  const portrait = useThree(({ size }) => size.width / size.height < 0.87)
  const seal = useTexture(studioAsset('../assets/logo.jpg'))
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1536
    canvas.height = 864
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fcf3da'
    ctx.fillRect(0, 0, 1536, 864)
    ctx.save()
    ctx.beginPath()
    ctx.arc(768, 262, 88, 0, 2 * Math.PI)
    ctx.clip()
    ctx.drawImage(seal.image as HTMLImageElement, 20, 20, 559, 559, 680, 174, 176, 176)
    ctx.restore()
    ctx.textAlign = 'center'
    ctx.fillStyle = '#1b1815'
    ctx.font = '900 157px "Arial Narrow", "Helvetica Neue", Arial, sans-serif'
    ctx.letterSpacing = '-8px'
    ctx.fillText('PAPERBULLET', 764, 545, 1290)
    ctx.font = `600 ${locale === 'en' ? 56 : portrait ? 94 : 72}px "Songti SC", "STSong", serif`
    ctx.letterSpacing = locale === 'en' ? '1px' : '3px'
    studioLabels[locale].slogan.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, locale === 'en' ? 653 + index * 76 : 690, 1320)
    })
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [seal, portrait, locale])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function beamAndDust() {
  const positions = [], uvs = [], corners = []
  for (let i=0;i<4;i++) {
    positions.push(...LENS.toArray(), ...SCREEN.toArray(), ...SCREEN.toArray())
    uvs.push(.5,0,0,1,1,1)
    corners.push(0,0,...wallUVs[i],...wallUVs[(i+1)%4])
  }
  const cone = new BufferGeometry()
  cone.setAttribute('position',new Float32BufferAttribute(positions,3))
  cone.setAttribute('uv',new Float32BufferAttribute(uvs,2))
  cone.setAttribute('frameXY',new Float32BufferAttribute(corners,2))
  const points = [], along = [], seeds=[], offsets=[]
  let seed = 17
  const random = () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296 }
  const p=new Vector3()
  for(let i=0;i<240;i++){
    const t=.04 + .92*Math.pow(random(),.72)
    points.push(...p.copy(LENS).lerp(SCREEN,t).toArray())
    along.push(t); seeds.push(random()*100); offsets.push((random()-.5)*t,(random()-.5)*t)
  }
  const dust = new BufferGeometry()
  dust.setAttribute('position',new Float32BufferAttribute(points,3))
  dust.setAttribute('aAlong',new Float32BufferAttribute(along,1))
  dust.setAttribute('aSeed',new Float32BufferAttribute(seeds,1))
  dust.setAttribute('frameXY',new Float32BufferAttribute(offsets,2))
  return { cone, dust }
}
const beamVert = 'uniform vec2 uFrame;attribute vec2 frameXY;\n'+BEAM_VERT.replace('vPos = position;', 'vPos = position + vec3(frameXY*uFrame,0.);').replace('vec4(position, 1.0)', 'vec4(vPos, 1.0)')
const dustVert = 'uniform vec2 uFrame;attribute vec2 frameXY;\n'+DUST_VERT.replace('vec3 p = position;', 'vec3 p = position + vec3(frameXY*uFrame,0.);')

export function Projection({control}:{control:Controls}) {
  const { camera, size } = useThree()
  const tex = useTitle()
  const screen = useRef<Mesh>(null)
  const wall = useRef<ShaderMaterial>(null)
  const beam = useRef<ShaderMaterial>(null)
  const dust = useRef<ShaderMaterial>(null)
  const {cone,dust:particles} = useMemo(beamAndDust,[])
  const scratch = useMemo(()=>({pos:new Vector3(), target:new Vector3(), front:new Vector3(), corners:Array.from({length:4},()=>new Vector3())}),[])
  const uniforms = useMemo(()=>({
    wall:{uSlide:{value:tex},uOn:{value:1},uShutter:{value:1},uTime:{value:0},uOpen:{value:new Vector2(1,1)},uBoost:{value:1}},
    beam:{uOn:{value:1},uTime:{value:0},uFrame:{value:new Vector2()}},
    dust:{uOn:{value:1},uTime:{value:0},uFrame:{value:new Vector2()}},
  }),[tex])
  useEffect(()=>()=>{cone.dispose();particles.dispose()},[cone,particles])
  useFrame(({clock})=>{
    const cam=camera as PerspectiveCamera, aspect=size.width/size.height, phone=aspect<0.87
    const still=control.reducedMotion, now=performance.now()
    if(control.direction){
      const step=Math.min(.1,Math.max(0,(now-control.lastTick)/1000))
      control.time=still ? (control.direction>0?TRANSITION_DURATION:0) : MathUtils.clamp(control.time+control.direction*step,0,TRANSITION_DURATION)
    }
    control.lastTick=now
    const time=control.time
    const fraction=smooth((time-.05)/1.85)
    const {pos,target,front,corners}=scratch
    if(phone) {
      const distance=Math.max(1,0.462/aspect)
      pos.set(1.10*distance,1.92,3.05*distance)
      target.set(-.10,.36,-.30)
    } else {
      const distance=Math.max(1,1.5/aspect)
      pos.set(1.27*distance, .91, 1.99*distance)
      target.set(-.008,.41,-.48)
    }
    const homeW=phone?1.30:2.18, homeH=homeW/1.78
    const hFinal=Math.min(1.25,2.70/aspect), wFinal=hFinal*aspect
    const width=MathUtils.lerp(homeW,wFinal,fraction), height=MathUtils.lerp(homeH,hFinal,fraction)
    const finalFov=30, finalDistance=hFinal/(2*Math.tan(MathUtils.degToRad(finalFov/2)))
    cam.fov=MathUtils.lerp(phone?55:40,finalFov,fraction)
    front.copy(SCREEN); front.z+=finalDistance
    cam.position.copy(pos.lerp(front,fraction))
    cam.lookAt(target.lerp(SCREEN,fraction));cam.updateProjectionMatrix();cam.updateMatrixWorld()
    if(screen.current) screen.current.scale.set(width*1.25,height*1.25,1)
    const t=still?0:clock.elapsedTime
    const shutter=!still ? .04+.96*(time<.14?1-smooth(time/.14):smooth((time-.14)/.36)) : 1
    const page=control.screenElement
    const revealPage=time>=.14
    const open=!still ? (time<.14?1:smooth((time-.14)/.3)) : 1
    if(wall.current){
      const u=wall.current.uniforms
      u.uTime.value=t;u.uShutter.value=shutter;u.uOpen.value.set(1,Math.max(.015,open))
      u.uBoost.value=1+.22*Math.max(0,1-Math.abs(time-.42)/.17)
    }
    for(const material of [beam.current,dust.current]){
      if(material){material.uniforms.uFrame.value.set(width,height);material.uniforms.uTime.value=t;material.uniforms.uOn.value=shutter*(1-.95*fraction)}
    }
    if(page && revealPage){
      const xy = [[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]]
      const coords=corners.map((v,i)=>{
        v.set(SCREEN.x+xy[i][0]*width,SCREEN.y+xy[i][1]*height,SCREEN.z).project(cam)
        return [(1+v.x)*size.width/2,(1-v.y)*size.height/2] as const
      })
      page.style.transform=quad(size.width,size.height,coords[0],coords[1],coords[2],coords[3])
      page.style.visibility='visible'
      page.style.opacity=String(smooth((time-.14)/.38))
      page.style.clipPath=open<1?`inset(${(1-open)*50}% 0)`:'none'
    }else if(page){
      page.style.visibility='hidden'
      page.style.opacity='0'
      page.style.clipPath='none'
    }
    if(!control.ready){control.ready=true;control.onReady()}
    if((control.direction<0 && time===0) || (control.direction>0 && time===TRANSITION_DURATION)){
      const direction=control.direction
      control.direction=0
      if(direction>0)control.onEnter()
      else control.onExit()
    }
  })
  return <>
    <mesh ref={screen} position={SCREEN} name="ProjectedTitle">
      <planeGeometry/><shaderMaterial ref={wall} uniforms={uniforms.wall} vertexShader={VERT} fragmentShader={WALL} transparent depthWrite={false} blending={AdditiveBlending}/>
    </mesh>
    <mesh geometry={cone} frustumCulled={false}>
      <shaderMaterial ref={beam} uniforms={uniforms.beam} vertexShader={beamVert} fragmentShader={BEAM} transparent side={DoubleSide} depthWrite={false} blending={AdditiveBlending}/>
    </mesh>
    <points geometry={particles} frustumCulled={false}>
      <shaderMaterial ref={dust} uniforms={uniforms.dust} vertexShader={dustVert} fragmentShader={DUST} transparent depthWrite={false} blending={AdditiveBlending}/>
    </points>
  </>
}
