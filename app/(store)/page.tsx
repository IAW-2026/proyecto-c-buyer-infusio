import { getProducts, type SellerProduct } from "@/app/lib/services/externalApis";
import ProductCard from "@/app/ui/ProductCard";
import Pagination from "@/app/ui/Pagination";
import MorningRitual from "@/app/ui/sections/MorningRitual";
import FeatureCards from "@/app/ui/sections/FeatureCards";
import HeroSection from "@/app/ui/sections/HeroSection";
import EdicionLimitada from "@/app/ui/sections/EdicionLimitada";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { query = "", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  // Only fetch products when the user is actively searching
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

  const DISPLAY_LABELS: Record<string, string> = {
    cafe: "Café",
    maquinas: "Máquinas",
    tes: "Tés",
  };
  const displayLabel = (q: string) =>
    DISPLAY_LABELS[q.toLowerCase()] ??
    (q.charAt(0).toUpperCase() + q.slice(1).toLowerCase());

  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const q = normalize(query);
  const filtered = allProducts.filter(
    (p) =>
      normalize(p.name).includes(q) ||
      normalize(p.description ?? "").includes(q) ||
      p.categories.some((c) => normalize(c).includes(q))
  );

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const products = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

        <div className="flex items-center justify-between mb-8">
                   
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-brown">Sin resultados para &ldquo;{query}&rdquo;</p>
            <p className="mt-2 text-muted-foreground">Probá un término diferente.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} query={query} />
          </>
        )}
      </div>
    </section>
  );
}
