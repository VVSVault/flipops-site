"use client";
import { useEffect } from "react";

export default function OverflowDebugPage() {
  useEffect(() => {
    const vw = document.documentElement.clientWidth;
    const nodes = [...document.querySelectorAll('body *')].filter((el: any) => {
      const r = el.getBoundingClientRect();
      return el.scrollWidth > el.clientWidth + 1 || r.right > vw + 1;
    });

    nodes.forEach((el: any) => {
      el.style.outline = '2px solid red';
      el.style.outlineOffset = '2px';
    });

    // eslint-disable-next-line no-console
    console.table(nodes.map((el: any) => ({
      tag: el.tagName.toLowerCase(),
      class: String(el.className).slice(0, 200),
      sw: el.scrollWidth,
      cw: el.clientWidth
    })));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Overflow Debug</h1>
      <p>Check console for overflowing elements (highlighted in red)</p>
    </div>
  );
}