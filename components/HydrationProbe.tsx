"use client";
import { useEffect, useRef, useState } from "react";

export default function HydrationProbe({
  label,
  className = "",
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const serverClass = el.getAttribute("data-server-class") || "";
    const clientClass = el.className || "";

    if (mounted && serverClass !== clientClass) {
      console.warn("[HydrationProbe]", label, { serverClass, clientClass });
      el.style.outline = "3px solid magenta";
      el.style.outlineOffset = "2px";
    }
  }, [mounted, label]);

  return (
    <div ref={ref} data-server-class={className} className={className}>
      {children}
    </div>
  );
}