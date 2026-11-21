import { Component, Suspense, useState, useSyncExternalStore, type ReactNode } from 'react'
import {createRoot} from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { NeutralToneMapping } from 'three'
import { Studio } from './Studio'
import { TRANSITION_DURATION, type Controls, type Direction } from './set'
import { studioLabels, useStudioLocale } from './locale'
import './studio.css'

type Options={
  onEnter:()=>void
  onExit?:()=>void
  onReady?:()=>void
  onError?:()=>void
  onTransitionStart?:(direction:'enter'|'exit')=>void
  initialView?:'studio'|'screen'
  screenElement?:HTMLElement
}

type Store={
  control:Controls
  subscribe:(listener:()=>void)=>()=>void
  getSnapshot:()=>number
  enter:()=>void
}

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
function StudioRoot({store}:{store:Store}){
  useSyncExternalStore(store.subscribe,store.getSnapshot)
  const locale=useStudioLocale()
  const {control}=store
  const [grain]=useState(stockGrain)
  const inside=control.time>0 || control.direction!==0
  const view=control.direction>0?'entering':control.direction<0?'exiting':control.time===TRANSITION_DURATION?'screen':'studio'
  return <div className={'pb-stage'+(inside?' pb-entering':'')} data-studio-view={view} data-active={control.active} data-studio-locale={locale}>
    <Canvas frameloop={control.active?'always':'never'} shadows="variance" dpr={[1,1.6]} camera={{position:[1.27,.91,1.99],fov:40,near:.025,far:45}} gl={{antialias:false,toneMapping:NeutralToneMapping,alpha:false,powerPreference:'high-performance'}}>
      <Suspense fallback={null}><Studio control={control} trigger={store.enter}/></Suspense>
    </Canvas>
    <div aria-hidden="true" className="pb-grain" style={{backgroundImage:grain}}/>
    {control.ready && <button type="button" className="pb-play" onClick={store.enter} disabled={inside}><span aria-hidden="true" className="pb-play__mark"/>{studioLabels[locale].play}</button>}
  </div>
}
export function mountStudio(element:HTMLElement,options:Options){
  const root=createRoot(element)
  const listeners=new Set<()=>void>()
  const media=matchMedia('(prefers-reduced-motion: reduce)')
  let revision=0,disposed=false,readyFrame=0,pending:Direction=0
  const emit=()=>{if(!disposed){revision++;listeners.forEach(listener=>listener())}}
  const control:Controls={
    time:options.initialView==='screen'?TRANSITION_DURATION:0,
    lastTick:performance.now(),direction:0,active:true,reducedMotion:media.matches,ready:false,
    screenElement:options.screenElement,
    onReady:()=>{
      readyFrame=requestAnimationFrame(()=>{
        if(disposed)return
        emit();options.onReady?.()
        if(pending){const direction=pending;pending=0;request(direction)}
      })
    },
    onEnter:()=>{if(!disposed){emit();options.onEnter()}},
    onExit:()=>{if(!disposed){emit();options.onExit?.()}},
  }
  const setActive=(active:boolean)=>{
    if(disposed || control.active===active)return
    control.active=active;control.lastTick=performance.now();emit()
  }
  const request=(direction:Direction)=>{
    if(disposed)return
    setActive(true)
    if(!control.ready){pending=direction;return}
    if(control.direction===direction)return
    if(!control.direction && control.time===(direction>0?TRANSITION_DURATION:0))return
    control.direction=direction;control.lastTick=performance.now()
    emit();options.onTransitionStart?.(direction>0?'enter':'exit');gateSound()
  }
  const onMotionChange=()=>{control.reducedMotion=media.matches}
  media.addEventListener('change',onMotionChange)
  const store:Store={
    control,
    subscribe:listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}},
    getSnapshot:()=>revision,
    enter:()=>request(1),
  }
  root.render(<StageBoundary onError={options.onError??(()=>{})}><StudioRoot store={store}/></StageBoundary>)
  return {
    enter:store.enter,
    exit:()=>request(-1),
    setActive,
    destroy:()=>{
      if(disposed)return
      disposed=true;cancelAnimationFrame(readyFrame);listeners.clear();media.removeEventListener('change',onMotionChange)
      queueMicrotask(()=>root.unmount())
    },
  }
}
