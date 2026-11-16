import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { BackSide } from 'three'
import { DeskProps } from './Props'
import { FilmProjector } from './FilmProjector'
import { studioAsset } from './assets'
import { Grade } from './Grade'
import { Projection } from './Projection'
import { MACHINE, SCALE, PITCH, WALL_Z, type Controls } from './set'

function Cove(){
  const r=.16, wall=WALL_Z-.014
  return <group>
    <mesh rotation-x={-Math.PI/2} position={[0,0,wall+r+8]} receiveShadow>
      <planeGeometry args={[30,16]}/><meshStandardMaterial color="#bab3a8" roughness={1} envMapIntensity={.25}/>
    </mesh>
    <mesh position={[0,r+5,wall]} receiveShadow>
      <planeGeometry args={[30,10]}/><meshStandardMaterial color="#bab3a8" roughness={1} envMapIntensity={.25}/>
    </mesh>
    <mesh position={[0,r,wall+r]} rotation-z={Math.PI/2} receiveShadow>
      <cylinderGeometry args={[r,r,30,48,1,true,Math.PI,Math.PI/2]}/><meshStandardMaterial color="#bab3a8" roughness={1} envMapIntensity={.25} side={BackSide}/>
    </mesh>
  </group>
}

export function Studio({control,trigger}:{control:Controls;trigger:()=>void}){
  const {size}=useThree()
  const portrait=size.width/size.height<.87
  return <>
    <color attach="background" args={['#bab3a8']}/>
    <fog attach="fog" args={['#bab3a8',9,24]}/>
    <hemisphereLight args={['#fffdf7','#b7a998',.25]}/>
    <directionalLight position={[-3,4.3,1]} intensity={2.6} color="#fff1df" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-2.3} shadow-camera-right={2.3} shadow-camera-bottom={-2} shadow-camera-top={2} shadow-camera-near={.1} shadow-camera-far={11} shadow-bias={-.00035} shadow-radius={8} shadow-blurSamples={16}/>
    <Environment files={studioAsset('studio_small_08.hdr')} resolution={256} environmentIntensity={.43}>
      <Lightformer form="rect" intensity={1.6} position={[-3,2.5,-1]} rotation-y={Math.PI/2} scale={[3,4,1]}/>
      <Lightformer form="rect" intensity={.9} position={[0,4,0]} rotation-x={Math.PI/2} scale={[5,3,1]}/>
      <Lightformer form="rect" intensity={.48} position={[3,1,1]} rotation-y={-Math.PI/2} scale={[2,2.5,1]}/>
    </Environment>
    <Cove/>
    <ContactShadows position={[0,.0005,.04]} scale={[3.25,2.60]} far={1} blur={1.65} opacity={.47} resolution={1024} frames={1} color="#44382e"/>
    <group position={MACHINE} rotation-x={PITCH} onPointerOver={(e)=>{e.stopPropagation();e.nativeEvent.target instanceof HTMLCanvasElement && e.nativeEvent.target.classList.add('pb-object-hover')}} onPointerOut={(e)=>{if(e.nativeEvent.target instanceof HTMLCanvasElement)e.nativeEvent.target.classList.remove('pb-object-hover')}}>
      <FilmProjector scale={SCALE} onClick={e=>{e.stopPropagation();trigger()}}/>
    </group>
    {[-0.02487,0.03311].map(x=>(
      <group key={x} position={[MACHINE.x+x*SCALE,0,MACHINE.z-.0916*SCALE*Math.cos(PITCH)]}>
        <mesh position-y={.004} castShadow receiveShadow>
          <cylinderGeometry args={[.012,.014,.008,24]}/><meshStandardMaterial color="#282622" roughness={.73}/>
        </mesh>
        <mesh position-y={.021} castShadow>
          <cylinderGeometry args={[.0063,.007,.033,24]}/><meshStandardMaterial color="#898277" metalness={.7} roughness={.35}/>
        </mesh>
      </group>
    ))}
    <group position={portrait?[-.15,0,.45]:[0,0,0]}><DeskProps/></group>
    <Projection control={control}/>
    <Grade/>
  </>
}
