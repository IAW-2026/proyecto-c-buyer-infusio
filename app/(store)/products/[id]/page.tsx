import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductById } from "@/app/lib/services/externalApis";
import type { SellerProduct } from "@/app/lib/services/externalApis";
import AddToCartControls from "@/app/ui/AddToCartControls";
import AccessoryDetailLayout from "@/app/ui/AccessoryDetailLayout";
import SensoryChart from "@/app/ui/SensoryChart";
import { getAccessoryRitual } from "@/app/lib/gemini";

interface PageProps {
  params: Promise<{ id: string }>;
}

type Accent = "olive" | "terracotta";

function isAccessory(categories: string[]): boolean {
  const c = categories.join(" ").toLowerCase();
  return ["mates", "bombilla", "termo", "accesorio", "combo", "máquina", "maquina"].some((k) =>
    c.includes(k)
  );
}

function getAccent(categories: string[]): Accent {
  const all = categories.join(" ").toLowerCase();
  if (all.includes("café") || all.includes("cafe") || all.includes("coffee")) return "terracotta";
  return "olive";
}

function getSensoryTags(product: SellerProduct): string[] {
  const cats = product.categories.join(" ").toLowerCase();
  if (cats.includes("café") || cats.includes("cafe")) return ["CHOCOLATE", "FRUTOS SECOS", "CARAMELO", "ACIDEZ"];
  if (cats.includes("yerba")) return ["HIERBA", "TERROSO", "FRESCO", "EQUILIBRADO"];
  if (cats.includes("tereré")) return ["CÍTRICO", "FRESCO", "HERBAL", "REFRESCANTE"];
  if (cats.includes("té") || cats.includes("te")) return ["FLORAL", "HERBÁCEO", "SUAVE", "ANTIOXIDANTE"];
  return ["ARTESANAL", "AUTÉNTICO", "NATURAL"];
}

function getMapUrl(location?: string): string {
  const BASE = "https://api.maptiler.com/maps/019dd957-b0d1-7513-b4d6-057a16743b1b/?key=ug3rGSABewk6deNe9A35";
  const loc = location?.toLowerCase() ?? "";

  if (loc.includes("corrientes"))                                    return `${BASE}#7/-27.5/-58.8`;
  if (loc.includes("entre r"))                                       return `${BASE}#7/-32.0/-60.0`;
  if (loc.includes("misiones"))                                      return `${BASE}#7/-27.4/-55.9`;
  if (loc.includes("ciudad autónoma") || loc.includes("caba"))      return `${BASE}#11/-34.6/-58.4`;
  if (loc.includes("buenos aires"))                                  return `${BASE}#7/-34.6/-59.0`;
  if (loc.includes("argentina"))                                     return `${BASE}#4/-34.0/-64.0`;
  if (loc.includes("minas gerais"))                                  return `${BASE}#6/-19.9/-43.9`;
  if (loc.includes("brasil") || loc.includes("brazil"))             return `${BASE}#4/-14.2/-51.9`;
  if (loc.includes("etio"))                                          return `${BASE}#5/9.1/40.5`;

  return `${BASE}#4/-34.0/-64.0`;
}

