// The four portfolio projects as instant photos in the Playground. Text is taken from the case-study pages
// (Project info / Approach / Outcomes); images reuse the site's existing assets.
import imgRinesk from "../../images/Rinesk_min.webp";
import imgFincube from "../../images/Fincube_min.webp";
import imgBrush from "../../images/Brushbuddy_var_min.webp";
import imgJukra from "../../images/Jukrassic Pork_min.webp";
import heroRinesk from "@/imports/rinesk/hero.webp";
import heroFincube from "@/imports/fincube/hero.webp";
import heroBrush from "@/imports/brushbuddy/hero.webp";
import heroJukra from "@/imports/jukrassic/hero.webp";

export type PlaygroundProject = {
  id: string;
  title: string;
  type: string;
  year: string;
  photo: string; // square-ish crop on the instant photo
  hero: string; // larger image in the opened view
  alt: string;
  to: string; // full case study
  sections: { id: "info" | "approach" | "results"; label: string; heading: string; body: string[] }[];
};

export const PROJECTS: PlaygroundProject[] = [
  {
    id: "rinesk",
    title: "Rinesk",
    type: "Dashboard",
    year: "2025",
    photo: imgRinesk,
    hero: heroRinesk,
    alt: "Rinesk call-centre analytics dashboard on a tablet",
    to: "/work/rinesk",
    sections: [
      { id: "info", label: "Project Info", heading: "Concept that improves efficiency & best experience", body: [
        "Rinesk is a design concept for a web and mobile dashboard built for modern call centers. It helps teams track performance, analyze satisfaction, and improve daily workflow.",
        "The focus was to streamline operations and reduce cognitive load for faster, more confident decision-making.",
      ] },
      { id: "approach", label: "Approach", heading: "Visual system across Social media", body: [
        "For Rinesk, I designed a consistent visual identity optimized for digital platforms, focusing on Instagram as a key communication channel. The content layout emphasized clarity and color balance, reflecting the dashboard's calm and data-driven aesthetic.",
      ] },
      { id: "results", label: "Results", heading: "Performance-driven interface results", body: [
        "The final Rinesk dashboard delivered a clear interface that improves workflow visibility. A/B testing showed higher task completion speed and reduced cognitive load. Usability sessions confirmed better navigation flow and increased satisfaction among test participants.",
      ] },
    ],
  },
  {
    id: "fincube",
    title: "Fincube",
    type: "Finance, Mobile App",
    year: "2024",
    photo: imgFincube,
    hero: heroFincube,
    alt: "Fincube personal finance mobile app screens",
    to: "/work/fincube",
    sections: [
      { id: "info", label: "Project Info", heading: "Transforming complex finance into structured clarity", body: [
        "Fincube is a sleek personal finance app designed to help users efficiently manage their income and expenses while maintaining the highest level of privacy. Designed over a 2-month timeline across 50+ screens, the project covers four distinct development stages.",
        "The app's primary goal is to let users track financial activities securely, set clear savings goals, and gain instant insights into their spending patterns through a streamlined, user-friendly interface.",
      ] },
      { id: "approach", label: "Approach", heading: "Sleek dark-mode aesthetics meeting daily utility", body: [
        "For Fincube, I developed a premium, dark-mode-first visual identity that blends data-dense screens with clean typography and vibrant gradient accents. To ensure a cohesive experience across the entire user journey, this visual structure was extended into several key areas, such as intuitive onboarding and home screen widgets.",
      ] },
      { id: "results", label: "Results", heading: "Validated design impact and high-performance results", body: [
        "The final architecture for Fincube effectively eliminated the clutter typical of traditional banking software, shifting the focus onto scannable metrics and graphs. Comprehensive feature benchmarking against 7 industry competitors ensured that Fincube delivered a superior feature-to-interface balance.",
      ] },
    ],
  },
  {
    id: "brushbuddy",
    title: "BrushBuddy",
    type: "E-commerce",
    year: "2024",
    photo: imgBrush,
    hero: heroBrush,
    alt: "BrushBuddy oral-care e-commerce website on a tablet",
    to: "/work/brushbuddy",
    sections: [
      { id: "info", label: "Project Info", heading: "Little bit of humor and lightness never hurts", body: [
        "BrushBuddy is a hub of oral and dental care products for adults, children and pets.",
        "The main task of the website was to create an atmosphere of healthy and clean teeth. Led by the main supporter of healthy teeth Polina, company collected the best dental accessories on one site.",
      ] },
      { id: "approach", label: "Approach", heading: "Minimalist interface using the Bento style", body: [
        "Many design variants were offered. This design concept is a minimalist interface with a pleasant color palette with a light touch of humor. Using the Bento style helps to structure the content into blocks and is easier for the user to read.",
      ] },
      { id: "results", label: "Results", heading: "Trust-infused engagement results", body: [
        "The final BrushBuddy design brilliantly balances a professional medical backbone with a warm, family-friendly aesthetic. By weaving the founder's clinical expertise directly into the product discovery loop, the UX achieved stellar qualitative outcomes.",
      ] },
    ],
  },
  {
    id: "jukrassic",
    title: "Jukrassic Pork",
    type: "Media",
    year: "2023",
    photo: imgJukra,
    hero: heroJukra,
    alt: "Jukrassic Pork band website redesign",
    to: "/work/jukrassic",
    sections: [
      { id: "info", label: "Project Info", heading: "Streamlining the digital fan journey", body: [
        "Jukrassic Pork is a Ukrainian pop-rock project founded in 2000 by Vyacheslav /Zmeark/ Lozowy that crafts heavy music spiced with electronic elements.",
        "The website redesign was initiated to better reflect the band's values and address key user pain points identified through qualitative research and empathy mapping, such as the inability to find clear contact options, a desire to read lyrics directly on-site, and the frustration of navigating poorly organized music platforms.",
      ] },
      { id: "approach", label: "Approach", heading: "Capturing pop-rock energy through atmospheric design", body: [
        "The redesigned interface translates the band's electronic pop-rock genre into an atmospheric dark-mode ecosystem, using a vibrant neon accent color strictly to highlight interactive controls and call-to-actions.",
        "This high-contrast visual solution pairs bold, condensed headings for raw stylistic impact with highly legible, geometric typography to ensure seamless readability across desktop and mobile screens.",
      ] },
      { id: "results", label: "Results", heading: "Proven interface accessibility and low-friction user results", body: [
        "By resolving core user frustrations via comprehensive empathy mapping, the Jukrassic Pork redesign successfully eliminates the fragmented navigation and hidden information typical of indie band websites to deliver an intelligible, content-first user experience.",
        "The final architecture shifts the fan's focus entirely toward effortless media exploration, instant lyric access, and high-visibility communication channels.",
      ] },
    ],
  },
];

// Camera finishes, named after the "Camera" reference folders; colours sampled from those photos.
// `body` is the true colour (used for the swatch); `model` is the value fed to the 3D material, a
// little deeper so the lit, tone-mapped camera reads as the same colour as the photos.
export const CAMERA_COLORS = [
  { id: "misty-white", name: "Misty White", body: "#ecebe6", model: "#e6e5e0" },
  { id: "brick-red", name: "Brick Red", body: "#b3624f", model: "#8b4232" },
  { id: "slate-blue", name: "Slate Blue", body: "#98a7a2", model: "#6d7d78" },
] as const;
export type CameraColorId = (typeof CAMERA_COLORS)[number]["id"];
