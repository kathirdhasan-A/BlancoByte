"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const NAVY = 0x0a1735;

function baseOptions(el: HTMLElement) {
  return {
    el,
    THREE: (window as unknown as { THREE: unknown }).THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1,
    scaleMobile: 1,
    backgroundColor: NAVY,
  };
}

function birdsOptions(el: HTMLElement) {
  return {
    ...baseOptions(el),
    color1: 0x6fa0f5,
    color2: 0xf5a623,
    colorMode: "variance",
    birdSize: 0.8,
    wingSpan: 18,
    speedLimit: 2.5,
    separation: 70,
    alignment: 25,
    cohesion: 25,
    quantity: 2,
  };
}

function netOptions(el: HTMLElement) {
  return {
    ...baseOptions(el),
    color: 0x3e63c8,
    points: 8,
    maxDistance: 20,
    spacing: 18,
    showDots: true,
  };
}

export function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const effect = pathname === "/" ? "birds" : "net";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let instance: { destroy?: () => void } | null = null;
    let active = true;

    async function start() {
      const three = await import("three");
      (window as unknown as { THREE: unknown }).THREE = three;
      const mod =
        effect === "birds"
          ? await import("vanta/dist/vanta.birds.min")
          : await import("vanta/dist/vanta.net.min");
      const create = mod.default || mod;
      if (!active || !ref.current) return;
      instance = create(effect === "birds" ? birdsOptions(ref.current) : netOptions(ref.current));
    }
    start();

    return () => {
      active = false;
      if (instance && instance.destroy) instance.destroy();
    };
  }, [effect]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 820px at 12% -8%, rgba(46,107,245,0.22), transparent 60%), radial-gradient(1000px 680px at 88% 12%, rgba(127,176,255,0.12), transparent 58%), radial-gradient(1100px 760px at 100% 108%, rgba(245,166,35,0.10), transparent 55%), linear-gradient(180deg, #0B1A3E 0%, var(--color-bg-page) 55%, #060E22 100%)",
      }}
    >
      <div ref={ref} className="absolute inset-0" style={{ opacity: effect === "birds" ? 0.6 : 0.5 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(10,23,53,0) 35%, rgba(10,23,53,0.5) 80%, #0A1735 100%)" }}
      />
    </div>
  );
}

export default VantaBackground;
