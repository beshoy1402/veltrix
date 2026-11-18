import type {Metadata,Viewport} from "next";
import "./globals.css";
import VeltrixAgent from "./components/VeltrixAgent";

const siteUrl="https://veltrix-lac.vercel.app";
export const metadata:Metadata={
 metadataBase:new URL(siteUrl),
 title:{default:"VELTRIX — Independent Digital Studio",template:"%s | VELTRIX"},
 description:"VELTRIX is an independent digital studio shaping distinctive websites, commerce experiences, web applications and intelligent digital products.",
 applicationName:"VELTRIX",
 keywords:["VELTRIX","digital studio","web design","web development","e-commerce","web applications","UI UX","Cairo"],
 authors:[{name:"VELTRIX"}],
 creator:"VELTRIX",
 openGraph:{type:"website",siteName:"VELTRIX",title:"VELTRIX — Independent Digital Studio",description:"Thoughtful digital experiences. Purposeful by nature.",url:siteUrl,images:[{url:"/opengraph-image",width:1200,height:630,alt:"VELTRIX — Independent Digital Studio"}]},
 twitter:{card:"summary_large_image",title:"VELTRIX — Independent Digital Studio",description:"Thoughtful digital experiences. Purposeful by nature."},
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}}
};
export const viewport:Viewport={themeColor:"#211F1B",colorScheme:"light"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<VeltrixAgent/></body></html>;}
