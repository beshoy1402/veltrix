"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,ImagePlus,LockKeyhole,UploadCloud} from "lucide-react";

export default function PaymentPage(){
 const [form,setForm]=useState({name:"",email:"",phone:"",project_reference:"",amount_egp:"",transaction_reference:""});
 const [file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [reference,setReference]=useState("");
 const instapay=process.env.NEXT_PUBLIC_INSTAPAY_HANDLE||"";
 async function submit(e:FormEvent){
  e.preventDefault();setError("");
  if(!file){setError("Please attach your InstaPay transaction screenshot.");return;}
  setBusy(true);
  try{
   const body=new FormData();Object.entries(form).forEach(([key,value])=>body.append(key,value));body.append("receipt",file);
   const r=await fetch("/api/payment-submissions",{method:"POST",body});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Submission failed.");
   setReference(data.reference_code);setFile(null);
   setForm({name:"",email:"",phone:"",project_reference:"",amount_egp:"",transaction_reference:""});
  }catch(e){setError(e instanceof Error?e.message:"Could not submit your receipt.");}
  finally{setBusy(false);}
 }
 return <main className="vxPaymentPage"><nav className="vxPaymentNav"><Link href="/" className="vxPaymentBrand">VELTRIX<span> / STUDIO</span></Link><Link href="/" className="vxPaymentBack"><ArrowLeft size={15}/> Back to website</Link></nav><section className="vxPaymentHero"><p className="vxPaymentEyebrow">PAYMENT CONFIRMATION · INSTA﻿PAY</p><h1>Payment<br/><i>proof.</i></h1><p>Upload your InstaPay transaction screenshot securely. Our team will review it and update your payment status.</p></section>
 {reference?<section className="vxPaymentSuccess"><CheckCircle2 size={30}/><p className="vxPaymentEyebrow">RECEIPT SUBMITTED</p><h2>We’ve received your proof.</h2><p>Your reference number is:</p><strong>{reference}</strong><p>Keep this reference. Your payment is pending manual verification by the VELTRIX team.</p><Link href="/" className="vxPaymentSubmit">Return to VELTRIX</Link></section>:<form className="vxPaymentForm" onSubmit={submit}>
 <div className="vxPaymentNotice"><LockKeyhole size={17}/><span>Your receipt is stored privately and can only be viewed by the VELTRIX admin team. Uploading a screenshot does not automatically confirm payment.</span></div>
 {instapay?<div className="vxPaymentHandle"><small>OFFICIAL INSTAPAY ACCOUNT</small><strong>{instapay}</strong><span>Confirm the recipient details before sending.</span></div>:<div className="vxPaymentNotice"><span>Ask your VELTRIX project contact for the official InstaPay account details before making a transfer. Do not send money to an unverified account.</span></div>}
 <div className="vxPaymentFields"><label>Full name<input required minLength={2} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Email address<input required type="email" maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label><label>Phone number<input type="tel" maxLength={40} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+20..."/></label><label>Project / invoice reference<input maxLength={100} value={form.project_reference} onChange={e=>setForm({...form,project_reference:e.target.value})} placeholder="e.g. VELTRIX project name or invoice"/></label><label>Amount sent (EGP)<input type="number" min="1" step="0.01" value={form.amount_egp} onChange={e=>setForm({...form,amount_egp:e.target.value})} placeholder="e.g. 5000"/></label><label>InstaPay transaction reference (optional)<input maxLength={120} value={form.transaction_reference} onChange={e=>setForm({...form,transaction_reference:e.target.value})} placeholder="Transaction ID"/></label></div>
 <label className="vxPaymentUpload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><ImagePlus size={24}/><strong>{file?file.name:"Choose transaction screenshot"}</strong><span>JPG, PNG or WEBP · Maximum 6 MB</span></label>
 {error&&<p className="vxPaymentError">{error}</p>}
 <button className="vxPaymentSubmit" disabled={busy}>{busy?<><UploadCloud size={16}/> Uploading securely…</>:<><UploadCloud size={16}/> Submit payment proof</>}</button>
 <p className="vxPaymentFine">Please upload a clear, unedited screenshot showing the transaction details. Never upload your InstaPay PIN, password or OTP.</p>
 </form>}
 <footer className="vxPaymentFooter">VELTRIX — Digital experiences, thoughtfully built.</footer></main>
}
