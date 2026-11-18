import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const GEMINI_API_KEY=process.env.GEMINI_API_KEY;
const MODEL="gemini-2.5-flash-lite";
async function isAdmin(request:NextRequest){
 const authorization=request.headers.get("authorization")||"";
 if(!authorization.startsWith("Bearer ")||!SUPABASE_URL||!SUPABASE_KEY)return false;
 try{const r=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:{apikey:SUPABASE_KEY,Authorization:authorization},cache:"no-store"});if(!r.ok)return false;const user=await r.json();return user?.app_metadata?.role==="admin";}catch{return false;}
}
export async function GET(request:NextRequest){
 if(!(await isAdmin(request)))return NextResponse.json({error:"Administrator access required."},{status:401});
 return NextResponse.json({configured:Boolean(GEMINI_API_KEY),provider:"Google Gemini",model:MODEL,tier:"free-tier-only"});
}
export async function POST(request:NextRequest){
 if(!(await isAdmin(request)))return NextResponse.json({error:"Administrator access required."},{status:401});
 if(!GEMINI_API_KEY)return NextResponse.json({error:"Gemini is not configured. Add GEMINI_API_KEY to Vercel Production and redeploy."},{status:503});
 try{
  const body=await request.json();const messages=Array.isArray(body?.messages)?body.messages.slice(-12):[];
  if(!messages.length||messages.some((item:{role?:string;content?:string})=>!["user","assistant"].includes(item?.role||"")||typeof item?.content!=="string"||item.content.length>4000))return NextResponse.json({error:"Send up to 12 valid chat messages. Each message must be under 4,000 characters."},{status:400});
  const contents=messages.map((item:{role:"user"|"assistant";content:string})=>({role:item.role==="assistant"?"model":"user",parts:[{text:item.content.trim()}]}));
  const upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+MODEL+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:"You are VELTRIX Studio Copilot, available only to an authenticated VELTRIX administrator. Help with agency operations, client communication, proposals, service descriptions, marketing copy and project planning. VELTRIX offers websites, e-commerce, web applications, UI/UX, AI automation and digital growth. Do not invent client facts, prices, project status or analytics. Do not claim to access the database or send messages. Keep client information confidential; never ask for passwords, API keys or payment details."}]},contents,generationConfig:{temperature:0.4,maxOutputTokens:900}}),cache:"no-store"});
  const result=await upstream.json();
  if(!upstream.ok)return NextResponse.json({error:upstream.status===429?"Gemini free-tier quota reached. Please try again later.":"Gemini could not complete the request."},{status:upstream.status===429?429:502});
  const answer=result?.candidates?.[0]?.content?.parts?.map((part:{text?:string})=>part.text||"").join("").trim();
  if(!answer)return NextResponse.json({error:"The AI returned an empty response. Please try again."},{status:502});
  return NextResponse.json({answer});
 }catch{return NextResponse.json({error:"Could not reach Gemini. Please try again."},{status:502});}
}
