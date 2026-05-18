import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/app/lib/prisma";
import type { FavouriteItem } from "@/app/ui/favourites/FavouritesContext";

export const metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

const CupPlaceholder = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <svg className="h-16 w-16 opacity-[0.18] text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}>
      <path d="M8 5c-.6-.6-.6-1.4 0-2" />
      <path d="M12 5c-.6-.6-.6-1.4 0-2" />
      <path d="M4 7h13v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
      <path d="M17 10h1.5a2 2 0 010 4H17" />
      <line x1="2" y1="20" x2="20" y2="20" />
    </svg>
  </div>
);

const CoffeeBeanWatermark = () => (
  <svg
    viewBox="0 0 200 260"
    className="absolute inset-0 w-full h-full"
    fill="none"
    aria-hidden
  >
    <ellipse cx="100" cy="130" rx="78" ry="110" fill="currentColor" />
    <path
      d="M100 22 C72 60 72 100 100 130 C128 160 128 200 100 238"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default async function FavouriteSharePage({ params }: PageProps) {
  const { token } = await params;

  const share = await db.favouriteShare.findUnique({ where: { id: token } });
  if (!share) notFound();

  const items = share.items as unknown as FavouriteItem[];
  const user = await db.user.findUnique({ where: { id: share.userId } });
  const firstName = user?.name ?? "Alguien";

  return (
    <section className="py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">

        {/* Header */}
        <div className="relative pt-20 lg:pt-16 pb-28 text-center overflow-hidden">
          {/* Coffee bean watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-96 text-brown opacity-[0.055]">
              <CoffeeBeanWatermark />
            </div>
          </div>

          <p className="relative text-xs tracking-[0.25em] text-[#8B9A8B] mb-6">COMPARTIENDO GUSTOS</p>
          <h1 className="relative font-serif text-5xl lg:text-7xl text-brown mb-6 leading-tight">
            Los Favoritos de {firstName}
          </h1>
          <p className="relative text-sm italic text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Descubrí una selección curada de esenciales para el vivir lento y cafés de especialidad,
            elegidos a mano para tu ritual diario.
          </p>
        </div>

        <div className="border-t border-tan" />

        {items.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-serif text-3xl text-brown mb-4">Colección vacía</p>
          </div>
        ) : (
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item.productId} className="flex flex-col">
                  <div className="relative aspect-3/4 overflow-hidden bg-tan flex-shrink-0">
                    <Link href={`/products/${item.productId}`} tabIndex={-1} aria-hidden>
                      {item.productImageUrl ? (
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <CupPlaceholder />
                      )}
                    </Link>
                  </div>
                  <div className="pt-4 flex flex-col flex-1">
                    <div className="flex items-baseline justify-between mb-3">
                      <p className="text-xs tracking-[0.15em] text-[#8B9A8B]">
                        {(item.location ?? item.categories[0] ?? "").toUpperCase()}
                      </p>
                      <p className="text-sm font-medium text-[#8B9A8B]">
                        $ {item.price.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <Link href={`/products/${item.productId}`}>
                      <h2 className="font-serif text-xl text-brown leading-snug line-clamp-2 min-h-[3.5rem] hover:opacity-70 transition-opacity">
                        {item.productName}
                      </h2>
                    </Link>
                    {item.description && (
                      <p className="mt-2 text-sm italic text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Glass CTA */}
            <style>{`
              .glass-btn {
                background: linear-gradient(135deg, rgba(161,120,73,0.13) 0%, rgba(139,90,43,0.06) 50%, rgba(161,120,73,0.13) 100%);
                border: 1px solid rgba(139,90,43,0.18);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(139,90,43,0.08), 0 2px 16px rgba(139,90,43,0.07);
                backdrop-filter: blur(6px);
                transition: all 0.2s ease;
              }
              .glass-btn:hover {
                background: linear-gradient(135deg, rgba(161,120,73,0.28) 0%, rgba(139,90,43,0.18) 50%, rgba(161,120,73,0.28) 100%);
                border-color: rgba(139,90,43,0.35);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(139,90,43,0.15), 0 4px 20px rgba(139,90,43,0.13);
              }
            `}</style>
            <div className="mt-24 flex justify-center">
              <Link href="/" className="glass-btn text-xs tracking-[0.15em] text-brown px-10 py-4 rounded-full">
                EXPLORÁ EL CATÁLOGO →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
