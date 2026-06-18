import Link from "next/link";
import Image from "next/image";
import type { SellerProduct } from "@/app/lib/services/externalApis";
import AddToCartControls from "@/app/ui/cart/AddToCartControls";
import FavouriteButton from "@/app/ui/favourites/FavouriteButton";

interface ProductCardProps {
  product: SellerProduct;
}

type Accent = "olive" | "terracotta" | "slate";

function getAccent(categories: string[]): Accent {
  const all = categories.join(" ").toLowerCase();
  if (["mates", "bombilla", "termo", "accesorio", "máquina", "maquina"].some((k) => all.includes(k))) return "slate";
  if (all.includes("café") || all.includes("cafe") || all.includes("coffee")) return "terracotta";
  return "olive";
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = product.price.toLocaleString("es-AR");
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const accent = getAccent(product.categories);
  const accentClass =
    accent === "terracotta" ? "text-terracotta" :
    accent === "slate"      ? "text-[#7A3B54]"  :
    "text-olive";
  const label = product.location ?? product.categories[0]?.toUpperCase() ?? "";

  return (
    <article className="flex flex-col">
      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-tan flex-shrink-0">
        <Link href={`/products/${product.id}`} tabIndex={-1} aria-hidden>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-16 w-16 opacity-[0.18] text-brown"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.8}
              >
                {/* steam */}
                <path d="M8 5c-.6-.6-.6-1.4 0-2" />
                <path d="M12 5c-.6-.6-.6-1.4 0-2" />
                {/* mug body */}
                <path d="M4 7h13v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                {/* handle */}
                <path d="M17 10h1.5a2 2 0 010 4H17" />
                {/* saucer */}
                <line x1="2" y1="20" x2="20" y2="20" />
              </svg>
            </div>
          )}
        </Link>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-brown/30 flex items-center justify-center pointer-events-none">
            <span className="px-4 py-1 text-xs tracking-[0.15em] text-cream border border-cream">
              SIN STOCK
            </span>
          </div>
        )}
        {isLowStock && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs tracking-widest text-cream bg-terracotta rounded-full">
            ÚLTIMAS {product.stock}
          </span>
        )}
        <div className="absolute top-3 right-3">
          <FavouriteButton
            product={{
              productId: product.id,
              productName: product.name,
              productImageUrl: product.imageUrl ?? null,
              price: Number(product.price),
              location: product.location ?? null,
              categories: product.categories,
              description: product.description ?? null,
            }}
          />
        </div>
      </div>

      {/* Info — flex column so the button is always pushed to the bottom */}
      <div className="pt-4 flex flex-col flex-1">
        {/* Row 1: origin + price / unit */}
        <div className="flex items-baseline justify-between mb-3">
          <p className={`text-xs tracking-[0.15em] ${accentClass}`}>
            {label.toUpperCase()}
          </p>
          <p className={`text-sm font-medium ${accentClass}`}>
            $ {price}{product.unit && accent !== "slate" && product.unit.toUpperCase() !== "SET COMPLETO" ? ` / ${product.unit}` : ""}
          </p>
        </div>

        {/* Row 2: product name — always 2 lines */}
        <Link href={`/products/${product.id}`}>
          <h2 className="font-serif text-xl text-brown leading-snug line-clamp-2 min-h-[3.5rem] hover:opacity-70 transition-opacity">
            {product.name}
          </h2>
        </Link>

        {/* Row 3: description — always 2 lines */}
        <p className="mt-2 text-sm italic text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.625rem]">
          {product.description ?? ""}
        </p>

        {/* Row 4: controls — pushed to bottom */}
        <div className="mt-auto pt-4">
          <AddToCartControls
            productId={product.id}
            sellerId={product.sellerId}
            productName={product.name}
            productImageUrl={product.imageUrl ?? undefined}
            priceAtTime={product.price}
            isOutOfStock={isOutOfStock}
            accent={accent}
          />
        </div>
      </div>
    </article>
  );
}
