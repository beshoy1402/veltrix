"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUpRight,Globe2} from "lucide-react";

type Project={slug:string;name:string;category:string;year:string;intro:string;challenge:string;approach:string;experience:string;deliverables:string[];image:string;accent:string;next:string};
export default function EditorialProjectPage({project,all}:{project:Project;all:Project[]}){
 const [ar,setAr]=useState(false);
 const next=all.find(item=>item.slug===project.next)??all[0];
 return <main className="veltrixEditorial" dir={ar?"rtl":"ltr"}>
  <header className="veltrixEditorialHeader"><Link href="/" className="stormLogo">VELTRIX<span>®</span></Link><div><span>SELECTED WORK / {project.year}</span><button onClick={()=>setAr(v=>!v)}><Globe2 size={15}/>{ar?"EN":"AR"}</button><Link href="/#work">{ar?"كل الأعمال":"ALL WORK"} <ArrowUpRight size={14}/></Link></div></header>
  <section className="veltrixCaseHero" style={{"--case-accent":project.accent} as React.CSSProperties}>
   <div className="veltrixCaseHeroCopy"><span>VELTRIX / CASE STUDY — 0{all.findIndex(p=>p.slug===project.slug)+1}</span><h1>{project.name}<i>.</i></h1><p>{ar?"تجربة رقمية مفاهيمية تستكشف كيف يمكن للاستراتيجية والتصميم والتكنولوجيا أن تعمل معاً.":project.intro}</p><div><b>{project.category}</b><b>CONCEPT PROJECT</b><b>{project.year}</b></div></div>
   <div className="veltrixCaseVisual"><img src={project.image} alt={project.name+" visual concept"}/><span>ART DIRECTION / 001</span></div>
   <a className="veltrixScrollCue" href="#case-details"><ArrowDown size={15}/>{ar?"اكتشف القصة":"SCROLL TO EXPLORE"}</a>
  </section>
  <section className="veltrixCaseIntro" id="case-details"><span>01 / THE BRIEF</span><h2>{ar?"الفكرة تصنع التجربة.":"A point of view<br/>becomes an experience."}</h2><p>{ar?"هذا المشروع نموذج مفاهيمي لعلامة افتراضية، صُمم لاستكشاف تجربة العلامة التجارية الرقمية من البداية إلى النهاية.":project.challenge}</p></section>
  <section className="veltrixCaseSplit"><div><span>02 / THE APPROACH</span><h2>{ar?"اتجاه واضح. تنفيذ مدروس.":"Designed with<br/><em>intention.</em>"}</h2></div><p>{project.approach}</p></section>
  <section className="veltrixCaseFeature"><img src={project.image} alt={project.name+" art direction detail"}/><div><span>03 / THE EXPERIENCE</span><h2>{ar?"تجربة متكاملة، من أول نظرة.":"Every detail<br/>has a role."}</h2><p>{project.experience}</p></div></section>
  <section className="veltrixDeliverables"><span>04 / WHAT'S INCLUDED</span><h2>Made to work.<br/><em>Made to matter.</em></h2><div>{project.deliverables.map((item,i)=><p key={item}><b>0{i+1}</b>{item}<ArrowUpRight size={15}/></p>)}</div></section>
  <section className="veltrixNextProject"><span>KEEP EXPLORING / NEXT PROJECT</span><Link href={"/work/"+next.slug}><small>{next.category}</small><b>{next.name}<ArrowUpRight size={30}/></b></Link></section>
  <footer className="veltrixEditorialFooter"><Link href="/">VELTRIX®</Link><span>CAIRO / EVERYWHERE</span><Link href="/#contact">START A PROJECT <ArrowUpRight size={14}/></Link></footer>
 </main>;
}