function getBrewingInfo(product: SellerProduct): { method: string; ratio: string; temp: string } {
  const cats = product.categories.join(" ").toLowerCase();
  if (cats.includes("café") || cats.includes("cafe")) {
    return { method: "ESPRESSO / POUR OVER", ratio: "1:15 CAFÉ / AGUA", temp: "92–96 °C" };
  }
  if (cats.includes("tereré")) {
    return { method: "TERERÉ FRÍO", ratio: "LLENO 3/4", temp: "AGUA FRÍA" };
  }
  if (cats.includes("yerba") || cats.includes("mate")) {
    return { method: "MATE TRADICIONAL", ratio: "LLENO 3/4", temp: "70–75 °C" };
  }
  if (cats.includes("té") || cats.includes("te")) {
    return { method: "INFUSIÓN EN TAZA", ratio: "1 SAQUITO / 250 ML", temp: "80–90 °C" };
  }
  return { method: "—", ratio: "—", temp: "—" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getProductById(id).catch(() => null);
  if (!result) notFound();
  const product = result as SellerProduct;

  const accent = getAccent(product.categories);

  if (isAccessory(product.categories)) {
    const ritual = await getAccessoryRitual({
      name: product.name,
      categories: product.categories,
      materials: product.specs?.materials,
    }).catch(() => null);
    return <AccessoryDetailLayout product={product} ritual={ritual} accent="slate" />;
  }

  const accentText = accent === "terracotta" ? "text-terracotta" : "text-olive";
  const isOutOfStock = product.stock === 0;
  const sensoryTags = getSensoryTags(product);
  const brewing = getBrewingInfo(product);
  const price = product.price.toLocaleString("es-AR");
  const mapSrc = getMapUrl(product.location);
  const label = [product.categories[0]?.toUpperCase(), product.location?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Hero */}
      <div className="relative w-full min-h-[60vh] lg:min-h-[70vh] overflow-hidden bg-tan">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-tan" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-brown/80 via-brown/30 to-transparent" />
        <div className="absolute bottom-0 left-0 px-6 pb-10 lg:px-12 lg:pb-14">
          <p className={`text-xs tracking-[0.2em] mb-3 ${accentText}`}>{label}</p>
          <h1 className="font-serif text-4xl lg:text-6xl text-cream leading-tight max-w-2xl">
            {product.name}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-350 mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-x-16 lg:items-start">

          {/* Left: scrollable sections */}
          <div className="space-y-16 lg:space-y-20">

            {/* Perfil Sensorial */}
            <section>
              <p className={`text-xs tracking-[0.2em] mb-4 ${accentText}`}>PERFIL SENSORIAL</p>
              <h2 className="font-serif text-3xl text-brown mb-4">Complejidad y Carácter</h2>
              <p className="text-sm italic text-muted-foreground leading-relaxed mb-6">
                {product.description ?? "Un perfil sensorial único que combina notas naturales con el proceso artesanal de elaboración."}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                {sensoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs tracking-[0.15em] text-brown border border-tan px-4 py-2"
                  >
                    • {tag}
                  </span>
                ))}
              </div>
              <div className="w-full max-w-xs mx-auto py-4">
                <SensoryChart tags={sensoryTags} accent={accent} productId={product.id} />
              </div>
            </section>

            {/* El Origen */}
            <section>
              <p className={`text-xs tracking-[0.2em] mb-4 ${accentText}`}>EL ORIGEN</p>
              <h2 className="font-serif text-3xl text-brown mb-4">
                {product.location ?? "Origen Local"}
              </h2>
              <p className="text-sm italic text-muted-foreground leading-relaxed mb-8">
                Cada producto lleva consigo la historia y tradición de su lugar de origen,
                preservando métodos artesanales que definen su carácter único. Trabajamos
                directamente con productores que comparten nuestra pasión por la calidad.
              </p>
              <div className="relative w-full aspect-video overflow-hidden border border-tan">
                <iframe
                  src={mapSrc}
                  title={`Mapa de origen: ${product.location ?? "desconocido"}`}
                  allow="geolocation"
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
                  <svg
                    className={`w-8 h-10 drop-shadow-md ${accentText}`}
                    viewBox="0 0 32 40"
                    fill="currentColor"
                  >
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24S32 27 32 16C32 7.163 24.837 0 16 0z" />
                    <circle cx="16" cy="15" r="5.5" fill="white" fillOpacity="0.9" />
                  </svg>
                </div>
              </div>
            </section>

            {/* Preparación */}
            <section>
              <p className={`text-xs tracking-[0.2em] mb-4 ${accentText}`}>PREPARACIÓN</p>
              <h2 className="font-serif text-3xl text-brown mb-8">Recomendaciones</h2>
              <div className="grid grid-cols-3 gap-px bg-tan">
                {[
                  { label: "MÉTODO", value: brewing.method },
                  { label: "PROPORCIÓN", value: brewing.ratio },
                  { label: "TEMPERATURA", value: brewing.temp },
                ].map(({ label: l, value: v }) => (
                  <div key={l} className="bg-cream px-4 py-6 text-center">
                    <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">{l}</p>
                    <p className="font-serif text-sm text-brown leading-snug">{v}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right: sticky purchase panel */}
          <aside className="mt-12 lg:mt-0 lg:sticky lg:top-24">
            <div className="border border-tan">

              {/* Unit + price */}
              <div className="flex items-baseline justify-between px-6 py-5 border-b border-tan">
                <p className="text-xs tracking-[0.15em] text-muted-foreground">
                  {product.unit ?? "UNIDAD"}
                </p>
                <p className={`font-serif text-2xl ${accentText}`}>$ {price}</p>
              </div>

              {/* Quantity + add to cart */}
              <div className="px-6 py-6 border-b border-tan">
                <p className="text-xs tracking-[0.15em] text-muted-foreground mb-3">CANTIDAD</p>
                <AddToCartControls
                  productId={product.id}
                  productName={product.name}
                  productVariant={product.unit ?? undefined}
                  productImageUrl={product.imageUrl ?? undefined}
                  priceAtTime={product.price}
                  isOutOfStock={isOutOfStock}
                  accent={accent}
                />
              </div>

              {/* Metadata */}
              {[
                {
                  key: "CATEGORÍA",
                  value: (() => { const c = product.categories[0] ?? ""; return c ? c.charAt(0).toUpperCase() + c.slice(1) : "—"; })(),
                },
                { key: "ORIGEN", value: product.location ?? "—" },
                {
                  key: "STOCK",
                  value: isOutOfStock ? "Sin stock" : `${product.stock} disponibles`,
                },
              ].map(({ key, value }, i, arr) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-6 py-3 ${i < arr.length - 1 ? "border-b border-tan" : ""}`}
                >
                  <p className="text-xs tracking-[0.15em] text-muted-foreground">{key}</p>
                  <p className="font-serif text-sm text-brown">{value}</p>
                </div>
              ))}

            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
