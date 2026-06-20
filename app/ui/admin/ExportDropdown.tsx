"use client";

import { useState, useEffect, useRef } from "react";

export default function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs tracking-[0.15em] text-brown hover:text-terracotta transition-colors"
      >
        EXPORTAR {open ? "▴" : "▾"}
      </button>

      {open && (
        <div className="absolute right-0 top-7 bg-cream border border-tan z-20 min-w-[168px]">
          <a
            href="/api/admin/export?format=csv"
            className="block px-4 py-3 text-xs tracking-[0.12em] text-brown hover:bg-tan/30 transition-colors"
            onClick={() => setOpen(false)}
          >
            DESCARGAR CSV
          </a>
          <a
            href="/api/admin/export?format=pdf"
            className="block px-4 py-3 text-xs tracking-[0.12em] text-brown hover:bg-tan/30 transition-colors border-t border-tan/60"
            onClick={() => setOpen(false)}
          >
            DESCARGAR PDF
          </a>
        </div>
      )}
    </div>
  );
}
