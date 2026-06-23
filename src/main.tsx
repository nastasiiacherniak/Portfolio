
  import { createRoot } from "react-dom/client";
  import { lazy, Suspense } from "react";
  import { BrowserRouter, Routes, Route } from "react-router";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Case studies are split into their own chunks so the homepage ("/") doesn't ship their
  // JS (or pull in their large image/video assets) until that route is actually visited.
  const CaseStudyBrushBuddy = lazy(() => import("./app/CaseStudyBrushBuddy.tsx"));
  const CaseStudyRinesk = lazy(() => import("./app/CaseStudyRinesk.tsx"));
  const CaseStudyFincube = lazy(() => import("./app/CaseStudyFincube.tsx"));
  const CaseStudyJukrassic = lazy(() => import("./app/CaseStudyJukrassic.tsx"));

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter basename="/Portfolio">
      {/* Dark fallback matches the site background, so a chunk fetch never flashes white. */}
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#33323b" }} />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/work/brushbuddy" element={<CaseStudyBrushBuddy />} />
          <Route path="/work/rinesk" element={<CaseStudyRinesk />} />
          <Route path="/work/fincube" element={<CaseStudyFincube />} />
          <Route path="/work/jukrassic" element={<CaseStudyJukrassic />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
