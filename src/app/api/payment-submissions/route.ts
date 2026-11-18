import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "instapay-receipts";
const mimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function serviceHeaders(extra: Record<string,string> = {}) {
  return { apikey: SECRET || "", Authorization: `Bearer ${SECRET || ""}`, ...extra };
}
async function isAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!URL || !PUBLIC_KEY || !auth.startsWith("Bearer ")) return false;
  try {
    const r = await fetch(URL + "/auth/v1/user", { headers: { apikey: PUBLIC_KEY, Authorization: auth }, cache: "no-store" });
    if (!r.ok) return false;
    const user = await r.json();
    return user?.app_metadata?.role === "admin";
  } catch { return false; }
}
function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0,max) : "";
}
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254; }

export async function POST(request: NextRequest) {
  if (!URL || !PUBLIC_KEY || !SECRET) return NextResponse.json({error:"Payment upload is not configured on the server."},{status:503});
  try {
    const form = await request.formData();
    const name = clean(form.get("name"),120);
    const email = clean(form.get("email"),254).toLowerCase();
    const phone = clean(form.get("phone"),40);
    const projectReference = clean(form.get("project_reference"),100);
    const transactionReference = clean(form.get("transaction_reference"),120);
    const amountRaw = clean(form.get("amount_egp"),30);
    const file = form.get("receipt");
    if (name.length < 2 || !validEmail(email)) return NextResponse.json({error:"Enter your name and a valid email address."},{status:400});
    if (!(file instanceof File) || !mimeTypes.has(file.type) || file.size < 1 || file.size > 6 * 1024 * 1024) return NextResponse.json({error:"Upload a JPG, PNG or WEBP screenshot up to 6 MB."},{status:400});
    const amount = amountRaw ? Number(amountRaw) : null;
    if (amountRaw && (!Number.isFinite(amount) || amount! <= 0 || amount! > 100000000)) return NextResponse.json({error:"Enter a valid payment amount."},{status:400});
    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const reference = "VX-" + randomUUID().replaceAll("-","").slice(0,10).toUpperCase();
    const storagePath = new Date().toISOString().slice(0,10) + "/" + reference + "." + ext;
    const bytes = await file.arrayBuffer();
    const signature = new Uint8Array(bytes.slice(0,12));
    const validSignature = file.type === "image/jpeg"
      ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : file.type === "image/png"
        ? signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e && signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a && signature[6] === 0x1a && signature[7] === 0x0a
        : file.type === "image/webp"
          ? String.fromCharCode(...signature.slice(0,4)) === "RIFF" && String.fromCharCode(...signature.slice(8,12)) === "WEBP"
          : false;
    if (!validSignature) return NextResponse.json({error:"The file contents do not match a supported image format."},{status:400});
    const upload = await fetch(URL + "/storage/v1/object/" + BUCKET + "/" + storagePath.split("/").map(encodeURIComponent).join("/"), {
      method:"POST", headers:serviceHeaders({"Content-Type":file.type,"x-upsert":"false"}), body:bytes, cache:"no-store"
    });
    if (!upload.ok) {
      console.error("InstaPay receipt upload failed", await upload.text());
      return NextResponse.json({error:"The receipt could not be uploaded. Please try again."},{status:502});
    }
    const inserted = await fetch(URL + "/rest/v1/payment_submissions", {
      method:"POST", headers:serviceHeaders({"Content-Type":"application/json",Prefer:"return=minimal"}),
      body:JSON.stringify({reference_code:reference,customer_name:name,customer_email:email,customer_phone:phone||null,project_reference:projectReference||null,amount_egp:amount,transaction_reference:transactionReference||null,storage_path:storagePath,original_filename:file.name.slice(0,180),mime_type:file.type,file_size_bytes:file.size,status:"pending"}),cache:"no-store"
    });
    if (!inserted.ok) {
      console.error("InstaPay submission insert failed", await inserted.text());
      await fetch(URL + "/storage/v1/object/" + BUCKET + "/" + storagePath.split("/").map(encodeURIComponent).join("/"),{method:"DELETE",headers:serviceHeaders(),cache:"no-store"});
      return NextResponse.json({error:"We could not save your payment submission. Please try again."},{status:502});
    }
    return NextResponse.json({ok:true,reference_code:reference,message:"Your payment proof has been received and is awaiting manual verification."},{status:201});
  } catch (error) {
    console.error("InstaPay proof submission failed",error);
    return NextResponse.json({error:"Could not submit the payment proof. Please try again."},{status:500});
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({error:"Administrator access required."},{status:401});
  if (!URL || !SECRET) return NextResponse.json({error:"Payment review is not configured."},{status:503});
  try {
    const r = await fetch(URL + "/rest/v1/payment_submissions?select=*&order=created_at.desc&limit=200",{headers:serviceHeaders(),cache:"no-store"});
    const rows = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(rows));
    const submissions = await Promise.all(rows.map(async (row: Record<string,unknown>) => {
      const signed = await fetch(URL + "/storage/v1/object/sign/" + BUCKET + "/" + String(row.storage_path).split("/").map(encodeURIComponent).join("/"), {
        method:"POST",headers:serviceHeaders({"Content-Type":"application/json"}),body:JSON.stringify({expiresIn:300}),cache:"no-store"
      });
      const result = signed.ok ? await signed.json() : {};
      return {...row,receipt_url:result.signedURL ? (String(result.signedURL).startsWith("http")?result.signedURL:URL+String(result.signedURL)) : null};
    }));
    return NextResponse.json({submissions});
  } catch(error) {
    console.error("Payment submissions load failed",error);
    return NextResponse.json({error:"Could not load payment submissions."},{status:500});
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({error:"Administrator access required."},{status:401});
  if (!URL || !SECRET) return NextResponse.json({error:"Payment review is not configured."},{status:503});
  try {
    const input=await request.json();
    const id=typeof input.id==="string"?input.id:"";
    const status=typeof input.status==="string"?input.status:"";
    const notes=typeof input.admin_notes==="string"?input.admin_notes.trim().slice(0,1500):"";
    if (!/^[0-9a-f-]{36}$/i.test(id) || !["pending","verified","rejected"].includes(status)) return NextResponse.json({error:"Invalid payment review update."},{status:400});
    const r=await fetch(URL+"/rest/v1/payment_submissions?id=eq."+encodeURIComponent(id),{
      method:"PATCH",headers:serviceHeaders({"Content-Type":"application/json",Prefer:"return=minimal"}),
      body:JSON.stringify({status,admin_notes:notes,updated_at:new Date().toISOString()}),cache:"no-store"
    });
    if(!r.ok)throw new Error(await r.text());
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("Payment review update failed",error);
    return NextResponse.json({error:"Could not update payment status."},{status:500});
  }
}
