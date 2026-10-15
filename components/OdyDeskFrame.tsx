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
 *   3. "done"   – the app and its data have fully loaded: the loading screen fades away slowly
 */

export default function OdyDeskFrame({ src, title, allow }: { src: string; title: string; allow?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [phase, setPhase] = useState<Phase>("cover");

  useEffect(() => {
    const w = window as unknown as { __odyCover?: boolean };
    w.__odyCover = true; // tells the app not to draw its own (second) logo meanwhile
    let revealAt = 0;
    let quietSince = 0;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(t);
      clearTimeout(giveUp);
      setPhase("reveal");
      // fade the loader away slowly, then remove it
      setTimeout(() => { setPhase("done"); w.__odyCover = false; }, 120);
      setTimeout(() => setPhase("gone"), 120 + 1500);
    };
    const t = setInterval(() => {
      try {
        const doc = frame.current?.contentDocument;
        const root = doc?.getElementById("root");
        const drawn = !!root && root.childElementCount > 0 && !root.querySelector("[data-boot]") && !!root.firstElementChild?.childElementCount;
        if (!drawn) return;
        const now = Date.now();
        // step 2: the app has drawn its first screen -> black turns see-through, page fades in below
        if (!revealAt) { revealAt = now; setPhase("reveal"); }
        // step 3: everything loaded (page + its data) and calm for a moment -> loader fades away
        const busy = doc!.readyState !== "complete" || !!doc!.querySelector('[data-loading="1"]');
        if (busy) { quietSince = 0; return; }
        if (!quietSince) quietSince = now;
        if (now - quietSince >= 350 && now - revealAt >= 1600) finish();
      } catch {
        finish();
      }
    }, 100);
    // never leave people waiting on the loader
    const giveUp = setTimeout(finish, 15000);
    return () => { clearInterval(t); clearTimeout(giveUp); w.__odyCover = false; };
  }, []);

  return (
    <>
      <style>{LOADER_CSS}</style>
      <iframe
        ref={frame}
        src={src}
        title={title}
        allow={allow}
        className={`odf${phase === "cover" ? "" : " on"}`}
      />
      <OdyLoaderScreen phase={phase} />
    </>
  );
}
