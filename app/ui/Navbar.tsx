import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { AuthButtons } from "./AuthButtons";
import CartNavButton from "./CartNavButton";
import MobileNav from "./MobileNav";

const navLinks = [
  { href: "/?query=cafe", label: "CAFÉ" },
  { href: "/?query=infusiones", label: "INFUSIONES" },
  { href: "/?query=accesorios", label: "ACCESORIOS" },
  { href: "/?query=maquinas", label: "MÁQUINAS" },
];

const linkClass = "text-xs tracking-[0.15em] text-brown hover:text-olive transition-colors";
const mobileLinkClass = "text-sm tracking-[0.15em] text-brown hover:text-olive transition-colors";

export default async function Navbar() {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch {
    // middleware not yet active (e.g. cold start) — degrade gracefully
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-cream border-b border-tan">
      <div className="relative max-w-350 mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 font-serif font-semibold text-2xl lg:text-3xl text-brown"
            aria-label="Infusio — Home"
          >
            Infusio
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Categorías">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {userId && (
              <Link href="/orders" className={linkClass}>PEDIDOS</Link>
            )}
            <CartNavButton userId={userId} className={linkClass} />
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex shrink-0 items-center gap-3">
            <AuthButtons isSignedIn={!!userId} />
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center lg:hidden">
            <MobileNav>
              <nav className="flex flex-col gap-4 mb-4" aria-label="Categorías">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={mobileLinkClass}>
                    {link.label}
                  </Link>
                ))}
                {userId && (
                  <Link href="/orders" className={mobileLinkClass}>PEDIDOS</Link>
                )}
                <CartNavButton userId={userId} className={mobileLinkClass} />
              </nav>
              <div className="flex gap-3 pt-4 border-t border-tan">
                <AuthButtons isSignedIn={!!userId} mobile />
              </div>
            </MobileNav>
          </div>
        </div>
      </div>
    </header>
  );
}
