"use client";

import {useEffect} from "react";

export default function CinematicEnhancements(){
 useEffect(()=>{
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections=Array.from(document.querySelectorAll<HTMLElement>(".stormSection,.veltrixFacts,.stormMarquee"));
  if(!reduced&&"IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("veltrix-in-view");observer.unobserve(entry.target);}
   }),{threshold:.12,rootMargin:"0px 0px -6% 0px"});
   sections.forEach(section=>{section.classList.add("veltrix-reveal");observer.observe(section);});
   return ()=>observer.disconnect();
  }
 },[]);
 useEffect(()=>{
  const hero=document.querySelector<HTMLElement>(".stormHero");
  const scene=document.querySelector<HTMLElement>(".storm3dScene");
  if(!hero||!scene||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const move=(event:PointerEvent)=>{
   if(event.pointerType==="touch")return;
   const rect=hero.getBoundingClientRect();
   const x=(event.clientX-rect.left)/rect.width-.5;
   const y=(event.clientY-rect.top)/rect.height-.5;
   scene.style.setProperty("--pointer-x",String(x));
   scene.style.setProperty("--pointer-y",String(y));
  };
  const reset=()=>{scene.style.setProperty("--pointer-x","0");scene.style.setProperty("--pointer-y","0");};
  hero.addEventListener("pointermove",move,{passive:true});
  hero.addEventListener("pointerleave",reset,{passive:true});
  return ()=>{hero.removeEventListener("pointermove",move);hero.removeEventListener("pointerleave",reset);};
 },[]);
 return <div className="veltrixAtmosphere" aria-hidden="true"><span/><span/><span/></div>;
}
