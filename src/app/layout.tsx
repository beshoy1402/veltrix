import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VELTRIX — Creative Digital Agency",
  description: "A creative digital agency building websites, e-commerce experiences, web applications, product design and AI solutions for ambitious brands.",
  openGraph: { title: "VELTRIX — Digital Innovation Studio", description: "Creative strategy, design and technology. Built for digital impact.", type: "website" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
