import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Julee, Itim, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const pjs = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-pjs',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-display',
});

const julee = Julee({
  weight: "400",
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-julee',
});

const itim = Itim({
  weight: "400",
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-itim',
});

const nunito = Nunito({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-nunito',
});

// Playpen removed as per request

// Update metadata while we are here to reflect HRIZ branding
export const metadata: Metadata = {
  title: "HRIS - Platform HRIS & Payroll Otomatis",
  description: "Kelola karyawan, payroll, dan absensi lebih mudah dengan HRIS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${pjs.variable} ${spaceGrotesk.variable} ${julee.variable} ${itim.variable} ${nunito.variable} font-sans antialiased text-slate-600 bg-slate-50`}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </Providers>
      </body>
    </html>
  );
}
