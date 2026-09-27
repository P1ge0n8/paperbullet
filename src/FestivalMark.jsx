import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export function FestivalMark({ item, navigate }) {
 const [active,setActive]=useState(false),[touchPreview,setTouchPreview]=useState(false),[ready,setReady]=useState(false);
 const card=useRef(null),canvas=useRef(null);
 const showing=active||touchPreview;
 useEffect(()=>{
  const touch=matchMedia('(hover: none), (pointer: coarse)');
  let timer,observer;
  const configure=()=>{
   observer?.disconnect();clearTimeout(timer);setTouchPreview(false);
   if(!touch.matches)return;
   let wasVisible=false;
   observer=new IntersectionObserver(([entry])=>{
    const visible=entry.isIntersecting&&entry.intersectionRatio>=.55;
    if(visible&&!wasVisible){setTouchPreview(true);clearTimeout(timer);timer=setTimeout(()=>setTouchPreview(false),2200);}
    if(!visible){clearTimeout(timer);setTouchPreview(false);}
    wasVisible=visible;
   },{threshold:[0,.55]});
   observer.observe(card.current);
  };
  configure();touch.addEventListener('change',configure);
  return()=>{observer?.disconnect();clearTimeout(timer);touch.removeEventListener('change',configure);};
 },[]);
 const source=import.meta.env.BASE_URL+'assets/festival-'+item.logo+'.png';
 useEffect(()=>{
  if(!showing){setReady(false);return;}
  let disposed=false,draw;
  const image=new Image();
  image.onload=()=>{
   if(disposed)return;
   const sample=document.createElement('canvas');
   sample.width=120;sample.height=68;
   const context=sample.getContext('2d');
   const scale=Math.min(116/image.width,64/image.height);
   const width=image.width*scale,height=image.height*scale;
   context.drawImage(image,(120-width)/2,(68-height)/2,width,height);
   const pixels=context.getImageData(0,0,120,68).data;
   const dots=[];
   for(let y=0;y<68;y++)for(let x=0;x<120;x++){
    const i=(y*120+x)*4,alpha=pixels[i+3]/255;
    const ink=item.logo==='venice'?alpha:alpha*(1-(pixels[i]+pixels[i+1]+pixels[i+2])/765);
    if(ink>=.12)dots.push([x,y,ink]);
   }
   const output=canvas.current.getContext('2d');
   let lastFrame=-1;
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const start=performance.now();
   draw=()=>{
    const elapsed=(performance.now()-start)/1000;
    const frame=Math.floor(elapsed*24);
    if(frame===lastFrame)return;lastFrame=frame;
    const scan=(elapsed*.7)%1;
    // One restrained startup displacement; no repeated strobing.
    const shift=!reduced&&elapsed<.45?Math.sin(elapsed*24)*3:0;
    output.clearRect(0,0,480,272);
    for(const [x,y,ink] of dots){
     const bright=!reduced&&Math.abs(y/68-scan)<.045;
     output.fillStyle=bright?'#ff6670':'#e50020';
     output.globalAlpha=ink*(bright?1:.96);
     output.fillRect(x*4+(y%13<3?shift:0),y*4,3.3,3.3);
    }
    output.globalAlpha=1;
   };
   draw();setReady(true);
   if(!reduced)gsap.ticker.add(draw);
  };
  image.src=source;
  return ()=>{disposed=true;if(draw)gsap.ticker.remove(draw);};
 },[showing,item.logo,source]);
 return <a ref={card} className={'festival-logo-card'+(showing&&ready?' signal-active':'')} href={'#/festivals/'+item.id} onClick={e=>navigate(e,'/festivals/'+item.id)} onPointerEnter={e=>{if(e.pointerType==='mouse')setActive(true);}} onPointerLeave={()=>setActive(false)} onFocus={()=>setActive(true)} onBlur={()=>setActive(false)}>
  <span className="festival-logo-stage"><img className={'festival-logo festival-logo-'+item.logo} src={source} alt=""/><canvas className="festival-signal" ref={canvas} width="480" height="272" aria-hidden="true"/></span><h2>{item.name}</h2>
 </a>;
}
