"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

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
  const { signOut } = useClerk();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

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

      {/* User info + sign out */}
      <div className="px-5 py-5 border-t border-tan">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <Image src="/images/admin.png" alt={adminName} width={32} height={32} className="object-cover w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs tracking-[0.12em] text-muted-foreground">ADMINISTRADOR</p>
            <p className="text-xs text-brown mt-0.5 truncate">{adminName}</p>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            title="Cerrar sesión"
            className="shrink-0 text-muted-foreground hover:text-terracotta transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
              <path d="M11 11l3-3-3-3" />
              <line x1="14" y1="8" x2="6" y2="8" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
