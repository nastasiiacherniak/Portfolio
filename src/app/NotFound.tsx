import { useEffect } from "react";
import { Link } from "react-router";
import { gallery, manrope, CustomCursor } from "./App";

// Shown for any URL that doesn't match a route (Vercel rewrites every path to index.html).
export default function NotFound() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Page not found - Anastasiia Cherniak";
    return () => { document.title = prev; };
  }, []);

  return (
    <main className="min-h-screen bg-[#33323b] flex flex-col items-center justify-center px-4 text-center" style={manrope}>
      <h1 className="text-[#c39e7b] text-[clamp(96px,18vw,220px)] leading-none" style={gallery}>404</h1>
      <p className="mt-[24px] text-[18px] md:text-[20px] text-[#fefefe]">This page doesn't exist</p>
      <p className="mt-[8px] text-[14px] md:text-[16px] text-[#9a99a0]">The link may be broken or the page may have moved.</p>
      <Link
        to="/"
        data-cursor="expand"
        className="mt-[40px] text-[14px] md:text-[16px] text-[#fefefe] uppercase transition-colors duration-300 hover:text-[#c39e7b]"
      >
        ← Back home
      </Link>
      <CustomCursor />
    </main>
  );
}
