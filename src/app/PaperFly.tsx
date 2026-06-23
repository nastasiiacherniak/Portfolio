import Lottie from "lottie-react";
import paperFly from "@/imports/paper-fly.json";

// Isolated so the (heavy) lottie-web runtime and the animation JSON live in their own lazy chunk,
// kept out of the homepage's initial payload — this animation sits below the fold in Contact.
export default function PaperFly() {
  return <Lottie animationData={paperFly} loop className="w-full h-full" />;
}
