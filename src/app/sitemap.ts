import type {MetadataRoute} from "next";
const base="https://veltrix-lac.vercel.app";
export default function sitemap():MetadataRoute.Sitemap{
 const paths=["","/quote-estimator","/work/noura-beauty","/work/thread-house","/work/kahwa-lab","/services/websites","/services/ecommerce","/services/web-applications","/services/ui-ux","/services/ai-automation","/services/digital-growth"];
 return paths.map(path=>({url:base+path,lastModified:new Date(),changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:path==="/quote-estimator"?.9:.75}));
}
