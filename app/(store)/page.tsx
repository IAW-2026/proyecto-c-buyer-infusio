import { getProducts, type SellerProduct } from "@/app/lib/services/externalApis";
import ProductCard from "@/app/ui/ProductCard";
import Pagination from "@/app/ui/Pagination";
import MorningRitual from "@/app/ui/sections/MorningRitual";
import FeatureCards from "@/app/ui/sections/FeatureCards";
import HeroSection from "@/app/ui/sections/HeroSection";
import EdicionLimitada from "@/app/ui/sections/EdicionLimitada";
import FilterSidebar, { type FilterGroup } from "@/app/ui/FilterSidebar";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    origins?: string;
    types?: string;
    priceRange?: string;
  }>;
}

const DISPLAY_LABELS: Record<string, string> = {
  cafe: "Café",
  maquinas: "Máquinas",
  tes: "Tés",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Price buckets per section type
type PriceBucket = { label: string; value: string; lo: number; hi: number };

function getPriceBuckets(q: string): PriceBucket[] {
  const n = normalize(q);
  if (n.includes("maquina")) return [
    { label: "$0 — $20.000",    value: "0-20000",    lo: 0,     hi: 20000 },
    { label: "$20.000 — $50.000", value: "20000-50000", lo: 20000, hi: 50000 },
    { label: "$50.000+",         value: "50000+",     lo: 50000, hi: Infinity },
  ];
  if (["accesorio", "mate", "termo", "bombilla"].some((k) => n.includes(k))) return [
    { label: "$0 — $5.000",     value: "0-5000",     lo: 0,    hi: 5000 },
    { label: "$5.000 — $15.000", value: "5000-15000", lo: 5000, hi: 15000 },
    { label: "$15.000+",         value: "15000+",     lo: 15000, hi: Infinity },
  ];
  if (n.includes("cafe")) return [
    { label: "$0 — $3.000",     value: "0-3000",    lo: 0,    hi: 3000 },
    { label: "$3.000 — $6.000", value: "3000-6000", lo: 3000, hi: 6000 },
    { label: "$6.000+",         value: "6000+",     lo: 6000, hi: Infinity },
  ];
  // infusiones / yerba / té default
  return [
    { label: "$0 — $2.000",     value: "0-2000",    lo: 0,    hi: 2000 },
    { label: "$2.000 — $4.000", value: "2000-4000", lo: 2000, hi: 4000 },
    { label: "$4.000+",         value: "4000+",     lo: 4000, hi: Infinity },
  ];
}

function parsePriceRange(value: string): [number, number] {
  if (value.endsWith("+")) return [parseInt(value), Infinity];
  const [lo, hi] = value.split("-").map(Number);
  return [lo, hi];
}

function getQueryAccent(q: string): "terracotta" | "olive" | "slate" {
  const n = normalize(q);
  if (n.includes("cafe")) return "terracotta";
  if (["maquina", "accesorio", "mate", "termo", "bombilla"].some((k) => n.includes(k))) return "slate";
  return "olive";
}

function buildFilterGroups(
  allFiltered: SellerProduct[],
  query: string,
): FilterGroup[] {
  const groups: FilterGroup[] = [];

  // ORIGEN — only if any product has a location
  const locations = [...new Set(allFiltered.map((p) => p.location).filter(Boolean))] as string[];
  if (locations.length > 1) {
    groups.push({
      label: "ORIGEN",
      param: "origins",
      multi: true,
      options: locations.sort().map((loc) => ({
        label: loc,
        value: loc,
        count: allFiltered.filter((p) => p.location === loc).length,
      })),
    });
  }

  // TIPO — secondary categories (for accesorios / máquinas)
  const n = normalize(query);
  const isAccessorySection = ["accesorio", "mate", "termo", "bombilla", "maquina"].some((k) => n.includes(k));
  if (isAccessorySection) {
    // Collect all secondary categories (index 1+) and deduplicate
    const typeCounts = new Map<string, number>();
    for (const p of allFiltered) {
      for (const cat of p.categories.slice(1)) {
        const c = cat.toLowerCase();
        if (c === "accesorios" || c === "máquinas" || c === "combos") continue;
        typeCounts.set(c, (typeCounts.get(c) ?? 0) + 1);
      }
    }
    if (typeCounts.size > 1) {
      groups.push({
        label: "TIPO",
        param: "types",
        multi: true,
        options: [...typeCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([value, count]) => ({
            label: value.charAt(0).toUpperCase() + value.slice(1),
            value,
            count,
          })),
      });
    }
  }

  // PRECIO
  const buckets = getPriceBuckets(query);
  groups.push({
    label: "PRECIO",
    param: "priceRange",
    multi: false,
    options: buckets.map((b) => ({
      label: b.label,
      value: b.value,
      count: allFiltered.filter((p) => p.price >= b.lo && p.price <= b.hi).length,
    })),
  });

  return groups;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const {
    query = "",
    page = "1",
    origins,
    types,
    priceRange,
  } = await searchParams;

  const currentPage = Math.max(1, Number(page) || 1);

  if (!query) {
    return (
      <>
        <MorningRitual />
        <FeatureCards />
        <HeroSection />
        <EdicionLimitada />
      </>
    );
  }

  let allProducts: SellerProduct[] = [];
  try {
    allProducts = await getProducts();
  } catch {
    // Seller API unreachable — render empty catalog instead of crashing
  }

  const displayLabel = (q: string) =>
    DISPLAY_LABELS[q.toLowerCase()] ??
    (q.charAt(0).toUpperCase() + q.slice(1).toLowerCase());

  const q = normalize(query);

  // Primary filter: by query
  const queryFiltered = allProducts.filter((p) => {
    const primaryCat = normalize(p.categories[0] ?? "");
    const isMachine = primaryCat.includes("maquina");

    if (isMachine) {
      return normalize(p.name).includes(q) || primaryCat.includes(q);
    }

    return (
      normalize(p.name).includes(q) ||
      normalize(p.description ?? "").includes(q) ||
      p.categories.some((c) => normalize(c).includes(q))
    );
  });

  // Secondary filters: origins, types, priceRange
  const activeOrigins = origins ? origins.split("|").filter(Boolean) : [];
  const activeTypes   = types   ? types.split("|").filter(Boolean)   : [];

  const displayed = queryFiltered.filter((p) => {
    if (activeOrigins.length && !activeOrigins.includes(p.location ?? "")) return false;
    if (activeTypes.length && !p.categories.some((c) => activeTypes.includes(c.toLowerCase()))) return false;
    if (priceRange) {
      const [lo, hi] = parsePriceRange(priceRange);
      if (p.price < lo || p.price > hi) return false;
    }
    return true;
  });

  const totalCount = displayed.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const products = displayed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const accent = getQueryAccent(query);
  const filterGroups = buildFilterGroups(queryFiltered, query);

  return (
    <section className="py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">

        {/* Header */}
        <div className="pt-20 lg:pt-10 pb-12 px-6 text-center border-b border-tan">
          <p className="text-xs tracking-[0.25em] text-terracotta italic mb-6">
            CAFÉ, TÉ Y EL ARTE DE PREPARARLOS
          </p>
          <h1 className="font-serif text-6xl lg:text-7xl text-brown mb-8">{displayLabel(query)}</h1>
          <p className="text-sm italic text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {totalCount !== 1 ? "Se encontraron" : "Se encontró"} {totalCount} producto{totalCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Sidebar + grid */}
        <div className="lg:flex lg:gap-10 mt-12">

          <FilterSidebar groups={filterGroups} accent={accent} query={query} />

          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-serif text-2xl text-brown">Sin resultados para &ldquo;{query}&rdquo;</p>
                <p className="mt-2 text-muted-foreground">Probá un término diferente.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} query={query} />
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
