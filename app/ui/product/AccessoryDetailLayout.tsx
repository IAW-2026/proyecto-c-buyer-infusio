import Image from "next/image";
import ScrollToTop from "@/app/ui/ScrollToTop";
import AccessoryPurchasePanel from "./AccessoryPurchasePanel";
import type { SellerProduct } from "@/app/lib/services/externalApis";

interface Props {
  product: SellerProduct;
  ritual: string | null;
  accent: "olive" | "terracotta" | "slate";
}

export default function AccessoryDetailLayout({ product, ritual, accent }: Props) {
  const accentText =
    accent === "terracotta" ? "text-terracotta" :
    accent === "slate"      ? "text-[#7A6B77]"  :
    "text-olive";

  const isOutOfStock = product.stock === 0;
  const price = product.price.toLocaleString("es-AR");
  const specs = product.specs;
  const label = [product.categories[0]?.toUpperCase(), product.location?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

  const dimRows = [
    { label: "ALTURA",    value: specs?.dimensions?.height },
    { label: "DIÁMETRO",  value: specs?.dimensions?.diameter },
    { label: "LONGITUD",  value: specs?.dimensions?.length },
    { label: "ANCHO",     value: specs?.dimensions?.width },
    { label: "PESO",      value: specs?.dimensions?.weight },
    { label: "CAPACIDAD", value: specs?.capacity },
  ].filter((r): r is { label: string; value: string } => !!r.value);

  const dimGridCls =
    dimRows.length === 1 ? "grid-cols-1" :
    dimRows.length === 2 ? "grid-cols-2" :
    "grid-cols-2 lg:grid-cols-3";

  const cat = product.categories[0] ?? "";
  const metaRows = (
    [
      { key: "CATEGORÍA", value: cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "—" },
      product.location ? { key: "ORIGEN", value: product.location } : null,
      { key: "STOCK", value: isOutOfStock ? "Sin stock" : `${product.stock} disponibles` },
    ] as ({ key: string; value: string } | null)[]
  ).filter(Boolean) as { key: string; value: string }[];

  const hasSpecs = dimRows.length > 0 || !!specs?.materials || !!specs?.care;

  return (
    <>
      <ScrollToTop />

      {/* Main: 50/50 split */}
      <div className="max-w-350 mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">

          {/* Left: square product image */}
          <div className="relative aspect-square w-full overflow-hidden bg-tan/30">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 bg-tan/40 flex items-center justify-center">
                <p className="text-xs tracking-[0.15em] text-muted-foreground">INFUSIO</p>
              </div>
            )}
          </div>

          {/* Right: sticky panel */}
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
            <div className="border border-[#DFD9DE]">

              {/* Name + description + price */}
              <div className="px-6 pt-6 pb-5 border-b border-[#DFD9DE]">
                {label && (
                  <p className={`text-xs tracking-[0.2em] mb-3 ${accentText}`}>{label}</p>
                )}
                <h1 className="font-serif text-3xl lg:text-4xl text-brown leading-tight mb-3">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-sm text-brown/70 leading-relaxed mb-4">
                    {product.description}
                  </p>
                )}
                <p className={`font-serif text-2xl ${accentText}`}>$ {price}</p>
              </div>

              {/* Color swatches + add-to-cart */}
              <AccessoryPurchasePanel
                productId={product.id}
                productName={product.name}
                priceAtTime={product.price}
                productImageUrl={product.imageUrl ?? undefined}
                isOutOfStock={isOutOfStock}
                accent={accent}
                colors={product.colors ?? []}
                unit={product.unit}
              />

              {/* Metadata */}
              <div className="border-t border-[#DFD9DE]">
                {metaRows.map((row, i) => (
                  <div
                    key={row.key}
                    className={`flex items-center justify-between px-6 py-3 ${
                      i < metaRows.length - 1 ? "border-b border-[#DFD9DE]" : ""
                    }`}
                  >
                    <p className="text-xs tracking-[0.15em] text-muted-foreground">{row.key}</p>
                    <p className="font-serif text-sm text-brown">{row.value}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Specs section ────────────────────────────────────────────────── */}
      {hasSpecs && (
        <div className="border-t border-tan">
          <div className="max-w-350 mx-auto px-6 lg:px-12 py-16 lg:py-20">

            {/* Section header */}
            <div className="flex items-end justify-between pb-10 border-b border-tan/60 mb-12">
              <div>
                <p className={`text-xs tracking-[0.2em] mb-4 ${accentText}`}>ESPECIFICACIONES</p>
                <h2 className="font-serif text-4xl lg:text-5xl text-brown leading-none">
                  Ficha Técnica
                </h2>
              </div>
              <p className="hidden lg:block font-serif text-base text-muted-foreground italic pb-1">
                Hecho para durar.
              </p>
            </div>

            {/* Dimensional tiles — large serif values */}
            {dimRows.length > 0 && (
              <div className={`grid gap-px bg-tan/40 mb-12 ${dimGridCls}`}>
                {dimRows.map(({ label: l, value: v }) => (
                  <div key={l} className="bg-cream px-6 py-8">
                    <p className="text-xs tracking-[0.2em] text-muted-foreground mb-3">{l}</p>
                    <p className="font-serif text-3xl text-brown">{v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Materials + care — horizontal key/value rows */}
            {(specs?.materials || specs?.care) && (
              <div className={`grid gap-12 ${specs?.materials && specs?.care ? "lg:grid-cols-2" : ""}`}>

                {specs?.materials && (
                  <div>
                    <p className={`text-xs tracking-[0.2em] mb-6 ${accentText}`}>
                      MATERIALES Y CONSTRUCCIÓN
                    </p>
                    <p className="font-serif text-lg text-brown/80 leading-relaxed">
                      {specs.materials}
                    </p>
                  </div>
                )}

                {specs?.care && (
                  <div>
                    <p className={`text-xs tracking-[0.2em] mb-6 ${accentText}`}>
                      CUIDADO Y MANTENIMIENTO
                    </p>
                    <p className="font-serif text-lg text-brown/80 leading-relaxed">
                      {specs.care}
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Gemini ritual ────────────────────────────────────────────────── */}
      {ritual && (
        <div className="border-t border-tan bg-tan/20">
          <div className="max-w-350 mx-auto px-6 lg:px-12 py-12 lg:py-16 text-center">
            <p className={`text-xs tracking-[0.2em] mb-6 ${accentText}`}>EL RITUAL</p>
            <p className="font-serif text-lg lg:text-xl text-brown max-w-2xl mx-auto leading-relaxed italic">
              {ritual}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
