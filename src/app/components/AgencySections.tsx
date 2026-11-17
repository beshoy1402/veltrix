"use client";
import {useState} from "react";
import {ArrowUpRight, Plus, Minus, Asterisk} from "lucide-react";

export default function AgencySections({ar=false}:{ar?:boolean}) {
 const [faq,setFaq]=useState(-1);
 const [article,setArticle]=useState(-1);
 const articles=[
  {tag:"STRATEGY / 5 MIN",title:"Before you build: define the problem",body:"A useful digital project starts with a business problem, not a feature list. Define who the product serves, what friction it removes and how you will know it worked.",at:"قبل البناء: حدد المشكلة",ab:"يبدأ المشروع الرقمي الناجح بمشكلة واضحة، لا بقائمة مزايا. حدد المستخدم وما الذي تريد تحسينه وكيف ستقيس النجاح."},
  {tag:"DESIGN / 6 MIN",title:"What makes a website feel trustworthy?",body:"Trust comes from consistency: clear service information, honest examples, accessible contact details, useful answers and a smooth experience across devices.",at:"ما الذي يجعل الموقع جديراً بالثقة؟",ab:"تأتي الثقة من الاتساق: معلومات واضحة، وأمثلة صادقة، وطرق تواصل متاحة، وإجابات مفيدة وتجربة سلسة على كل الأجهزة."},
  {tag:"TECH / 7 MIN",title:"Choosing the right platform for your business",body:"Choose technology around the workflow, integrations, ownership and maintenance your business actually needs. The newest stack is not automatically the best fit.",at:"اختيار التقنية المناسبة لنشاطك",ab:"اختر التقنية وفق سير العمل والتكاملات والملكية والصيانة التي يحتاجها نشاطك فعلاً. التقنية الأحدث ليست دائماً الاختيار الأنسب."}
 ];
 const faqs=[
  ["How much does a project cost?","Our published starting prices are indicative. Final pricing depends on scope, functionality, content, integrations and timeline. We provide a clear proposal before work begins.","كم تبلغ تكلفة المشروع؟","الأسعار المبدئية إرشادية. يعتمد السعر النهائي على النطاق والوظائف والمحتوى والتكاملات والجدول الزمني. نقدم عرضاً واضحاً قبل بدء العمل."],
  ["How long does a website take?","Timelines depend on the size and complexity of the project and how quickly content and feedback are provided. We agree milestones and a delivery plan before development.","كم يستغرق تنفيذ الموقع؟","تعتمد المدة على حجم المشروع وتعقيده وسرعة توفير المحتوى والملاحظات. نتفق على مراحل وجدول تسليم قبل التطوير."],
  ["Can you work with an existing brand?","Yes. We can work within an established identity or help refine the digital expression of your brand as part of the project scope.","هل يمكنكم العمل بهوية تجارية موجودة؟","نعم. يمكننا الالتزام بهويتك الحالية أو تطوير حضورها الرقمي ضمن نطاق المشروع."],
  ["Who owns the website after launch?","Ownership, source-code handover, hosting and third-party service costs are defined in the project agreement so expectations are clear before work starts.","من يمتلك الموقع بعد الإطلاق؟","يتم توضيح الملكية وتسليم الشيفرة والاستضافة وتكاليف الخدمات الخارجية في اتفاق المشروع قبل البدء."],
  ["Do you provide revisions and support?","The proposal defines review rounds, acceptance criteria and any post-launch support or maintenance. Ongoing work can be scoped separately.","هل تقدمون تعديلات ودعماً بعد الإطلاق؟","يوضح العرض جولات المراجعة ومعايير القبول والدعم أو الصيانة بعد الإطلاق. ويمكن الاتفاق على أعمال مستمرة بشكل منفصل."],
  ["Do you work with businesses outside Egypt?","Yes. VELTRIX is based in Cairo and can collaborate remotely with clients in other locations.","هل تعملون مع شركات خارج مصر؟","نعم. مقر VELTRIX في القاهرة ويمكننا التعاون عن بُعد مع عملاء في دول أخرى."]
 ];
 return <>
  <section className="stormTrust stormSection">
   <div className="stormSectionTop"><span>04 — {ar?"لماذا VELTRIX":"WHY VELTRIX"}</span><span>{ar?"شراكة واضحة من البداية":"A CLEARER WAY TO BUILD"}</span></div>
   <div className="stormTrustIntro"><h2>{ar?<>شريك يفكر<br/><em>معك.</em></>:<>More than a<br/><em>supplier.</em></>}</h2><p>{ar?"نعمل معك مباشرة من فهم الهدف إلى الإطلاق، مع وضوح في النطاق والتواصل والقرارات.":"A close working relationship, clear decisions and a team that stays accountable from the first conversation through launch."}</p></div>
   <div className="stormTrustGrid">
    <article><span>01 / DIRECT</span><h3>{ar?"تواصل مباشر":"Direct collaboration"}</h3><p>{ar?"تعمل مباشرة مع الأشخاص المسؤولين عن الاستراتيجية والتنفيذ.":"Work directly with the people shaping the strategy and building the product."}</p></article>
    <article><span>02 / PURPOSEFUL</span><h3>{ar?"قرارات مدروسة":"Purpose before features"}</h3><p>{ar?"نختار التقنية والتصميم بناءً على احتياجات مشروعك، لا لمجرد الإبهار.":"Every design and technical decision should serve a real business or user need."}</p></article>
    <article><span>03 / TRANSPARENT</span><h3>{ar?"نطاق واضح":"Clear scope & updates"}</h3><p>{ar?"نتفق على الأولويات والمخرجات والخطوات قبل بدء التنفيذ.":"Know what is included, what comes next and where your project stands."}</p></article>
   </div>
  </section>
  <section className="stormTestimonials stormSection">
   <div className="stormSectionTop"><span>05 — {ar?"ثقة تُبنى":"CLIENT EXPERIENCE"}</span><span>{ar?"كلمات حقيقية فقط":"REAL WORDS. NEVER PLACEHOLDERS."}</span></div>
   <div className="stormTestimonialBody"><span className="stormMiniLabel">{ar?"آراء العملاء":"A NOTE ON TESTIMONIALS"}</span><h2>{ar?<>الثقة تُكتسب<br/><em>ولا تُختلق.</em></>:<>Trust is<br/><em>earned.</em></>}</h2><p>{ar?"نضيف هنا آراء العملاء الحقيقية بعد اكتمال المشاريع والحصول على موافقتهم. لن ننشر أسماء أو تقييمات افتراضية.":"We’ll publish verified client feedback here only after real projects are delivered and clients approve their words. No invented reviews, names or ratings."}</p><span className="stormProofNote">{ar?"قسم جاهز لاستقبال شهادات العملاء":"TESTIMONIALS / READY FOR VERIFIED FEEDBACK"}</span></div>
  </section>
  <section className="stormInsights stormSection" id="insights">
   <div className="stormSectionTop"><span>06 — {ar?"المجلة":"FIELD NOTES"}</span><span>{ar?"أفكار عملية":"PRACTICAL DIGITAL THINKING"}</span></div>
   <div className="stormInsightsBody"><div><span className="stormMiniLabel">THE VELTRIX JOURNAL</span><h2>{ar?<>فكر بوضوح.<br/><em>تحرك للأمام.</em></>:<>Stay curious.<br/><em>Keep moving.</em></>}</h2><p>{ar?"مقالات عملية تساعدك على اتخاذ قرارات أفضل في التصميم والتقنية ونمو الأعمال.":"Practical reads to help make better decisions about design, technology and digital growth."}</p></div><div className="stormInsightCard"><span>V / JOURNAL</span><b>{ar?<>رؤية<br/>أوضح.<br/><em>نتائج أفضل.</em></>:<>BETTER<br/>THINKING.<br/><em>BETTER BUILDS.</em></>}</b><small>{ar?"مقالات من فريق VELTRIX":"IDEAS FROM THE VELTRIX TEAM"}</small><Asterisk size={30}/></div></div>
   <div className="stormArticleGrid">{articles.map((a,i)=><article className={"stormArticle "+(article===i?"isOpen":"")} key={a.tag}><span>{a.tag}</span><h3>{ar?a.at:a.title}</h3><p>{ar?a.ab:a.body}</p><button onClick={()=>setArticle(article===i?-1:i)}>{article===i?(ar?"إغلاق":"CLOSE"):(ar?"عرض المقال":"READ ARTICLE")} <ArrowUpRight size={15}/></button></article>)}</div>
  </section>
  <section className="stormFaq stormSection" id="faq">
   <div className="stormSectionTop"><span>07 — {ar?"أسئلة شائعة":"GOOD TO KNOW"}</span><span>{ar?"إجابات قبل البداية":"ANSWERS BEFORE WE BEGIN"}</span></div>
   <div className="stormFaqIntro"><h2>{ar?<>أسئلة<br/><em>مهمة.</em></>:<>A few things<br/><em>worth knowing.</em></>}</h2><p>{ar?"إجابات مباشرة عن طريقة العمل والتسعير والتسليم.":"Straight answers about how we work, what projects involve and what happens after launch."}</p></div>
   <div className="stormFaqList">{faqs.map((f,i)=><article className={"stormFaqItem "+(faq===i?"isOpen":"")} key={f[0]}><button onClick={()=>setFaq(faq===i?-1:i)} aria-expanded={faq===i}><span>{ar?f[2]:f[0]}</span>{faq===i?<Minus size={18}/>:<Plus size={18}/>}</button>{faq===i&&<p>{ar?f[3]:f[1]}</p>}</article>)}</div>
  </section>
 </>;
}