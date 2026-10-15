// Black loading screen with the spinning Odysra logo, shared by the OdyDesk demo
// pages and their route loading.tsx. No hooks, so it works on the server too.

export type Phase = "cover" | "reveal" | "done" | "gone";

export const LOADER_CSS = `
html,body{height:100%;margin:0;overflow:hidden;overscroll-behavior:none;background:#000}
.odl{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,1);transition:background-color 1.1s ease,opacity 1.4s ease;pointer-events:auto}
.odl.reveal{background:rgba(0,0,0,.5)}
.odl.done{background:rgba(0,0,0,0);opacity:0;pointer-events:none}
.odl img{width:96px;height:96px;display:block;will-change:transform;
  animation:odlSpin 1.6s cubic-bezier(.45,.05,.35,.95) infinite;
  filter:drop-shadow(0 0 22px rgba(255,255,255,.18));transition:opacity 1.4s ease}
.odl.done img{opacity:0}
@keyframes odlSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.odf{position:fixed;inset:0;width:100%;height:100%;border:none;background:#000;opacity:0;transition:opacity 1.2s ease}
.odf.on{opacity:1}
@media (prefers-reduced-motion:reduce){.odl img{animation-duration:3s}}
`;

export function OdyLoaderScreen({ phase = "cover" }: { phase?: Phase }) {
  if (phase === "gone") return null;
  return (
    <div className={`odl ${phase === "cover" ? "" : phase}`} role="status" aria-label="Loading">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/odysra_spinner.webp" alt="" />
    </div>
  );
}

