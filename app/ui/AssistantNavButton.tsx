"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AssistantNavButton({ className }: { className?: string }) {
  const pathname = usePathname();
  const isActive = pathname === "/assistant";

  return (
    <Link
      href="/assistant"
      aria-label="Asistente Virtual"
      className={`flex items-center leading-none transition-colors hover:text-olive ${className ?? ""}`}
    >
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isActive ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4" strokeWidth={1.5} stroke="currentColor" />
        <path d="M22 5h-4" strokeWidth={1.5} stroke="currentColor" />
        <path d="M4 17v2" strokeWidth={1.5} stroke="currentColor" />
        <path d="M5 18H3" strokeWidth={1.5} stroke="currentColor" />
      </svg>
    </Link>
  );
}
