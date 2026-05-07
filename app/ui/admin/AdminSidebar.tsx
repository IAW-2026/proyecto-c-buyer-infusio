"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  adminName: string;
}

const NAV = [
  {
    label: "PANEL DE CONTROL",
    href: "/admin",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: "COMPRAS",
    href: "/admin/purchases",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="1" width="12" height="14" rx="1" />
        <line x1="5" y1="5" x2="11" y2="5" />
        <line x1="5" y1="8" x2="11" y2="8" />
        <line x1="5" y1="11" x2="8" y2="11" />
      </svg>
    ),
  },
  {
    label: "VENDEDORES",
    href: "/admin/vendors",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 6l2-4h10l2 4" />
        <rect x="1" y="6" width="14" height="9" rx="1" />
        <path d="M6 15V10h4v5" />
      </svg>
    ),
  },
  {
    label: "USUARIOS",
    href: "/admin/users",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" />
      </svg>
    ),
  },
  {
    label: "ESTADÍSTICAS",
    href: "/admin/analytics",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 8L8 3" />
        <path d="M8 8L12 11" />
      </svg>
    ),
  },
];

export default function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed top-0 left-0 h-screen w-65 bg-cream border-r border-tan flex flex-col z-40">
      {/* Logo */}
      <div className="px-8 py-7 border-b border-tan">
        <span className="font-serif font-semibold text-xl text-brown">Infusio</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-5 py-6 space-y-1">
        {NAV.map(({ label, href, exact, icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs tracking-[0.12em] transition-colors ${
                active
                  ? "text-terracotta"
                  : "text-muted-foreground hover:text-brown"
              }`}
            >
              <span className={active ? "text-terracotta" : "text-muted-foreground"}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-8 py-6 border-t border-tan flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-tan flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-brown">{initials}</span>
        </div>
        <div>
          <p className="text-xs tracking-[0.12em] text-muted-foreground">ADMINISTRADOR</p>
          <p className="text-xs text-brown mt-0.5">{adminName}</p>
        </div>
      </div>
    </aside>
  );
}
