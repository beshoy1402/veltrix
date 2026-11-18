"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,RotateCcw} from "lucide-react";

const projectTypes=[
 {id:"website",name:"Business website",base:30000},
 {id:"ecommerce",name:"E-commerce",base:55000},
 {id:"application",name:"Web application",base:55000},
 {id:"design",name:"UI/UX design",base:20000},
 {id:"ai",name:"AI & automation",base:45000},
 {id:"custom",name:"Custom platform",base:65000}
];
const features=[{id:"cms",label:"Content management",price:5000},{id:"auth",label:"User accounts & roles",price:9000},{id:"payments",label:"Payments & checkout",price:12000},{id:"dashboard",label:"Custom dashboard",price:12000},{id:"integrations",label:"Third-party integrations",price:7000},{id:"multilingual",label:"English & Arabic",price:5000},{id:"motion",label:"Advanced motion & 3D",price:10000},{id:"seo",label:"SEO foundations",price:4000}];
const money=(value:number)=>new Intl.NumberFormat("en-EG",{style:"currency",currency:"EGP",maximumFractionDigits:0}).format(value);
export default function QuoteEstimator(){
 const [step,setStep]=useState(0);
 const [type,setType]=useState("website");
 const [selected,setSelected]=useState<string[]>(["seo"]);
 const [complexity,setComplexity]=useState("standard");
 const [timeline,setTimeline]=useState("flexible");
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [copied,setCopied]=useState(false);
 const base=projectTypes.find(p=>p.id===type)?.base??30000;
 const multiplier=complexity==="essential"?.9:complexity==="premium"?1.55:1.2;
 const total=useMemo(()=>Math.round((base+features.filter(f=>selected.includes(f.id)).reduce((sum,f)=>sum+f.price,0))*multiplier*(timeline==="rush"?1.2:1)),[base,selected,multiplier,timeline]);
 const low=Math.round(total*.85/1000)*1000,high=Math.round(total*1.2/1000)*1000;
 const summary=[ "Project: "+(projectTypes.find(p=>p.id===type)?.name??type),"Features: "+(features.filter(f=>selected.includes(f.id)).map(f=>f.label).join(", ")||"Core scope only"),"Complexity: "+complexity,"Timeline: "+timeline,"Indicative range: "+money(low)+" – "+money(high)].join("\n");
 const toggle=(id:string)=>setSelected(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 const reset=()=>{setStep(0);setType("website");setSelected(["seo"]);setComplexity("standard");setTimeline("flexible");setName("");setEmail("");};
 const mailto="mailto:hello@veltrix.studio?subject="+encodeURIComponent("VELTRIX project estimate")+"&body="+encodeURIComponent(summary+"\n\nName: "+name+"\nEmail: "+email);
 return <main className="veltrixEstimator"><header><Link href="/" className="stormLogo">VELTRIX<span>®</span></Link><span>PROJECT CONFIGURATOR / 2026</span><Link href="/#contact">BACK TO STUDIO <ArrowUpRight size={14}/></Link></header><section className="estimatorIntro"><span>LET'S GIVE YOUR IDEA A SHAPE</span><h1>A clearer start.<br/><em>A smarter estimate.</em></h1><p>Configure a project in a few steps. Your estimate is indicative, not a final quote — we'll confirm scope and pricing together.</p></section><section className="estimatorPanel"><div className="estimatorProgress"><span>STEP 0{step+1} / 04</span><div>{[0,1,2,3].map(i=><i key={i} className={i<=step?"active":""}/>)}</div><span>{["PROJECT","FEATURES","SCOPE","ESTIMATE"][step]}</span></div>
 {step===0&&<div className="estimatorStep"><span>01 / WHAT ARE WE BUILDING?</span><h2>Choose your project type.</h2><div className="estimatorChoices">{projectTypes.map(p=><button key={p.id} className={type===p.id?"selected":""} onClick={()=>setType(p.id)}><span>{p.name}</span><small>FROM {money(p.base)}</small><ArrowUpRight size={17}/></button>)}</div></div>}
 {step===1&&<div className="estimatorStep"><span>02 / WHAT DOES IT NEED?</span><h2>Select the capabilities.</h2><div className="estimatorFeatures">{features.map(f=><button key={f.id} className={selected.includes(f.id)?"selected":""} onClick={()=>toggle(f.id)}><i>{selected.includes(f.id)&&<Check size={14}/>}</i><span>{f.label}</span><small>+{money(f.price)}</small></button>)}</div></div>}
 {step===2&&<div className="estimatorStep"><span>03 / DEFINE THE SCOPE</span><h2>How ambitious is the build?</h2><div className="estimatorChoices three">{[{id:"essential",name:"Essential",desc:"Focused scope, core features."},{id:"standard",name:"Advanced",desc:"More tailored functionality."},{id:"premium",name:"Premium",desc:"Complex workflows and polish."}].map(p=><button key={p.id} className={complexity===p.id?"selected":""} onClick={()=>setComplexity(p.id)}><span>{p.name}</span><small>{p.desc}</small><ArrowUpRight size={17}/></button>)}</div><h3>Preferred timeline</h3><div className="estimatorTimeline"><button className={timeline==="flexible"?"selected":""} onClick={()=>setTimeline("flexible")}>Flexible timeline</button><button className={timeline==="rush"?"selected":""} onClick={()=>setTimeline("rush")}>Time-sensitive (+20%)</button></div></div>}
 {step===3&&<div className="estimatorStep estimatorResult"><span>04 / YOUR PROJECT SNAPSHOT</span><h2>A starting point<br/>for something good.</h2><div className="estimatePrice"><small>INDICATIVE PROJECT RANGE</small><strong>{money(low)} <i>—</i> {money(high)}</strong><p>EGP · Estimate only · Subject to project discovery</p></div><div className="estimateSummary">{summary.split("\n").map(line=><p key={line}>{line}</p>)}</div><div className="estimateContact"><label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"/></label><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label></div><a className="estimatorSend" href={mailto}>Prepare project enquiry <ArrowUpRight size={17}/></a><button className="estimatorCopy" onClick={()=>{navigator.clipboard?.writeText(summary);setCopied(true);}}>{copied?"Estimate copied":"Copy estimate"} <ArrowUpRight size={14}/></button></div>}
 <div className="estimatorNav">{step>0?<button onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/> BACK</button>:<button onClick={reset}><RotateCcw size={14}/> RESET</button>}{step<3?<button className="next" onClick={()=>setStep(s=>Math.min(3,s+1))}>CONTINUE <ArrowRight size={16}/></button>:<Link href="/#contact">TALK TO THE STUDIO <ArrowUpRight size={16}/></Link>}</div>
 </section><footer><span>© 2026 VELTRIX</span><span>THOUGHTFUL BY DESIGN. PURPOSEFUL BY NATURE.</span><Link href="/">BACK TO HOME</Link></footer></main>;
}
