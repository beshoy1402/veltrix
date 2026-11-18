"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowDown,ArrowUpRight,Globe2,Check} from "lucide-react";

type Service={slug:string;name:string;number:string;tagline:string;intro:string;outcomes:string[];process:string[];starting:string;related:string};
export default function EditorialServicePage({service}:{service:Service}){
 const [ar,setAr]=useState(false);
 return <main className="veltrixEditorial" dir={ar?"rtl":"ltr"}>
  <header className="veltrixEditorialHeader"><Link href="/" className="stormLogo">VELTRIX<span>®</span></Link><div><span>CAPABILITIES / {service.number}</span><button onClick={()=>setAr(v=>!v)}><Globe2 size={15}/>{ar?"EN":"AR"}</button><Link href="/#services">{ar?"كل الخدمات":"ALL SERVICES"} <ArrowUpRight size={14}/></Link></div></header>
  <section className="veltrixServiceHero"><span>VELTRIX / CAPABILITIES — {service.number}</span><h1>{service.name}<i>.</i></h1><p>{ar?"حلول رقمية مصممة حول أهداف عملك، تجمع بين التفكير الواضح والتنفيذ المتقن.":service.tagline}</p><a href="#service-details"><ArrowDown size={15}/>{ar?"اكتشف الخدمة":"EXPLORE THE SERVICE"}</a><div className="veltrixServiceOrb"><span>V</span></div></section>
  <section className="veltrixServiceIntro" id="service-details"><span>01 / OVERVIEW</span><h2>{ar?"نبدأ بالهدف. ونبني ما يخدمه.":"Built around<br/>what matters."}</h2><p>{service.intro}</p></section>
  <section className="veltrixServiceOutcomes"><span>02 / WHAT WE DELIVER</span><h2>Thoughtful at<br/><em>every layer.</em></h2><div>{service.outcomes.map((item,i)=><p key={item}><Check size={16}/><b>0{i+1}</b>{item}</p>)}</div></section>
  <section className="veltrixServiceProcess"><span>03 / HOW WE WORK</span><h2>From first thought<br/>to <em>finished work.</em></h2><div>{service.process.map((item,i)=><article key={item}><b>0{i+1}</b><h3>{item}</h3><span>VELTRIX / PROCESS</span></article>)}</div></section>
  <section className="veltrixServiceCta"><span>04 / LET&apos;S BUILD</span><h2>Have something<br/><em>in mind?</em></h2><p>{service.starting} <small>Indicative starting price. Final scope is confirmed in a project proposal.</small></p><Link href={"/quote-estimator?service="+service.slug}>CONFIGURE YOUR PROJECT <ArrowUpRight size={16}/></Link></section>
  <footer className="veltrixEditorialFooter"><Link href="/">VELTRIX®</Link><span>CAIRO / EVERYWHERE</span><Link href="/#contact">START A PROJECT <ArrowUpRight size={14}/></Link></footer>
 </main>;
}
