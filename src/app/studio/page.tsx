import type {Metadata} from "next";
import EditorialStudioPage from "../components/EditorialStudioPage";
export const metadata:Metadata={title:"The Studio & Founders",description:"Meet the people behind VELTRIX — an independent digital studio bringing marketing strategy and software engineering together.",openGraph:{title:"The Studio & Founders — VELTRIX",description:"Strategy and engineering, working together with intent.",type:"website"}};
export default function StudioPage(){return <EditorialStudioPage/>;}
