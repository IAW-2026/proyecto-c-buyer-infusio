import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function model() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

const BASE_CONTEXT = `Sos un analista de negocios para "Infusio", una tienda artesanal argentina de cafés de especialidad, tés e infusiones.`;

const FORMAT_RULES = `Cada insight debe:
- Empezar con un emoji relevante
- Tener una oración de observación y una recomendación concreta
- Estar en español rioplatense informal
No uses títulos ni markdown. Solo párrafos cortos separados por salto de línea.`;

// ─── General store insights ───────────────────────────────────────────────────

export interface StoreStats {
  totalRevenue: number;
  totalPurchases: number;
  recentPurchases: number;
  activeCarts: number;
  totalUsers: number;
  purchasesByStatus: { status: string; count: number }[];
}

export async function getStoreInsights(stats: StoreStats): Promise<string> {
  const statusSummary = stats.purchasesByStatus
    .map((s) => `${s.status}: ${s.count}`)
    .join(", ");

  const prompt = `${BASE_CONTEXT}

Estos son los datos actuales de la plataforma:
- Ingresos confirmados: $${stats.totalRevenue.toLocaleString("es-AR")} ARS
- Total de pedidos: ${stats.totalPurchases}
- Pedidos en los últimos 30 días: ${stats.recentPurchases}
- Carritos activos sin finalizar checkout: ${stats.activeCarts}
- Usuarios registrados: ${stats.totalUsers}
- Pedidos por estado: ${statusSummary}

Dame exactamente 3 insights breves y accionables sobre el estado del negocio.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Abandoned cart insights ──────────────────────────────────────────────────

export interface AbandonedCartStats {
  cartCount: number;
  totalLostRevenue: number;
  topProducts: { name: string; count: number }[];
}

export async function getAbandonedCartInsights(stats: AbandonedCartStats): Promise<string> {
  const productList = stats.topProducts
    .map((p, i) => `${i + 1}. ${p.name} (${p.count} veces)`)
    .join(", ");

  const prompt = `${BASE_CONTEXT}

Datos de carritos abandonados (sin finalizar checkout):
- Carritos con productos sin comprar: ${stats.cartCount}
- Valor total en riesgo: $${stats.totalLostRevenue.toLocaleString("es-AR")} ARS
- Productos más abandonados: ${productList || "sin datos"}

Dame exactamente 2 tácticas concretas para recuperar estos carritos.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Top products insights ────────────────────────────────────────────────────

export interface TopProductStats {
  topProducts: { name: string; unitsSold: number; revenue: number }[];
}

export async function getProductInsights(stats: TopProductStats): Promise<string> {
  const productList = stats.topProducts
    .map((p, i) => `${i + 1}. ${p.name} — ${p.unitsSold} unidades — $${p.revenue.toLocaleString("es-AR")} ARS`)
    .join("\n");

  const prompt = `${BASE_CONTEXT}

Estos son los 10 productos más vendidos por facturación:
${productList || "Sin datos de ventas todavía."}

Dame exactamente 3 insights sobre el mix de productos: qué impulsar, qué reestoquear, y qué oportunidad ves en el catálogo.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Accessory ritual description ────────────────────────────────────────────

export interface AccessoryRitualInput {
  name: string;
  categories: string[];
  materials?: string;
}

export async function getAccessoryRitual(product: AccessoryRitualInput): Promise<string> {
  const prompt = `${BASE_CONTEXT}

El producto es: "${product.name}" (${product.categories.join(", ")}).${product.materials ? ` Fabricado en: ${product.materials}.` : ""}

Escribí exactamente 2 oraciones sobre cómo este accesorio forma parte del ritual diario de preparar y disfrutar infusiones.
Tono poético, cálido, rioplatense informal. Sin emojis. Sin títulos.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Revenue trend & forecast ─────────────────────────────────────────────────

export interface RevenueTrendStats {
  weeklyRevenue: { week: string; amount: number }[];
}

export async function getRevenueForecast(stats: RevenueTrendStats): Promise<string> {
  const trendList = stats.weeklyRevenue
    .map((w) => `${w.week}: $${w.amount.toLocaleString("es-AR")} ARS`)
    .join("\n");

  const prompt = `${BASE_CONTEXT}

Ingresos semanales de las últimas 8 semanas (del más reciente al más antiguo):
${trendList || "Sin datos de tendencia todavía."}

Dame exactamente 2 párrafos: uno evaluando la tendencia de crecimiento y otro con una estimación aproximada del próximo mes.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}
