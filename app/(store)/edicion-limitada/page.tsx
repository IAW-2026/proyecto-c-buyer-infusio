import Link from "next/link";
import { getProducts } from "@/app/lib/services/externalApis";
import type { SellerProduct } from "@/app/lib/services/externalApis";
import ProductCard from "@/app/ui/ProductCard";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { label: "TODAS",              value: undefined    },
  { label: "CAFÉ DE ORIGEN",     value: "cafe"       },
  { label: "TÉ ARTESANAL",       value: "infusiones" },
  { label: "ACCESORIOS Y MÁQUINAS",value: "accesorios" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function tabHref(value: TabValue) {
  return value ? `/edicion-limitada?tab=${value}` : "/edicion-limitada";
}

function matchesTab(product: SellerProduct, tab: TabValue): boolean {
  if (!tab) return true;
  const cats = product.categories.join(" ").toLowerCase();
  if (tab === "cafe")       return cats.includes("café") || cats.includes("cafe") || cats.includes("coffee");
  if (tab === "infusiones") return cats.includes("yerba") || cats.includes("té") || cats.includes("tereré") || cats.includes("infusion");
  if (tab === "accesorios") return cats.includes("mates") || cats.includes("bombilla") || cats.includes("termo") || cats.includes("accesorio") || cats.includes("combo") || cats.includes("máquina") || cats.includes("maquina");
  return true;
}

export default async function EdicionLimitadaPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab: TabValue =
    tab === "cafe" || tab === "infusiones" || tab === "accesorios" ? tab : undefined;

  let allProducts: SellerProduct[] = [];
  try {
    allProducts = await getProducts();
  } catch {
    // Seller API unreachable — show empty state
  }

  const limited = allProducts
    .filter((p) => p.isLimitedEdition)
    .filter((p) => matchesTab(p, activeTab));

  return (
    <>
      {/* Header */}
      <div className="pt-20 lg:pt-28 pb-12 px-6 text-center border-b border-tan">
        <p className="text-xs tracking-[0.25em] text-terracotta italic mb-6">
          SEASONAL LIMITED EDITIONS
        </p>
        <h1 className="font-serif text-6xl lg:text-7xl text-brown mb-8">Cosechas Raras</h1>
        <p className="text-sm italic text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Una selección de nuestros lotes más exclusivos, cosechados una vez al año
          en el pico de su perfil sensorial.
        </p>
      </div>

      {/* Filter tabs — centered, terracotta underline on active */}
      <div>
        <nav className="flex justify-center gap-8 lg:gap-12 overflow-x-auto px-6">
          {TABS.map(({ label, value }) => {
            const isActive = activeTab === value;
            return (
              <Link
                key={label}
                href={tabHref(value)}
                className={`py-5 text-xs tracking-[0.15em] whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-terracotta text-brown"
                    : "border-transparent text-muted-foreground hover:text-brown"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Products */}
      <section className="max-w-350 mx-auto px-6 lg:px-12 py-12 lg:py-20">
        {limited.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-brown mb-3">Nada por aquí todavía</p>
            <p className="text-sm italic text-muted-foreground">
              No hay ediciones limitadas
              {activeTab ? ` en esta categoría` : ""} activas en este momento.
              <br />Volvé pronto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-16">
            {limited.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
