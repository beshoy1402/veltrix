import { NextRequest, NextResponse } from "next/server";
import { cleanText, insertPublicRecord, validEmail } from "@/lib/server/public-api";

export const runtime = "nodejs";
export const maxDuration = 30;
type ChatMessage = { role: "user" | "model"; text: string };
const MODEL = "gemini-3.5-flash-lite";
const systemInstruction = `You are the VELTRIX digital studio's website agent. Reply in the visitor's language: Egyptian Arabic, Modern Standard Arabic, English, or mixed Arabic-English. VELTRIX is an independent digital studio based in Cairo, Egypt. Services: websites, e-commerce, web applications, UI/UX, AI and automation, digital growth and care. Published indicative starting prices in EGP: websites 30,000; e-commerce 55,000; web applications 55,000; UI/UX 20,000; AI and automation 45,000; digital growth 20,000. Prices are not final quotes; final scope needs discussion. Portfolio examples are concepts, not verified client work. Never invent services, discounts, deadlines, availability, testimonials or guarantees. Ask focused follow-up questions, recommend suitable services, collect requirements, and offer an enquiry or consultation. Answer general questions helpfully but disclose uncertainty. Before submitting any lead or booking, summarize all details and obtain explicit confirmation. Only use submission tools after confirmation. A consultation request is NOT a confirmed appointment; the team must confirm it. Never collect passwords or payment details. Never claim an action succeeded unless its tool reports success.`;
const tools = [{ functionDeclarations: [
 { name: "get_veltrix_services", description: "Retrieve current published services and prices.", parameters: { type: "OBJECT", properties: {} } },
 { name: "submit_project_enquiry", description: "Save a project enquiry only after visitor explicitly confirms the summarized details.", parameters: { type: "OBJECT", properties: { name:{type:"STRING"},email:{type:"STRING"},message:{type:"STRING"},phone:{type:"STRING"},company:{type:"STRING"},service_interest:{type:"STRING"},budget:{type:"STRING"} }, required:["name","email","message","confirmed"] } },
 { name: "request_consultation", description: "Save a consultation request only after visitor explicitly confirms. This is not a confirmed appointment.", parameters: { type:"OBJECT", properties:{name:{type:"STRING"},email:{type:"STRING"},phone:{type:"STRING"},service_interest:{type:"STRING"},preferred_date:{type:"STRING"},preferred_time:{type:"STRING"},notes:{type:"STRING"}}, required:["name","email","phone","service_interest","preferred_time","confirmed"] } }
]}];

