import Image from "next/image";
import Link from "next/link";

const releases = [
  {
    src: "/images/coffee-bag.jpg",
    alt: "Café de origen",
    href: "/edicion-limitada?tab=cafe",
  },
  {
    src: "/images/green-tea.jpg",
    alt: "Té verde",
    href: "/edicion-limitada?tab=infusiones",
  },
  {
    src: "/images/brewing-setup.jpg",
    alt: "Set de preparación",
    href: "/edicion-limitada?tab=accesorios",
  },
];

export default function EdicionLimitada() {
  return (
    <section className="w-full py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/edicion-limitada"
            className="font-serif text-3xl lg:text-4xl text-brown hover:opacity-70 transition-opacity"
          >
            Edición Limitada
          </Link>
          <p className="text-xs tracking-[0.15em] text-muted-foreground">TEMPORADA 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {releases.map((item) => (
            <Link
              key={item.src}
              href={item.href}
              className="group relative aspect-3/4 overflow-hidden bg-tan block"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
