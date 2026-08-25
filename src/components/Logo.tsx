"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function Logo({ size = "default" }: { size?: "default" | "small" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const wordSize = size === "small" ? "text-xl" : "text-2xl";
  const tile = size === "small" ? 32 : 40;
  const iconSize = size === "small" ? 22 : 28;

  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="BlancoByte home">
      {!imageFailed ? (
        <span
          className="flex items-center justify-center overflow-hidden rounded-lg bg-white"
          style={{ width: tile, height: tile, padding: 5, boxShadow: "0 4px 18px var(--color-accent-glow)" }}
        >
          <img
            src="/logo.png"
            alt="BlancoByte"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onError={() => setImageFailed(true)}
          />
        </span>
      ) : (
        <span
          className="flex items-center justify-center rounded-lg"
          style={{
            width: tile,
            height: tile,
            background: "linear-gradient(135deg, rgba(46,107,245,0.95), rgba(127,176,255,0.9))",
            color: "#0A1735",
          }}
        >
          <Icon name="database-2-fill" size={iconSize} />
        </span>
      )}
      <span className={`font-display ${wordSize} leading-none text-text-primary`}>
        Blanco<span className="text-accent">Byte</span>
      </span>
    </Link>
  );
}

export default Logo;
