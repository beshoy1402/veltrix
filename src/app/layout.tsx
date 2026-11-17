import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "VELTRIX — Digital Innovation Studio",
  description: "Strategy, design and technology for ambitious businesses. Digital experiences, built for what's next.",
  openGraph: { title: "VELTRIX — Digital Innovation Studio", description: "Digital experiences, built for what's next.", type: "website" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
