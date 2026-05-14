import Link from "next/link";

const footerLinks = {
  shop: {
    title: "TIENDA",
    links: [
      { label: "Café", href: "/?query=caf%C3%A9" },
      { label: "Infusiones", href: "/?query=infusiones" },
      { label: "Accesorios", href: "/?query=mates" },
    ],
  },
  info: {
    title: "INFORMACIÓN",
    links: [
      { label: "Política de envíos", href: "/" },
      { label: "Devoluciones", href: "/" },
      { label: "Contacto", href: "/" },
    ],
  },
  account: {
    title: "MI CUENTA",
    links: [
      { label: "Mis pedidos", href: "/orders" },
      { label: "Carrito", href: "/cart" },
      { label: "Favoritos", href: "/favourites" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="w-full bg-cream border-t border-tan py-16 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="font-serif text-2xl lg:text-3xl text-brown">
              Infusio
            </Link>
            <p className="mt-6 text-sm italic text-muted-foreground max-w-xs leading-relaxed">
              Uniendo a los productores artesanales con quienes buscan el ritual perfecto.
            </p>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <p className="text-xs tracking-[0.15em] text-brown font-medium mb-6">
                {section.title}
              </p>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-brown transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-tan">
          <p className="text-xs text-muted-foreground tracking-widest">
            © {new Date().getFullYear()} INFUSIO. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
}
