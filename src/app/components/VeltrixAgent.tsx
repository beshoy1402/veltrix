"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, X, Send, Sparkles, MessageCircle, ArrowUpRight, LoaderCircle } from "lucide-react";
type Message={role:"user"|"assistant";text:string};
const starters=[{en:"I need a website for my business",ar:"محتاج موقع لنشاطي التجاري"},{en:"How much does a project cost?",ar:"تكلفة المشروع كام؟"},{en:"I want to book a consultation",ar:"عايز أحجز استشارة"}];
export default function VeltrixAgent(){
 const [open,setOpen]=useState(false),[lang,setLang]=useState<"en"|"ar">("en"),[input,setInput]=useState(""),[busy,setBusy]=useState(false),[messages,setMessages]=useState<Message[]>([]);
 const bottom=useRef<HTMLDivElement>(null),ar=lang==="ar";
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:"smooth"});},[messages,busy,open]);
 useEffect(()=>{const saved=sessionStorage.getItem("veltrix-agent-lang");if(saved==="ar"||saved==="en")setLang(saved);},[]);
 async function send(text:string){const value=text.trim();if(!value||busy)return;const next=[...messages,{role:"user" as const,text:value}];setMessages(next);setInput("");setBusy(true);try{const r=await fetch("/api/agent/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-12)})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Assistant unavailable");setMessages([...next,{role:"assistant",text:data.answer}]);}catch(e){setMessages([...next,{role:"assistant",text:e instanceof Error?e.message:"Please try again later."}]);}finally{setBusy(false);}}
 function submit(e:FormEvent){e.preventDefault();void send(input);}
 function switchLang(){const n=ar?"en":"ar";setLang(n);sessionStorage.setItem("veltrix-agent-lang",n);}
 return <div className="vxAgentRoot">{open&&<section className="vxAgentPanel" aria-label={ar?"مساعد VELTRIX":"VELTRIX assistant"} dir={ar?"rtl":"ltr"}>
 <header className="vxAgentHeader"><div className="vxAgentIdentity"><span className="vxAgentAvatar"><Bot size={19}/></span><div><b>VELTRIX <span>AGENT</span></b><small>{ar?"مساعد الاستوديو الرقمي":"Your digital studio assistant"}</small></div></div><div className="vxAgentHeaderActions"><button onClick={switchLang}>{ar?"EN":"عربي"}</button><button onClick={()=>setOpen(false)} aria-label="Close"><X size={18}/></button></div></header>
 <div className="vxAgentMessages">{messages.length===0&&<div className="vxAgentWelcome"><span><Sparkles size={17}/></span><h3>{ar?"أهلاً بك في VELTRIX.":"Welcome to VELTRIX."}</h3><p>{ar?"أقدر أساعدك تختار الخدمة المناسبة، تفهم الأسعار المبدئية، وتبعت طلب مشروع أو استشارة.":"Explore our services, understand starting prices, prepare a project enquiry or request a consultation."}</p><div className="vxAgentStarters">{starters.map((s,i)=><button key={i} onClick={()=>void send(ar?s.ar:s.en)}>{ar?s.ar:s.en}<ArrowUpRight size={13}/></button>)}</div></div>}
 {messages.map((m,i)=><div className={"vxAgentMessage "+m.role} key={i}><p>{m.text}</p></div>)}{busy&&<div className="vxAgentTyping"><LoaderCircle size={15}/>{ar?"بفكر...":"Thinking..."}</div>}<div ref={bottom}/></div>
 <form className="vxAgentComposer" onSubmit={submit}><input value={input} onChange={e=>setInput(e.target.value)} placeholder={ar?"اكتب رسالتك...":"Ask about your project..."} aria-label={ar?"رسالتك":"Your message"} maxLength={1800}/><button disabled={!input.trim()||busy} aria-label="Send"><Send size={17}/></button></form><div className="vxAgentFoot">{ar?"قد تكون بعض الإجابات محدودة حسب توافر الخدمة.":"AI responses depend on free-tier availability."}</div></section>}
 <button className={"vxAgentLauncher "+(open?"isOpen":"")} onClick={()=>setOpen(v=>!v)} aria-label={open?"Close VELTRIX assistant":"Chat with VELTRIX"}>{open?<X size={21}/>:<><MessageCircle size={20}/><span>{ar?"تحدث معنا":"Ask VELTRIX"}</span><i/></>}</button></div>;
}
