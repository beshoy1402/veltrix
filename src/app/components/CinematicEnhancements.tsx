"use client";

import {useEffect} from "react";

export default function CinematicEnhancements(){
 useEffect(()=>{
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections=Array.from(document.querySelectorAll<HTMLElement>(".stormSection,.veltrixFacts,.stormMarquee"));
  if(!reduced&&"IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("veltrix-in-view");observer.unobserve(entry.target);}
   }),{threshold:.1,rootMargin:"0px 0px -7% 0px"});
   sections.forEach(section=>{section.classList.add("veltrix-reveal");observer.observe(section);});
   return ()=>observer.disconnect();
  }
 },[]);
 useEffect(()=>{
  const hero=document.querySelector<HTMLElement>(".stormHero");
  const scene=document.querySelector<HTMLElement>(".storm3dScene");
  if(!hero||!scene||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let frame=0;
  const move=(event:PointerEvent)=>{
   if(event.pointerType==="touch")return;
   const rect=hero.getBoundingClientRect();
   const x=(event.clientX-rect.left)/rect.width-.5;
   const y=(event.clientY-rect.top)/rect.height-.5;
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    scene.style.setProperty("--pointer-x",String(x));
    scene.style.setProperty("--pointer-y",String(y));
   });
  };
  const reset=()=>{scene.style.setProperty("--pointer-x","0");scene.style.setProperty("--pointer-y","0");};
  hero.addEventListener("pointermove",move,{passive:true});
  hero.addEventListener("pointerleave",reset,{passive:true});
  return ()=>{cancelAnimationFrame(frame);hero.removeEventListener("pointermove",move);hero.removeEventListener("pointerleave",reset);};
 },[]);
 useEffect(()=>{
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced)return;
  const cards=Array.from(document.querySelectorAll<HTMLElement>(".stormProjectVisual"));
  const cleanups=cards.map(card=>{
   let frame=0;
   const move=(event:PointerEvent)=>{
    if(event.pointerType==="touch")return;
    const rect=card.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width-.5;
    const y=(event.clientY-rect.top)/rect.height-.5;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
     card.style.setProperty("--tilt-x",String(-y*5));
     card.style.setProperty("--tilt-y",String(x*6));
     card.style.setProperty("--shine-x",String((x+.5)*100)+"%");
     card.style.setProperty("--shine-y",String((y+.5)*100)+"%");
    });
   };
   const reset=()=>{card.style.setProperty("--tilt-x","0");card.style.setProperty("--tilt-y","0");};
   card.addEventListener("pointermove",move,{passive:true});
   card.addEventListener("pointerleave",reset,{passive:true});
   return ()=>{cancelAnimationFrame(frame);card.removeEventListener("pointermove",move);card.removeEventListener("pointerleave",reset);};
  });
  return ()=>cleanups.forEach(cleanup=>cleanup());
 },[]);
 useEffect(()=>{
  const root=document.documentElement;
  let frame=0;
  const update=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const max=document.documentElement.scrollHeight-window.innerHeight;
    root.style.setProperty("--veltrix-scroll-progress",max>0?String(window.scrollY/max):"0");
   });
  };
  update();
  window.addEventListener("scroll",update,{passive:true});
  window.addEventListener("resize",update,{passive:true});
  return ()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",update);window.removeEventListener("resize",update);};
 },[]);
 return <div className="veltrixAtmosphere" aria-hidden="true"><span/><span/><span/></div>;
}
