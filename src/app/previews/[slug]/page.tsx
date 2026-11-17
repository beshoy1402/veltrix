"use client";

import {useMemo,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,Heart,Minus,Plus,Search,ShoppingBag,X,Menu,SlidersHorizontal} from "lucide-react";

type Product={id:number;name:string;category:string;price:number;oldPrice?:number;image:string;tag?:string;description:string};
type Brand={name:string;mark:string;tagline:string;intro:string;accent:string;paper:string;ink:string;categories:string[];products:Product[];currency:string;delivery:string};
const photo=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
const brands:Record<string,Brand>={
 "noura-beauty":{
  name:"NOURA",mark:"N.",tagline:"Rituals for radiant days.",intro:"Thoughtful skincare, rooted in simple rituals and ingredients your skin will love.",accent:"#b66c54",paper:"#f5eee7",ink:"#33251f",categories:["All","Face","Body","Sets"],currency:"EGP",delivery:"Free delivery on orders over EGP 1,500",
  products:[
   {id:1,name:"Daily Dew Serum",category:"Face",price:690,image:photo("photo-1608248543803-ba4f8c70ae0b"),tag:"BESTSELLER",description:"A lightweight daily serum for a fresh, hydrated glow."},
   {id:2,name:"Cloud Cream",category:"Face",price:540,image:photo("photo-1601049541289-9b1b7bbbfe19"),description:"A cushion-soft moisturiser for everyday comfort."},
   {id:3,name:"Nourishing Body Oil",category:"Body",price:780,image:photo("photo-1608571423902-eed4a5ad8108"),tag:"NEW",description:"A silky botanical body oil with a soft natural finish."},
   {id:4,name:"The Everyday Edit",category:"Sets",price:1490,oldPrice:1690,image:photo("photo-1556229010-6c3f2c9ca5f8"),tag:"SAVE 12%",description:"A considered routine with three daily essentials."},
   {id:5,name:"Gentle Cloud Cleanser",category:"Face",price:460,image:photo("photo-1556228720-195a672e8a03"),description:"A gentle, comfortable cleanse without the tight feeling."},
   {id:6,name:"Soft Skin Butter",category:"Body",price:620,image:photo("photo-1608248543803-ba4f8c70ae0b"),description:"Rich body care for slow evenings and softer mornings."}
  ]
 },
 "thread-house":{
  name:"THREAD HOUSE",mark:"TH.",tagline:"Everyday, redefined.",intro:"Easy pieces. Better fits. Made to move with you, wherever the day goes.",accent:"#283d35",paper:"#f2f0e9",ink:"#202a25",categories:["All","New in","Tops","Bottoms"],currency:"EGP",delivery:"Complimentary delivery over EGP 2,500",
  products:[
   {id:1,name:"The Form Shirt",category:"Tops",price:1250,image:photo("photo-1598033129183-c4f50c736f10"),tag:"NEW",description:"An easy-cut shirt designed for everyday rotation."},
   {id:2,name:"Relaxed Linen Set",category:"New in",price:2350,image:photo("photo-1598554747436-c9293d6a588f"),tag:"BESTSELLER",description:"A relaxed two-piece set with a clean, considered silhouette."},
   {id:3,name:"Everyday Overshirt",category:"Tops",price:1680,image:photo("photo-1618354691373-d851c5c3a990"),description:"A versatile layer for changing plans and changing weather."},
   {id:4,name:"Studio Trousers",category:"Bottoms",price:1490,image:photo("photo-1506629905607-d9f9c3e4a5f7"),description:"Straight-leg trousers with room to move."},
   {id:5,name:"Weekend Essential",category:"Tops",price:890,image:photo("photo-1521572163474-6864f9cf17ab"),description:"A heavyweight everyday tee with a relaxed fit."},
   {id:6,name:"Utility Shorts",category:"Bottoms",price:1090,image:photo("photo-1515886657613-9f3515b0c78f"),tag:"LIMITED",description:"An easy warm-weather staple with useful details."}
  ]
 },
 "kahwa-lab":{
  name:"KAHWA LAB",mark:"K.",tagline:"A better kind of daily grind.",intro:"Small-batch coffee, honest ingredients and a little more joy in your daily cup.",accent:"#a65c35",paper:"#f4eee5",ink:"#2e241d",categories:["All","Coffee","Equipment","Bundles"],currency:"EGP",delivery:"Freshly packed. Delivered across Egypt.",
  products:[
   {id:1,name:"Cairo House Blend",category:"Coffee",price:420,image:photo("photo-1447933601403-0c6688de566e"),tag:"FAVOURITE",description:"A balanced daily blend with notes of chocolate and dates."},
   {id:2,name:"Single Origin Ethiopia",category:"Coffee",price:560,image:photo("photo-1559525839-b184a4d698c7"),tag:"SMALL BATCH",description:"Bright, floral and carefully roasted for filter brewing."},
   {id:3,name:"The Daily Brewer",category:"Equipment",price:980,image:photo("photo-1495474472287-4d71bcdd2085"),description:"A simple brewer for a slower, better morning."},
   {id:4,name:"Coffee Starter Kit",category:"Bundles",price:1390,oldPrice:1580,image:photo("photo-1514432324607-a09d9b4aefdd"),tag:"BUNDLE",description:"Everything you need to build a better coffee ritual."},
   {id:5,name:"Cold Brew Bottle",category:"Equipment",price:750,image:photo("photo-1517701604599-bb29b565090c"),description:"Brew smooth, refreshing coffee at home."},
   {id:6,name:"Brazil Cerrado",category:"Coffee",price:490,image:photo("photo-1498804103079-a6351b050096"),description:"A mellow, naturally sweet cup with a nutty finish."}
  ]
 }
};

