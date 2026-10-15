"use client";

import { useEffect, useRef, useState } from "react";
import { LOADER_CSS, OdyLoaderScreen, type Phase } from "./OdyLoaderScreen";

/*
 * Full-screen frame for the OdyDesk demos (odysra.com/odydesk/staff and /admin).
 *
 * Loading, in three smooth steps (never a white screen):
 *   1. "cover"  – solid black, the Odysra logo spinning in the middle
 *   2. "reveal" – the app has drawn its first real screen: the black turns see-through and
 *                 the app fades in underneath the logo
 *   3. "done"   – the app has fully loaded: the loading screen fades away
 */

export default function OdyDeskFrame({ src, title, allow }: { src: string; title: string; allow?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<Phase>("cover");
  const loaded = useRef(false);

  // step 2: as soon as the app inside has drawn something, start revealing it
  useEffect(() => {
    const t = setInterval(() => {
      try {
        const doc = frame.current?.contentDocument;
        const root = doc?.getElementById("root");
        if (root && root.childElementCount > 0 && !root.querySelector("[data-boot]")) {
          setPhase((p) => (p === "cover" ? "reveal" : p));
          // fully loaded (also covers a load that finished before React was ready)
          if (doc?.readyState === "complete") { finish(); clearInterval(t); }
        }
      } catch {
        clearInterval(t);
      }
    }, 80);
    // never leave people waiting on the loader
    const giveUp = setTimeout(() => finish(), 12000);
    return () => { clearInterval(t); clearTimeout(giveUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    if (loaded.current) return;
    loaded.current = true;
    setPhase((p) => (p === "cover" ? "reveal" : p));
    // let the reveal show for a moment, then fade the loader out and remove it
    setTimeout(() => setPhase("done"), 450);
    setTimeout(() => setPhase("gone"), 450 + 800);
  };

  return (
    <>
      <style>{LOADER_CSS}</style>
      <iframe
        ref={frame}
        src={src}
        title={title}
        allow={allow}
        className={`odf${phase === "cover" ? "" : " on"}`}
        onLoad={finish}
      />
      <OdyLoaderScreen phase={phase} />
    </>
  );
}
