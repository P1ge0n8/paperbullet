import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useI18n } from './i18n';

export function FestivalMark({ item, navigate }) {
 const { locale } = useI18n();
 const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[touchPreview,setTouchPreview]=useState(false);
 const [visible,setVisible]=useState(false),[ready,setReady]=useState(false),[sampleVersion,setSampleVersion]=useState(0),[reduced,setReduced]=useState(false);
 const card=useRef(null),frame=useRef(null),original=useRef(null),canvas=useRef(null),pattern=useRef(null);
 const showing=visible&&(hovered||focused||touchPreview);
 const source=import.meta.env.BASE_URL+'assets/festival-'+item.logo+'.png';

 useEffect(()=>{
  const touch=matchMedia('(hover: none), (pointer: coarse)');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let startTimer,endTimer,observer;
  const clear=()=>{clearTimeout(startTimer);clearTimeout(endTimer);};
  const configure=()=>{
   clear();observer?.disconnect();setTouchPreview(false);setReduced(motion.matches);
   let wasVisible=false;
   observer=new IntersectionObserver(([entry])=>{
    const inView=entry.isIntersecting&&entry.intersectionRatio>=.55;
    setVisible(inView);
    if(!inView){clear();setTouchPreview(false);}
    if(inView&&!wasVisible&&touch.matches&&!motion.matches){
     const index=[...card.current.parentElement.children].indexOf(card.current);
     startTimer=setTimeout(()=>{setTouchPreview(true);endTimer=setTimeout(()=>setTouchPreview(false),1800);},180+Math.max(0,index)*160);
    }
    wasVisible=inView;
   },{root:card.current.closest('.studio-landing__screen'),threshold:[0,.55]});
   observer.observe(card.current);
  };
  configure();touch.addEventListener('change',configure);motion.addEventListener('change',configure);
  return()=>{clear();observer?.disconnect();touch.removeEventListener('change',configure);motion.removeEventListener('change',configure);};
 },[]);

 useEffect(()=>{
  const image=original.current;
  const sample=()=>{
   if(!image.complete||!image.naturalWidth)return;
   const bounds=frame.current.getBoundingClientRect();
   if(!bounds.width||!bounds.height)return;
   const columns=100,rows=Math.max(1,Math.round(columns*bounds.height/bounds.width));
   const buffer=document.createElement('canvas');buffer.width=columns;buffer.height=rows;
   const context=buffer.getContext('2d',{willReadFrequently:true});
   const scale=Math.min(columns/image.naturalWidth,rows/image.naturalHeight);
   const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
   context.drawImage(image,(columns-width)/2,(rows-height)/2,width,height);
   const pixels=context.getImageData(0,0,columns,rows).data,dots=[];
   for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const i=(y*columns+x)*4,alpha=pixels[i+3]/255;
    const ink=item.logo==='venice'?alpha:alpha*(1-(pixels[i]+pixels[i+1]+pixels[i+2])/765);
    if(ink>=.12)dots.push([x,y,ink]);
   }
   const dpr=Math.min(devicePixelRatio||1,2);
   canvas.current.width=Math.round(bounds.width*dpr);canvas.current.height=Math.round(bounds.height*dpr);
   pattern.current={dots,columns,rows};setSampleVersion(version=>version+1);
  };
  image.addEventListener('load',sample);const observer=new ResizeObserver(sample);observer.observe(frame.current);sample();
  return()=>{image.removeEventListener('load',sample);observer.disconnect();pattern.current=null;};
 },[source,item.logo]);

 useEffect(()=>{
  if(!showing||!pattern.current){setReady(false);return;}
  const output=canvas.current.getContext('2d'),{dots,columns,rows}=pattern.current;
  const stepX=canvas.current.width/columns,stepY=canvas.current.height/rows;
  const start=performance.now();let lastFrame=-1;
  const draw=()=>{
   const elapsed=(performance.now()-start)/1000;
   const frameNumber=Math.floor(elapsed*24);
   if(frameNumber===lastFrame)return;lastFrame=frameNumber;
   const moving=!reduced&&elapsed<1.25;
   const shift=moving&&elapsed<.3?Math.sin(elapsed*28)*stepX*.5:0;
   output.clearRect(0,0,canvas.current.width,canvas.current.height);
   for(const [x,y,ink] of dots){
    const bright=moving&&Math.abs(y/rows-elapsed/1.25)<.045;
    output.fillStyle=bright?'#ff6670':'#e50020';output.globalAlpha=ink;
    output.fillRect(x*stepX+(y%13<3?shift:0),y*stepY,stepX*.83,stepY*.83);
   }
   output.globalAlpha=1;
   if(!moving||document.hidden)gsap.ticker.remove(draw);
  };
  const stopWhenHidden=()=>{if(document.hidden)gsap.ticker.remove(draw);};
  draw();setReady(true);
  if(!reduced&&!document.hidden)gsap.ticker.add(draw);
  document.addEventListener('visibilitychange',stopWhenHidden);
  return()=>{gsap.ticker.remove(draw);document.removeEventListener('visibilitychange',stopWhenHidden);};
 },[showing,reduced,sampleVersion]);

 return <a ref={card} aria-label={item.name} className={'festival-logo-card'+(showing&&ready?' signal-active':'')} href={'#/festivals/'+item.id} onClick={e=>navigate(e,'/festivals/'+item.id)} onPointerEnter={e=>{if(e.pointerType==='mouse')setHovered(true);}} onPointerLeave={()=>setHovered(false)} onFocus={e=>setFocused(e.currentTarget.matches(':focus-visible'))} onBlur={()=>setFocused(false)}>
  <span className="festival-logo-stage"><span className="festival-logo-frame" ref={frame}><img ref={original} className={'festival-logo festival-logo-'+item.logo} src={source} alt=""/><canvas className="festival-signal" ref={canvas} aria-hidden="true"/></span></span>{locale!=='en'&&<h2>{item.name}</h2>}
 </a>;
}