function isExplicitConfirmation(messages: ChatMessage[]) {
 const previous = messages[messages.length - 2];
 const latest = messages[messages.length - 1];
 if (!previous || previous.role !== "model" || !latest || latest.role !== "user") return false;
 const value = latest.text.trim().toLowerCase();
 return ["yes","yes please","yes, submit it","yes, send it","yes, book it","confirm","confirmed","do it","go ahead","تمام","أيوه","ايوه","اه","نعم","موافق","ابعت","سجل","احجز"].includes(value);
}
async function runTool(name: string, args: Record<string, unknown>, confirmed: boolean) {
 if (name === "get_veltrix_services") {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) return {ok:false,error:"Catalogue unavailable"};
  const r=await fetch(`${url}/rest/v1/services?select=category,name,description,price_egp,price_label&is_published=eq.true&order=sort_order.asc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
  if(!r.ok) return {ok:false,error:"Could not load catalogue"};
  return {services:await r.json()};
 }
 if(name==="submit_project_enquiry"){\n  if(args.confirmed!==true || !confirmed) return {ok:false,error:"The visitor has not explicitly confirmed submission after reviewing the summary. Ask them to confirm first."};
  const name=cleanText(args.name,120,true),email=cleanText(args.email,254,true),message=cleanText(args.message,4000,true);
  if(!name||name.length<2||!email||!validEmail(email)||!message||message.length<10) return {ok:false,error:"Valid name, email and project description (10+ characters) are required."};
  await insertPublicRecord("inquiries",{name,email:email.toLowerCase(),message,phone:cleanText(args.phone,40),company:cleanText(args.company,120),service_interest:cleanText(args.service_interest,120),budget:cleanText(args.budget,80)});
  return {ok:true,message:"Project enquiry saved for the VELTRIX team."};
 }
 if(name==="request_consultation"){\n  if(args.confirmed!==true || !confirmed) return {ok:false,error:"The visitor has not explicitly confirmed this request after reviewing the summary. Ask them to confirm first."};
  const fullName=cleanText(args.name,120,true),email=cleanText(args.email,254,true),phone=cleanText(args.phone,40,true),service=cleanText(args.service_interest,120,true),time=cleanText(args.preferred_time,40,true),date=cleanText(args.preferred_date,10);
  if(!fullName||fullName.length<2||!email||!validEmail(email)||!phone||!service||!time||(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))) return {ok:false,error:"Valid name, email, phone, service and preferred time are required. Date must be YYYY-MM-DD."};
  await insertPublicRecord("bookings",{name:fullName,email:email.toLowerCase(),phone,service_interest:service,preferred_date:date||null,preferred_time:time,notes:cleanText(args.notes,2000)});
  return {ok:true,message:"Consultation request saved. It is pending team confirmation, not a confirmed appointment."};
 }
 return {ok:false,error:"Unknown action"};
}

export async function POST(request:NextRequest){
 try{
  const key=process.env.GEMINI_API_KEY;
  if(!key) return NextResponse.json({error:"The VELTRIX assistant is being configured. Please use the contact form for now."},{status:503});
  const body=await request.json();
  const raw=Array.isArray(body.messages)?body.messages.slice(-12):[];
  const messages:ChatMessage[]=raw.map((m:{role?:unknown;text?:unknown})=>({role:m.role==="assistant"||m.role==="model"?"model":"user",text:cleanText(m.text,1800)})).filter((m:ChatMessage)=>m.text);
  if(!messages.length||messages[messages.length-1].role!=="user") return NextResponse.json({error:"Send a message to begin."},{status:400});
  const confirmed=isExplicitConfirmation(messages);\n  const contents:Array<Record<string,unknown>>=messages.map(m=>({role:m.role,parts:[{text:m.text}]}));
  const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  for(let turn=0;turn<3;turn++){
   const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:systemInstruction}]},contents,tools,toolConfig:{functionCallingConfig:{mode:"AUTO"}},generationConfig:{temperature:0.4,maxOutputTokens:650}}),cache:"no-store"});
   const result=await response.json();
   if(!response.ok){console.error("Gemini API error",response.status,result?.error?.message);return NextResponse.json({error:response.status===429?"The free AI quota is busy. Please try again later.":"The assistant is temporarily unavailable."},{status:response.status===429?429:503});}
   const candidate=result?.candidates?.[0]?.content,parts=Array.isArray(candidate?.parts)?candidate.parts:[];
   const calls=parts.filter((p:{functionCall?:unknown})=>p.functionCall);
   if(!calls.length){const answer=parts.map((p:{text?:string})=>p.text||"").join("").trim();return NextResponse.json({answer:answer||"I couldn't prepare a response. Please try again."});}
   contents.push(candidate);
   const responses=[];
   for(const p of calls){const call=p.functionCall;try{responses.push({functionResponse:{name:call.name,response:await runTool(call.name,call.args||{},confirmed)}});}catch(e){console.error("Agent action failed",call.name,e);responses.push({functionResponse:{name:call.name,response:{ok:false,error:"The action failed. Please use the website contact form."}}});}}
   contents.push({role:"user",parts:responses});
  }
  return NextResponse.json({error:"The assistant reached its action limit. Please try again."},{status:503});
 }catch(e){console.error("Agent endpoint error",e);return NextResponse.json({error:"The assistant is temporarily unavailable."},{status:503});}
}
