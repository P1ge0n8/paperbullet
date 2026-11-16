import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import {createRoot} from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { NeutralToneMapping } from 'three'
import { Studio } from './Studio'
import type { Controls } from './set'
import './studio.css'

type Options={onEnter:()=>void; onReady?:()=>void; onError?:()=>void; screenElement?:HTMLElement}

function gateSound(){
  try{
    const audio=new AudioContext()
    const length=Math.round(.12*audio.sampleRate), pulse=audio.createBuffer(1,length,audio.sampleRate)
    const samples=pulse.getChannelData(0)
    for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)
    const fire=(time:number,frequency:number,volume:number,duration:number)=>{
      const source=audio.createBufferSource(), band=audio.createBiquadFilter(), env=audio.createGain()
      source.buffer=pulse;band.type='bandpass';band.frequency.value=frequency;band.Q.value=1.4
      env.gain.setValueAtTime(volume,time);env.gain.exponentialRampToValueAtTime(.0001,time+duration)
      source.connect(band).connect(env).connect(audio.destination);source.start(time);source.stop(time+duration)
    }
    void audio.resume().then(()=>{
      const t=audio.currentTime
      fire(t,1350,.26,.075);fire(t+.024,3600,.16,.037);fire(t+.14,1650,.18,.09)
    }).catch(()=>{})
    window.setTimeout(()=>{void audio.close().catch(()=>{})},680)
  }catch{/* The camera transition also works silently. */}
}

function stockGrain(){
  const tile=document.createElement('canvas');tile.width=tile.height=128
  const ctx=tile.getContext('2d')!,frame=ctx.createImageData(128,128)
  let seed=17
  for(let i=0;i<frame.data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0
    const g=seed>>>24
    frame.data.set([g,g,g,255],i)
  }
  ctx.putImageData(frame,0,0)
  return `url(${tile.toDataURL()})`
}

class StageBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  componentDidCatch(){this.props.onError()}
  render(){return this.state.failed?null:this.props.children}
}
function Fallback({onError}:{onError:()=>void}){
  useEffect(onError,[onError])
  return null
}

function StudioRoot({options}:{options:Options}){
  const [entering,setEntering]=useState(false)
  const [grain]=useState(stockGrain)
  const [ready,setReady]=useState(false)
  const control=useRef<Controls>({
    start:0,finished:false,ready:false,screenElement:options.screenElement,
    onReady:()=>{requestAnimationFrame(()=>{setReady(true);options.onReady?.()})},onEnter:options.onEnter,
  })
  const trigger=()=>{
    if(!control.current.ready || control.current.start)return
    control.current.start=performance.now()
    setEntering(true);gateSound()
  }
  return <div className={'pb-stage'+(entering?' pb-entering':'')}>
    <Canvas shadows="variance" dpr={[1,1.6]} camera={{position:[1.27,.91,1.99],fov:40,near:.025,far:45}} gl={{antialias:false,toneMapping:NeutralToneMapping,alpha:false,powerPreference:'high-performance'}} fallback={<Fallback onError={options.onError??(()=>{})}/>}>
      <Suspense fallback={null}><Studio control={control.current} trigger={trigger}/></Suspense>
    </Canvas>
    <div aria-hidden="true" className="pb-grain" style={{backgroundImage:grain}}/>
    {ready && <button type="button" className="pb-play" onClick={trigger} disabled={entering}><span aria-hidden="true" className="pb-play__mark"/>开始放映</button>}
  </div>
}
export function mountStudio(element:HTMLElement,options:Options){
  const root=createRoot(element)
  root.render(<StageBoundary onError={options.onError??(()=>{})}><StudioRoot options={options}/></StageBoundary>)
  return {destroy:()=>{queueMicrotask(()=>root.unmount())}}
}
