"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AdminSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const qs = value ? `?query=${encodeURIComponent(value)}` : "";
      router.replace(`${pathname}${qs}`);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [value, pathname, router]);

  return (
    <div className="flex items-center gap-2 bg-tan/50 border border-tan rounded-full px-4 py-2">
      <svg
        width="14" height="14" viewBox="0 0 16 16"
        fill="none" stroke="currentColor" strokeWidth="1.5"
        className="text-muted-foreground shrink-0"
      >
        <circle cx="7" cy="7" r="5" />
        <line x1="11" y1="11" x2="15" y2="15" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar órdenes, clientes..."
        className="bg-transparent text-xs text-brown placeholder:text-muted-foreground outline-none w-52"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="text-muted-foreground hover:text-brown transition-colors leading-none"
          aria-label="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}