export default function StorefrontPreview(){
 const params=useParams<{slug:string}>();
 const brand=brands[params.slug];
 const [category,setCategory]=useState("All");
 const [search,setSearch]=useState("");
 const [cart,setCart]=useState<Record<number,number>>({});
 const [cartOpen,setCartOpen]=useState(false);
 const [selected,setSelected]=useState<Product|null>(null);
 const [mobileMenu,setMobileMenu]=useState(false);
 const [notice,setNotice]=useState("");
 const [checkout,setCheckout]=useState(false);
 const [email,setEmail]=useState("");
 const products=brand?.products??[];
 const visible=useMemo(()=>products.filter(p=>(category==="All"||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase())),[products,category,search]);
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const total=products.reduce((sum,p)=>sum+p.price*(cart[p.id]??0),0);
 const add=(id:number)=>{setCart(v=>({...v,[id]:(v[id]??0)+1}));setNotice("Added to your bag");window.setTimeout(()=>setNotice(""),1800);};
 const change=(id:number,delta:number)=>setCart(v=>{const next={...v,[id]:Math.max(0,(v[id]??0)+delta)};if(!next[id])delete next[id];return next;});
 if(!brand)return <main className="storeMissing"><h1>Preview not found</h1><Link href="/">Back to VELTRIX</Link></main>;
 return <main className={`storeDemo storeDemo--${params.slug}`} style={{"--store-accent":brand.accent,"--store-paper":brand.paper,"--store-ink":brand.ink} as React.CSSProperties}>
  <div className="demoRibbon"><span>VELTRIX INTERACTIVE SHOWCASE</span><span>DEMO STORE · NOT A REAL MERCHANT</span><Link href="/">← Back to VELTRIX</Link></div>
  <div className="storeAnnouncement">{brand.delivery}</div>
  <header className="storeHeader"><button className="storeHamb" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu/></button><a className="storeWordmark" href="#top">{brand.name}<sup>{brand.mark}</sup></a><nav className={mobileMenu?"storeNav open":"storeNav"}>{brand.categories.map(c=><button key={c} onClick={()=>{setCategory(c);setMobileMenu(false);document.getElementById("shop")?.scrollIntoView({behavior:"smooth"});}}>{c}</button>)}</nav><button className="storeBag" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/><span>Bag ({count})</span></button></header>
  {params.slug==="noura-beauty"?<section className="brandHero brandHero--noura" id="top"><div className="brandHeroCopy"><span className="storeEyebrow">NOURA SKINCARE · THE DAILY RITUAL</span><h1>Skin, meet<br/><em>your softer side.</em></h1><p>Thoughtful formulas. Gentle textures. A little moment of care, made part of every day.</p><a href="#shop">DISCOVER THE RITUAL <ArrowRight size={16}/></a><div className="nouraNotes"><span>01 / CLEANSE</span><span>02 / NOURISH</span><span>03 / GLOW</span></div></div><div className="brandHeroMedia"><img src={photo("photo-1608248543803-ba4f8c70ae0b")} alt="Noura skincare still life"/><div className="nouraSeal">A LITTLE<br/>MORE YOU</div><span className="mediaCaption">THE EVERYDAY SKIN EDIT — 01</span></div></section>:params.slug==="thread-house"?<section className="brandHero brandHero--thread" id="top"><div className="threadHeroMedia"><img src={photo("photo-1529139574466-a303027c1d8b")} alt="Thread House fashion editorial"/><div className="threadHeroStamp">TH / STUDIO<br/>COLLECTION 026</div></div><div className="threadHeroCopy"><span className="storeEyebrow">THE NEW UNIFORM · ISSUE 01</span><h1>Less, but<br/><em>better.</em></h1><p>Good clothes earn their place. Discover considered essentials, relaxed silhouettes and pieces made to be worn on repeat.</p><a href="#shop">SHOP THE COLLECTION <ArrowRight size={16}/></a><small>DESIGNED FOR REAL LIFE — MADE TO MOVE</small></div></section>:<section className="brandHero brandHero--kahwa" id="top"><div className="kahwaHeroCopy"><span className="storeEyebrow">KAHWA LAB · ROASTED WITH INTENTION</span><h1>Your day.<br/>Your <em>ritual.</em></h1><p>Start with better beans. Small-batch coffee, honest flavour notes and tools for the perfect slow morning.</p><a href="#shop">FIND YOUR NEXT CUP <ArrowRight size={16}/></a><div className="kahwaMeta"><span>FRESHLY ROASTED</span><span>·</span><span>BREWED IN EGYPT</span></div></div><div className="kahwaHeroMedia"><img src={photo("photo-1442512595331-e89e73853f31")} alt="Freshly brewed coffee"/><div className="kahwaPack"><small>K / 01 — HOUSE BLEND</small><b>GOOD<br/>MORNING.</b><span>WHOLE BEAN · 250G</span></div></div></section>}
  {params.slug==="noura-beauty"?<section className="brandManifesto manifesto--noura"><span>THE NOURA PROMISE</span><p>Care that feels like a pause.<br/><em>Results that feel like you.</em></p><span>LESS NOISE. MORE GLOW.</span></section>:params.slug==="thread-house"?<section className="brandManifesto manifesto--thread"><span>THE THREAD HOUSE POINT OF VIEW</span><p>Wear it often.<br/><em>Wear it your way.</em></p><span>FIT / FABRIC / FUNCTION</span></section>:<section className="brandManifesto manifesto--kahwa"><span>OUR BREWING PHILOSOPHY</span><p>Take your time.<br/><em>Make it a good cup.</em></p><span>ORIGIN / ROAST / RITUAL</span></section>}
  <section className="storeShop" id="shop"><div className="storeShopHead"><div><span className="storeEyebrow">THE COLLECTION / 2026</span><h2>Find your new favourite<span>.</span></h2></div><label className="storeSearch"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find something you love"/></label></div>
   <div className="storeFilters"><div>{brand.categories.map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><span><SlidersHorizontal size={14}/> {visible.length} PRODUCTS</span></div>
   <div className="storeProducts">{visible.map(p=><article className="storeProduct" key={p.id}><button className="storeProductImage" onClick={()=>setSelected(p)}><img src={p.image} alt={p.name}/>{p.tag&&<span>{p.tag}</span>}<i><ArrowRight size={17}/></i></button><div className="storeProductInfo"><div><span>{p.category}</span><h3>{p.name}</h3></div><strong>{brand.currency} {p.price.toLocaleString("en-US")}</strong></div><button className="storeAdd" onClick={()=>add(p.id)}>ADD TO BAG <Plus size={14}/></button></article>)}</div>
   {visible.length===0&&<div className="storeEmpty">No products match that search. Try another name or category.</div>}
  </section>
  <section className={`brandStory brandStory--${params.slug}`}><div className="brandStoryImage"><img src={params.slug==="noura-beauty"?photo("photo-1556229010-6c3f2c9ca5f8"):params.slug==="thread-house"?photo("photo-1525507119028-ed4c629a60a3"):photo("photo-1495474472287-4d71bcdd2085")} alt={brand.name+" editorial story"}/><span>{params.slug==="noura-beauty"?"THE ART OF EVERYDAY CARE":params.slug==="thread-house"?"A WARDROBE, EDITED":"FROM BEAN TO BREW"}</span></div><div className="brandStoryCopy"><span className="storeEyebrow">{params.slug==="noura-beauty"?"A MORE MINDFUL ROUTINE":params.slug==="thread-house"?"THE THOUGHTFUL WARDROBE":"BETTER COFFEE STARTS HERE"}</span><h2>{params.slug==="noura-beauty"?"Make room for a little self-care.":params.slug==="thread-house"?"The pieces you reach for, again.":"A little craft in every cup."}</h2><p>{brand.intro} Every detail is considered, from the first impression to the everyday experience.</p><a href="#shop">{params.slug==="noura-beauty"?"EXPLORE SKINCARE":params.slug==="thread-house"?"EXPLORE THE EDIT":"EXPLORE THE ROASTS"} <ArrowRight size={16}/></a></div></section>
  <footer className="storeFooter"><div><a className="storeWordmark" href="#top">{brand.name}</a><p>Thoughtful goods. Better everyday rituals.</p></div><div><b>STAY IN THE LOOP</b><form onSubmit={e=>{e.preventDefault();setNotice("Thanks — this demo newsletter is not connected to a mailing list.");setEmail("");window.setTimeout(()=>setNotice(""),3000);}}><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/><button aria-label="Subscribe"><ArrowRight/></button></form></div><small>© 2026 {brand.name} · STOREFRONT CONCEPT BY VELTRIX</small></footer>
  {notice&&<div className="storeToast"><Check size={16}/>{notice}</div>}
  {selected&&<div className="storeOverlay" onClick={()=>setSelected(null)}><div className="storeProductModal" onClick={e=>e.stopPropagation()}><button className="storeClose" onClick={()=>setSelected(null)}><X/></button><img src={selected.image} alt={selected.name}/><div><span>{selected.category}</span><h2>{selected.name}</h2><p>{selected.description}</p><strong>{brand.currency} {selected.price.toLocaleString("en-US")}</strong><button onClick={()=>{add(selected.id);setSelected(null);setCartOpen(true);}}>ADD TO BAG <Plus size={15}/></button></div></div></div>}
  {cartOpen&&<div className="storeOverlay" onClick={()=>setCartOpen(false)}><aside className="storeCart" onClick={e=>e.stopPropagation()}><div className="storeCartHead"><div><span>YOUR SELECTION</span><h2>Your bag ({count})</h2></div><button onClick={()=>setCartOpen(false)}><X/></button></div>{count===0?<div className="storeCartEmpty">Your bag is waiting for something good.</div>:<><div className="storeCartItems">{products.filter(p=>cart[p.id]).map(p=><article key={p.id}><img src={p.image} alt={p.name}/><div><b>{p.name}</b><span>{brand.currency} {p.price.toLocaleString("en-US")}</span><div className="storeQty"><button onClick={()=>change(p.id,-1)}><Minus size={12}/></button><span>{cart[p.id]}</span><button onClick={()=>change(p.id,1)}><Plus size={12}/></button></div></div><strong>{brand.currency} {(p.price*cart[p.id]).toLocaleString("en-US")}</strong></article>)}</div><div className="storeCartBottom"><div><span>SUBTOTAL</span><strong>{brand.currency} {total.toLocaleString("en-US")}</strong></div><small>Shipping and delivery details are confirmed by the merchant.</small><button onClick={()=>setCheckout(true)}>CONTINUE TO CHECKOUT <ArrowRight size={16}/></button></div></>}</aside></div>}
  {checkout&&<div className="storeOverlay" onClick={()=>setCheckout(false)}><div className="storeCheckout" onClick={e=>e.stopPropagation()}><button className="storeClose" onClick={()=>setCheckout(false)}><X/></button><Check size={28}/><h2>This is a live demo.</h2><p>Your cart works, but checkout and payment are intentionally disabled. A real VELTRIX store can connect delivery, inventory and secure payment providers.</p><button onClick={()=>{setCheckout(false);setCartOpen(false);}}>BACK TO STORE</button></div></div>}
  <div className="storeDemoNote">INTERACTIVE CONCEPT · Sample products and prices · No real orders or payments are processed.</div>
 </main>;
}
