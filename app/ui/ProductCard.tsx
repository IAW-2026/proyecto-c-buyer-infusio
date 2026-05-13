import Link from "next/link";
import Image from "next/image";
import type { SellerProduct } from "@/app/lib/services/externalApis";
import AddToCartControls from "./AddToCartControls";

interface ProductCardProps {
  product: SellerProduct;
}

type Accent = "olive" | "terracotta" | "slate";

function getAccent(categories: string[]): Accent {
  const all = categories.join(" ").toLowerCase();
  if (["mates", "bombilla", "termo", "accesorio", "combo", "máquina", "maquina"].some((k) => all.includes(k))) return "slate";
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
    accent === "slate"      ? "text-[#7A6B77]"  :
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
              <svg className="h-12 w-12 opacity-20 text-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
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
          <span className="absolute top-3 right-3 px-3 py-1 text-xs tracking-widest text-cream bg-terracotta rounded-full">
            ÚLTIMAS {product.stock}
          </span>
        )}
      </div>

      {/* Info — flex column so the button is always pushed to the bottom */}
      <div className="pt-4 flex flex-col flex-1">
        {/* Row 1: origin + price / unit */}
        <div className="flex items-baseline justify-between mb-3">
          <p className={`text-xs tracking-[0.15em] ${accentClass}`}>
            {label.toUpperCase()}
          </p>
          <p className={`text-sm font-medium ${accentClass}`}>
            $ {price}{product.unit ? ` / ${product.unit}` : ""}
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
