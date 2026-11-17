"use client";
/* eslint-disable react/no-unescaped-entities */
import {useState, useEffect, type FormEvent} from "react";
import {ArrowDownRight,ArrowUpRight,ArrowRight,Globe2,Menu,X,Play,Check,Asterisk} from "lucide-react";

const services=[
 {n:"01",name:"Websites & digital experiences",desc:"Distinctive, high-performing websites that turn attention into action.",price:"30,000",tag:"WEBSITES · BRAND · EXPERIENCE"},
 {n:"02",name:"E-commerce & digital commerce",desc:"Thoughtful online stores and commerce experiences made to scale.",price:"55,000",tag:"STOREFRONTS · MARKETPLACES"},
 {n:"03",name:"Web applications & platforms",desc:"Purpose-built portals, dashboards and platforms for real workflows.",price:"55,000",tag:"PORTALS · SAAS · SYSTEMS"},
 {n:"04",name:"UI/UX & product design",desc:"Clear, considered interfaces that make complex products feel simple.",price:"20,000",tag:"RESEARCH · UX · DESIGN SYSTEMS"},
 {n:"05",name:"AI & intelligent automation",desc:"Useful AI experiences and automation that make work flow better.",price:"45,000",tag:"AI · AUTOMATION · INTEGRATION"},
 {n:"06",name:"Digital growth & care",desc:"Ongoing optimization, visibility and support after launch.",price:"20,000",tag:"SEO · PERFORMANCE · SUPPORT"}
];
const projects=[
 {name:"NOURA Beauty",type:"Skincare storefront · Local brand concept",category:"Commerce",theme:"sand",slug:"noura-beauty",desc:"A warm, editorial skincare shop with product discovery, collections and a working demo cart."},
 {name:"THREAD HOUSE",type:"Fashion storefront · Local brand concept",category:"Commerce",theme:"blue",slug:"thread-house",desc:"A modern fashion storefront with category browsing, product details and cart interactions."},
 {name:"KAHWA LAB",type:"Coffee storefront · Local brand concept",category:"Commerce",theme:"violet",slug:"kahwa-lab",desc:"A specialty coffee shop concept with blends, brewing gear and bundle shopping."}
];
export default function Home(){
 const [lang,setLang]=useState<"en"|"ar">("en");
 const [menu,setMenu]=useState(false);
 const [filter,setFilter]=useState("All");
 const [preview,setPreview]=useState<(typeof projects)[number]|null>(null);
 const [quote,setQuote]=useState(false);
 const [bookingOpen,setBookingOpen]=useState(false);
 const [bookingSending,setBookingSending]=useState(false);
 const [bookingSent,setBookingSent]=useState(false);
 const [bookingError,setBookingError]=useState("");
 const [booking,setBooking]=useState({name:"",email:"",phone:"",service:"Discovery consultation",date:"",time:"",notes:""});
 const [newsletterEmail,setNewsletterEmail]=useState("");
 const [newsletterState,setNewsletterState]=useState("");
 const [categoryPrices,setCategoryPrices]=useState<Record<string,number>>({});
 const [sending,setSending]=useState(false);
 const [sent,setSent]=useState(false);
 const [formError,setFormError]=useState("");
 const [form,setForm]=useState({name:"",email:"",phone:"",company:"",service:"Business website",budget:"EGP 20,000–40,000",message:""});
 async function submitBooking(event:FormEvent<HTMLFormElement>){event.preventDefault();setBookingSending(true);setBookingError("");try{const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/booking_requests`,{method:"POST",headers:{"Content-Type":"application/json","apikey":process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"","Prefer":"return=minimal"},body:JSON.stringify({name:booking.name,email:booking.email,phone:booking.phone,service_interest:booking.service,preferred_date:booking.date||null,preferred_time:booking.time,notes:booking.notes})});if(!response.ok)throw new Error(await response.text()||"Could not send booking request.");setBookingSent(true);}catch(e){setBookingError(e instanceof Error?e.message:"Booking request failed.");}finally{setBookingSending(false);}}
 async function subscribe(event:FormEvent<HTMLFormElement>){event.preventDefault();setNewsletterState("Sending...");try{const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/newsletter_subscribers`,{method:"POST",headers:{"Content-Type":"application/json","apikey":process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"","Prefer":"return=minimal"},body:JSON.stringify({email:newsletterEmail})});if(!response.ok)throw new Error(await response.text()||"Subscription failed.");setNewsletterState("You are subscribed.");setNewsletterEmail("");}catch(e){setNewsletterState(e instanceof Error&&e.message.includes("duplicate")?"This email is already subscribed.":"Could not subscribe right now. Please try again.");}}
 async function submitInquiry(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  setSending(true);setFormError("");
  try{
   const response=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/inquiries`,{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"","Prefer":"return=minimal"},
    body:JSON.stringify({name:form.name,email:form.email,phone:form.phone,company:form.company,service_interest:form.service,budget:form.budget,message:form.message})
   });
   if(!response.ok){const detail=await response.text();throw new Error(detail||"Unable to submit your enquiry.");}
   setSent(true);
  }catch(error){setFormError(error instanceof Error?error.message:"Something went wrong. Please try again.");}
  finally{setSending(false);}
 }
 const ar=lang==="ar";
 const priceCategories:Record<string,string[]>={"01":["Business Websites"],"02":["E-commerce"],"03":["Business Systems","SaaS & APIs","Media & Portals","Education","Booking Platforms","Real Estate"],"05":["AI & Automation"]};
 const getStartingPrice=(service:(typeof services)[number])=>{const live=(priceCategories[service.n]??[]).map(category=>categoryPrices[category]).filter(value=>Number.isFinite(value));return live.length?Math.min(...live):Number(service.price.replace(/,/g,""));};
 useEffect(()=>{fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/services?select=category,price_egp&is_published=eq.true`,{headers:{"apikey":process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??""}}).then(r=>r.ok?r.json():[]).then((rows:Array<{category:string;price_egp:number|string}>)=>{const grouped:Record<string,number[]>={};rows.forEach(x=>{(grouped[x.category]??=[]).push(Number(x.price_egp));});const mins:Record<string,number>={};Object.entries(grouped).forEach(([k,v])=>{if(v.length)mins[k]=Math.min(...v);});setCategoryPrices(mins);}).catch(()=>{});},[]);
 useEffect(()=>{try{let sid=sessionStorage.getItem("veltrix-session");if(!sid){sid=crypto.randomUUID();sessionStorage.setItem("veltrix-session",sid);}fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_events`,{method:"POST",headers:{"Content-Type":"application/json","apikey":process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"","Prefer":"return=minimal"},body:JSON.stringify({event_type:"page_view",path:window.location.pathname,session_id:sid})}).catch(()=>{});}catch{}} ,[]);
 const copy=ar?{
  nav:["خدماتنا","أعمالنا","من نحن","مقالات"],cta:"ابدأ مشروعك",eyebrow:"استوديو مستقل للابتكار الرقمي",
  intro:"نحوّل الأفكار الطموحة إلى تجارب رقمية مؤثرة، من خلال الجمع بين الاستراتيجية والتصميم والتكنولوجيا لدفع الأعمال إلى الأمام.",
  work:"أعمال مختارة.",workText:"لمحة عن التجارب الرقمية التي نصممها. إبداع هادف وتجربة مدروسة.",
  services:"ماذا نقدم",serviceTitle:"نصمم ما يدفعك للخطوة التالية.",studio:"استوديو صغير. رؤية كبيرة.",
  studioTitle:"العمل المميز يبدأ بفكرة مميزة.",studioText:"نؤمن أن أفضل الحلول الرقمية تأتي عندما تلتقي رؤية الأعمال بالتصميم المدروس والهندسة المتقنة. لا قوالب لطموحك، ولا تقنية بلا هدف. فقط عمل يصنع فرقاً حقيقياً.",
  process:"كيف نعمل",contact:"هل لديك فكرة تستحق التنفيذ؟",contactTitle:"لنصنع شيئاً مؤثراً.",contactText:"أخبرنا بما تفكر فيه، وسنساعدك في تحديد الخطوة التالية."
 }:{
  nav:["Services","Work","Studio","Insights"],cta:"Start a project",eyebrow:"INDEPENDENT DIGITAL INNOVATION STUDIO",
  intro:"We turn ambitious ideas into meaningful digital experiences — combining strategy, design and technology to move businesses forward.",
  work:"Selected work.",workText:"A glimpse into the experiences we shape. Thoughtful by design, purposeful by nature.",
  services:"WHAT WE DO",serviceTitle:"Built around your next big move.",studio:"A SMALL STUDIO. A BIG PICTURE.",
  studioTitle:"Good work starts with good thinking.",studioText:"We believe the best digital work happens when business understanding, thoughtful design and solid engineering meet. No templates for your ambition. No technology for technology’s sake. Just considered work that makes a difference.",
  process:"HOW WE MAKE IT HAPPEN",contact:"HAVE A GOOD ONE IN MIND?",contactTitle:"Let's make something matter.",contactText:"Tell us what you're imagining. We'll help you figure out what comes next."
 };
 const shown=filter==="All"?projects:projects.filter(p=>p.category===filter);
 return <main className={ar?"site stormSite arabic":"site stormSite"} dir={ar?"rtl":"ltr"}>
  <div className="stormAnnouncement"><span className="stormLiveDot"/> DIGITAL STUDIO <span className="stormAnnouncementLine"/> CAIRO, EGYPT <span className="stormAnnouncementRight">INDEPENDENT BY DESIGN · BUILT FOR WHAT'S NEXT</span></div>
  <header className="stormHeader">
   <a className="stormLogo" href="#">VELTRIX<span>®</span></a>
   <nav className="stormNav"><a href="#work">{ar?"الأعمال":"Selected work"}</a><a href="#services">{ar?"الخدمات":"Capabilities"}</a><a href="#studio">{ar?"الاستوديو":"The studio"}</a><a href="#insights">{ar?"الأفكار":"Perspectives"}</a></nav>
   <div className="stormHeaderActions"><button className="stormLang" onClick={()=>setLang(ar?"en":"ar")}><Globe2 size={15}/>{ar?"EN":"AR"}</button><button className="stormHeaderCta" onClick={()=>setQuote(true)}>{ar?"ابدأ مشروعك":"Start a project"}<ArrowUpRight size={16}/></button><button className="stormMenu" onClick={()=>setMenu(!menu)} aria-label="Toggle menu">{menu?<X/>:<Menu/>}</button></div>
  </header>
  {menu&&<div className="stormMobileMenu"><a href="#work" onClick={()=>setMenu(false)}>{ar?"الأعمال":"Selected work"}</a><a href="#services" onClick={()=>setMenu(false)}>{ar?"الخدمات":"Capabilities"}</a><a href="#studio" onClick={()=>setMenu(false)}>{ar?"الاستوديو":"The studio"}</a><a href="#insights" onClick={()=>setMenu(false)}>{ar?"الأفكار":"Perspectives"}</a><button onClick={()=>{setMenu(false);setQuote(true)}}>{ar?"ابدأ مشروعك":"Start a project"}<ArrowUpRight size={16}/></button></div>}
  <section className="stormHero">
   <div className="stormHeroImage" aria-hidden="true"><img src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2000&q=90" alt=""/></div>
   <div className="stormHeroNoise"/>
   <div className="stormHeroCopy">
    <div className="stormEyebrow"><span/> {ar?"استوديو رقمي مستقل":"INDEPENDENT DIGITAL STUDIO"} <b>— 01 / 04</b></div>
    <h1>{ar?<>نصنع ما<br/>يدفعك <em>للأمام.</em></>:<>We make<br/>digital <em>move.</em></>}</h1>
    <p>{ar?"نحوّل الأفكار الطموحة إلى تجارب رقمية واضحة، جريئة، ومصممة لتحقيق نتائج حقيقية.":"We turn ambitious ideas into digital experiences with a point of view — designed to move businesses, people and possibilities forward."}</p>
    <div className="stormHeroActions"><button onClick={()=>setQuote(true)}>{ar?"ابدأ محادثة":"Let's build something"}<ArrowUpRight size={17}/></button><a href="#work"><span>↘</span>{ar?"استكشف أعمالنا":"Explore selected work"}</a></div>
   </div>
   <div className="stormHeroAside"><span className="stormHeroAsideTop">STRATEGY / DESIGN / ENGINEERING</span><div className="stormHeroMonogram">V<span>/</span></div><div className="stormHeroAsideBottom"><span>NOT ANOTHER<br/>DIGITAL AGENCY.</span><b>VLT—26</b></div></div>
   <div className="stormHeroBottom"><span>SCROLL TO DISCOVER</span><i/><span>30° 03' N / 31° 14' E</span></div>
  </section>
  <div className="stormMarquee"><div>BUILT TO BREAK THROUGH <b>✳</b> STRATEGY WITH SUBSTANCE <b>✳</b> DESIGN THAT DOES MORE <b>✳</b> TECHNOLOGY WITH PURPOSE <b>✳</b> BUILT TO BREAK THROUGH <b>✳</b> STRATEGY WITH SUBSTANCE <b>✳</b></div></div>
  <section className="stormWork stormSection" id="work">
   <div className="stormSectionTop"><span>01 — SELECTED WORK</span><span>IDEAS MADE TANGIBLE / 2026</span></div>
   <div className="stormWorkIntro"><h2>{ar?<>Work that<br/><em>speaks.</em></>:<>Good ideas.<br/><em>Real presence.</em></>}</h2><p>{ar?"نماذج مختارة لتجارب رقمية تجمع بين الهوية القوية والتفاصيل المدروسة.":"A few concept experiences showing how we turn a brand's point of view into a digital world people want to explore."}</p></div>
   <div className="stormProjectGrid">{shown.map((p,i)=><article className={"stormProject "+(i===0?"stormProject--feature":"")} key={p.name}>
    <button className={"stormProjectVisual stormVisual--"+p.slug} onClick={()=>setPreview(p)} aria-label={"Preview "+p.name}>
     <img src={p.slug==="noura-beauty"?"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1300&q=90":p.slug==="thread-house"?"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1300&q=90":"https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1300&q=90"} alt={p.name+" concept preview"}/>
     <span className="stormProjectNumber">0{i+1} / CONCEPT</span><span className="stormProjectOpen">OPEN CASE <ArrowUpRight size={15}/></span><span className="stormProjectOverlay"><small>{p.category} / DIGITAL EXPERIENCE</small><b>{p.name}</b></span>
    </button>
    <div className="stormProjectMeta"><div><span>{p.type}</span><h3>{p.name}</h3></div><button onClick={()=>setPreview(p)} aria-label={"View "+p.name}><ArrowUpRight size={19}/></button></div>
   </article>)}</div>
   <div className="stormWorkFoot"><span>CONCEPT WORK / FICTIONAL BRANDS</span><span>HAVE A PROJECT IN MIND?</span><a href="#contact">Let's talk <ArrowUpRight size={15}/></a></div>
  </section>
  <section className="stormServices stormSection" id="services">
   <div className="stormSectionTop"><span>02 — WHAT WE DO</span><span>FROM FIRST THOUGHT TO FINAL BUILD</span></div>
   <div className="stormServicesIntro"><h2>{ar?<>Not just<br/>good-looking.<br/><em>Built to work.</em></>:<>Not just good<br/>looking. <em>Built<br/>to work.</em></>}</h2><p>{ar?"نجمع بين التفكير الاستراتيجي والتصميم والهندسة لبناء حلول رقمية تخدم أهدافك.":"We bring strategy, design and engineering under one roof to create digital products that look considered, work beautifully and earn their place in your business."}</p></div>
   <div className="stormServiceGrid">{services.map(s=><article className="stormServiceCard" key={s.n}><div className="stormServiceTop"><span>{s.n}</span><ArrowUpRight size={18}/></div><h3>{s.name}</h3><p>{s.desc}</p><div className="stormServiceBottom"><span>FROM</span><b>EGP {getStartingPrice(s).toLocaleString("en-US")}+</b></div><button onClick={()=>{setForm({...form,service:s.name});setQuote(true)}}>DISCUSS THIS SERVICE <ArrowUpRight size={13}/></button></article>)}</div>
   <p className="stormPriceNote">Starting prices are indicative. Every engagement is scoped around your goals, timeline and requirements.</p>
  </section>
  <section className="stormStudio stormSection" id="studio">
   <div className="stormSectionTop"><span>03 — THE STUDIO</span><span>SMALL TEAM. BIG INTENT.</span></div>
   <div className="stormStudioGrid"><div className="stormStudioArt"><div className="stormStudioWord">V<span>/</span></div><div className="stormStudioCoordinates">CAIRO BASED<br/>WORLD CONNECTED</div><div className="stormStudioCaption">INDEPENDENT THINKING<br/>COLLABORATIVE MAKING</div></div><div className="stormStudioCopy"><span className="stormMiniLabel">A DIFFERENT KIND OF PARTNER</span><h2>{ar?<>Small team.<br/><em>Serious intent.</em></>:<>We stay small<br/>to think <em>bigger.</em></>}</h2><p>{ar?"نحن فريق مستقل يجمع بين الرؤية التسويقية والتنفيذ التقني. نعمل عن قرب، ونتعامل مع كل مشروع كفرصة لبناء شيء له قيمة حقيقية.":"VELTRIX brings together strategic thinking and hands-on technology. Omar shapes the growth direction; Beshoy turns ambitious ideas into real digital products. Direct collaboration, considered decisions and no unnecessary layers."}</p><div className="stormPeople"><div><span>OA</span><b>Omar Ali</b><small>Marketing & Strategy</small></div><div><span>BR</span><b>Beshoy Ramy</b><small>Development & Engineering</small></div></div><a href="#contact">MEET YOUR NEXT DIGITAL PARTNER <ArrowUpRight size={15}/></a></div></div>
  </section>
  <section className="stormProcess stormSection">
   <div className="stormSectionTop"><span>04 — THE METHOD</span><span>GOOD WORK IS NEVER AN ACCIDENT</span></div><div className="stormProcessIntro"><h2>{ar?<>Clear plan.<br/><em>Bold execution.</em></>:<>Think clearly.<br/><em>Make boldly.</em></>}</h2><p>One focused process. No mystery, no needless complexity. Just the right people making the right decisions at every stage.</p></div>
   <div className="stormSteps">
    <article><span>01</span><i/><h3>Discover</h3><p>Understand the business, the audience and the opportunity.</p></article>
    <article><span>02</span><i/><h3>Define</h3><p>Set the direction, scope and measures of success.</p></article>
    <article><span>03</span><i/><h3>Design</h3><p>Shape the experience, visual system and interactions.</p></article>
    <article><span>04</span><i/><h3>Develop</h3><p>Build with performance, accessibility and detail in mind.</p></article>
    <article><span>05</span><i/><h3>Deliver</h3><p>Test, launch and support what comes next.</p></article>
   </div>
  </section>
  <section className="stormInsights stormSection" id="insights"><div className="stormSectionTop"><span>05 — FIELD NOTES</span><span>THOUGHTS IN PROGRESS</span></div><div className="stormInsightsBody"><div><span className="stormMiniLabel">THE VELTRIX JOURNAL</span><h2>Stay curious.<br/><em>Keep moving.</em></h2><p>Ideas, observations and useful perspectives on the digital decisions shaping what comes next.</p></div><div className="stormInsightCard"><span>V / 001</span><b>THE NEXT<br/>IS NEVER<br/><em>ORDINARY.</em></b><small>NOTES FROM THE STUDIO — COMING SOON</small><Asterisk size={30}/></div></div></section>
  <section className="stormContact stormSection" id="contact"><div className="stormContactOrb"/><div className="stormSectionTop"><span>06 — YOUR MOVE</span><span>LET'S MAKE IT COUNT</span></div><div className="stormContactContent"><span className="stormMiniLabel">HAVE SOMETHING IN MIND?</span><h2>{ar?<>Let's make<br/><em>it matter.</em></>:<>Make your next<br/><em>move matter.</em></>}</h2><p>{ar?"أخبرنا عن فكرتك. سنساعدك في تحويلها إلى الخطوة التالية.":"Tell us what you're building, changing or imagining. We'll help you find the right next step."}</p><div className="stormContactActions"><button onClick={()=>setQuote(true)}>START A PROJECT <ArrowUpRight size={16}/></button><button className="stormSecondaryAction" onClick={()=>setBookingOpen(true)}>BOOK A DISCOVERY CALL <ArrowUpRight size={16}/></button></div><small>CAIRO, EGYPT · AVAILABLE WORLDWIDE</small></div></section>
  <footer className="stormFooter"><div className="stormFooterTop"><div><a className="stormLogo" href="#">VELTRIX<span>®</span></a><p>Digital experiences with intent.<br/>Built for what's next.</p></div><div className="stormFooterSignup"><b>THE VELTRIX LETTER</b><p>Occasional notes on digital, design and technology.</p><form onSubmit={subscribe}><input type="email" required placeholder="Your email address" value={newsletterEmail} onChange={e=>setNewsletterEmail(e.target.value)}/><button aria-label="Subscribe"><ArrowUpRight size={17}/></button></form><small>{newsletterState}</small></div><button className="stormFooterTalk" onClick={()=>setQuote(true)}>LET'S TALK <ArrowUpRight size={17}/></button></div><div className="stormFooterBottom"><span>© {new Date().getFullYear()} VELTRIX. ALL RIGHTS RESERVED.</span><span>CAIRO / EVERYWHERE</span><a href="/client">CLIENT PORTAL</a><a href="/admin">STUDIO ADMIN</a><a href="#" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"})}}>BACK TO TOP ↑</a></div></footer>
  {preview&&<div className="overlay" role="dialog" aria-modal="true" onClick={()=>setPreview(null)}><div className="previewModal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><small>PROJECT CONCEPT</small><h3>{preview.name}</h3></div><button onClick={()=>setPreview(null)} aria-label="Close"><X/></button></div><div className={"previewCanvas "+preview.theme}><h2>{preview.name}</h2><p>{preview.desc}</p><small>INTERACTIVE STOREFRONT DEMO · FICTIONAL BRAND</small></div><p className="modalNote">{preview.desc} This is a fictional brand concept created to demonstrate what VELTRIX can build for local businesses.</p><a className="openStoreDemo" href={"/previews/"+preview.slug}>Explore the interactive storefront <ArrowUpRight size={16}/></a></div></div>}
  {bookingOpen&&<div className="overlay" role="dialog" aria-modal="true" onClick={()=>setBookingOpen(false)}><div className="quoteModal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><small>BOOK A DISCOVERY CALL</small><h3>{bookingSent?"Request received.":"Let us find a time."}</h3></div><button onClick={()=>setBookingOpen(false)} aria-label="Close"><X/></button></div>{bookingSent?<div className="successState"><Check size={28}/><p>Your consultation request is with the VELTRIX team. Your slot is not confirmed until we contact you.</p><button className="continue" onClick={()=>{setBookingOpen(false);setBookingSent(false)}}>Close</button></div>:<form className="inquiryForm" onSubmit={submitBooking}><div className="formPair"><label>Your name<input required minLength={2} value={booking.name} onChange={e=>setBooking({...booking,name:e.target.value})}/></label><label>Email<input required type="email" value={booking.email} onChange={e=>setBooking({...booking,email:e.target.value})}/></label></div><div className="formPair"><label>Phone<input required type="tel" value={booking.phone} onChange={e=>setBooking({...booking,phone:e.target.value})}/></label><label>Consultation type<select value={booking.service} onChange={e=>setBooking({...booking,service:e.target.value})}><option>Discovery consultation</option><option>Website project consultation</option><option>E-commerce consultation</option><option>Web application consultation</option><option>AI solutions consultation</option></select></label></div><div className="formPair"><label>Preferred date<input type="date" min={new Date().toISOString().slice(0,10)} value={booking.date} onChange={e=>setBooking({...booking,date:e.target.value})}/></label><label>Preferred time<select value={booking.time} onChange={e=>setBooking({...booking,time:e.target.value})}><option value="">Flexible</option><option>10:00–12:00</option><option>12:00–14:00</option><option>14:00–16:00</option><option>16:00–18:00</option></select></label></div><label>Anything we should prepare?<textarea rows={3} value={booking.notes} onChange={e=>setBooking({...booking,notes:e.target.value})}/></label>{bookingError&&<p className="formError">{bookingError}</p>}<div className="minimum">This sends a request only. The VELTRIX team will confirm the time with you.</div><button className="continue" disabled={bookingSending}>{bookingSending?"Sending request...":"Request consultation"} <ArrowRight size={16}/></button></form>}</div></div>}
  {quote&&<div className="overlay" role="dialog" aria-modal="true" onClick={()=>setQuote(false)}><div className="quoteModal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><small>LET&apos;S GET STARTED</small><h3>{sent?"Thanks — we have your brief.":"Tell us what you have in mind."}</h3></div><button onClick={()=>{setQuote(false);setSent(false)}} aria-label="Close"><X/></button></div>{sent?<div className="successState"><Check size={28}/><p>Your enquiry has been sent to the VELTRIX team. We will review the details and get back to you.</p><button className="continue" onClick={()=>{setQuote(false);setSent(false);setForm({name:"",email:"",phone:"",company:"",service:"Business website",budget:"EGP 20,000–40,000",message:""})}}>Close</button></div>:<><p>Share a few details so we can understand your project and prepare the right next step.</p><form className="inquiryForm" onSubmit={submitInquiry}><div className="formPair"><label>Your name<input required minLength={2} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></label><label>Email address<input required type="email" maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label></div><div className="formPair"><label>Phone (optional)<input type="tel" maxLength={40} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+20"/></label><label>Company (optional)<input maxLength={120} value={form.company} onChange={e=>setForm({...form,company:e.target.value})} placeholder="Company name"/></label></div><div className="formPair"><label>Project type<select value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option>Business website</option><option>E-commerce website</option><option>Web application</option><option>UI/UX design</option><option>AI & automation</option><option>Custom digital platform</option></select></label><label>Estimated budget<select value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}><option>EGP 20,000–40,000</option><option>EGP 40,000–60,000</option><option>EGP 60,000–120,000</option><option>EGP 120,000+</option><option>Let&apos;s discuss</option></select></label></div><label>Tell us about the project<textarea required minLength={10} maxLength={5000} rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="What are you trying to achieve? What should we know?"/></label>{formError&&<p className="formError" role="alert">{formError}</p>}<div className="minimum"><Check size={15}/> Custom project engagements start from EGP 20,000.</div><button className="continue" type="submit" disabled={sending}>{sending?"Sending enquiry...":"Send project enquiry"} <ArrowRight size={16}/></button></form></>}</div></div>}
 </main>
}
