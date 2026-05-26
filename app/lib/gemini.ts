import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// ─── Weekly action plan ───────────────────────────────────────────────────────

export interface WeeklyActionPlanStats {
  totalRevenue: number;
  recentPurchases: number;
  abandonedCartCount: number;
  totalLostRevenue: number;
  topProducts: { name: string; unitsSold: number }[];
  cancelledOrders: number;
  totalOrders: number;
}

export async function getWeeklyActionPlan(stats: WeeklyActionPlanStats): Promise<string> {
  const topList = stats.topProducts
    .slice(0, 5)
    .map((p, i) => `${i + 1}. ${p.name} (${p.unitsSold} uds)`)
    .join(", ");

  const prompt = `${BASE_CONTEXT}

Estado actual del negocio:
- Ingresos totales: $${stats.totalRevenue.toLocaleString("es-AR")} ARS
- Pedidos recientes (últimos 7 días): ${stats.recentPurchases}
- Carritos abandonados: ${stats.abandonedCartCount} (valor en riesgo: $${stats.totalLostRevenue.toLocaleString("es-AR")} ARS)
- Pedidos cancelados: ${stats.cancelledOrders} de ${stats.totalOrders} totales
- Top productos: ${topList || "sin datos"}

Dada esta situación, generá exactamente 3 acciones concretas y prioritarias que el administrador debería ejecutar esta semana para mejorar el negocio.
Cada acción debe ser específica, medible y accionable. Numeralas del 1 al 3.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Business health score ────────────────────────────────────────────────────

export interface BusinessHealthStats {
  totalRevenue: number;
  recentPurchases: number;
  totalUsers: number;
  abandonedCartCount: number;
  confirmedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
}

export async function getBusinessHealthScore(
  stats: BusinessHealthStats
): Promise<{ score: number; label: string; explanation: string } | null> {
  const prompt = `${BASE_CONTEXT}

Métricas actuales:
- Ingresos totales: $${stats.totalRevenue.toLocaleString("es-AR")} ARS
- Pedidos recientes (7 días): ${stats.recentPurchases}
- Usuarios registrados: ${stats.totalUsers}
- Carritos abandonados sin compra: ${stats.abandonedCartCount}
- Pedidos confirmados: ${stats.confirmedOrders} de ${stats.totalOrders} totales
- Pedidos cancelados: ${stats.cancelledOrders} de ${stats.totalOrders} totales

Evaluá la salud general del negocio con un puntaje del 0 al 100.
Respondé ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{"score": <número entero 0-100>, "label": "<una sola palabra en español>", "explanation": "<2 oraciones en español rioplatense explicando el puntaje>"}`;

  try {
    const result = await model().generateContent(prompt);
    const text = result.response.text().trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      score: number;
      label: string;
      explanation: string;
    };
  } catch {
    return null;
  }
}

// ─── Anomaly alerts ───────────────────────────────────────────────────────────

export interface AnomalyStats {
  weeklyRevenue: { week: string; amount: number }[];
  cancelledOrders: number;
  totalOrders: number;
  abandonedCartCount: number;
  recentPurchases: number;
}

export async function getAnomalyAlerts(stats: AnomalyStats): Promise<string[]> {
  const trendList = stats.weeklyRevenue
    .map((w) => `${w.week}: $${w.amount.toLocaleString("es-AR")}`)
    .join(", ");

  const cancellationRate =
    stats.totalOrders > 0
      ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)
      : "0";

  const prompt = `${BASE_CONTEXT}

Datos para análisis de anomalías:
- Ingresos semanales (reciente a antiguo): ${trendList || "sin datos"}
- Tasa de cancelación: ${cancellationRate}% (${stats.cancelledOrders} de ${stats.totalOrders})
- Carritos abandonados activos: ${stats.abandonedCartCount}
- Pedidos últimos 7 días: ${stats.recentPurchases}

Identificá hasta 2 anomalías o patrones preocupantes en estos datos.
Si no hay nada preocupante, devolvé un array vacío.
Respondé ÚNICAMENTE con JSON válido: ["alerta 1", "alerta 2"] o []. Sin texto adicional.`;

  try {
    const result = await model().generateContent(prompt);
    const text = result.response.text().trim();
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart === -1 || arrEnd === -1) return [];
    return JSON.parse(text.slice(arrStart, arrEnd + 1)) as string[];
  } catch {
    return [];
  }
}

// ─── Customer segmentation ────────────────────────────────────────────────────

export interface CustomerSegmentStats {
  totalUsers: number;
  clientCount: number;
  vendorCount: number;
  totalOrders: number;
  confirmedOrders: number;
  recentPurchases: number;
}

export async function getCustomerSegmentation(stats: CustomerSegmentStats): Promise<string> {
  const conversionRate =
    stats.totalUsers > 0
      ? ((stats.totalOrders / stats.totalUsers) * 100).toFixed(1)
      : "0";

  const prompt = `${BASE_CONTEXT}

Datos de la base de usuarios:
- Total usuarios registrados: ${stats.totalUsers} (${stats.clientCount} compradores, ${stats.vendorCount} vendedores)
- Total pedidos realizados: ${stats.totalOrders} (${stats.confirmedOrders} confirmados)
- Pedidos recientes (7 días): ${stats.recentPurchases}
- Tasa de conversión usuario→compra: ${conversionRate}%

Dame exactamente 2 insights sobre la base de clientes: qué dice sobre el perfil de comprador, y qué estrategia recomendás para aumentar la retención o conversión.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Favourite insights ───────────────────────────────────────────────────────

export interface FavouriteInsightsStats {
  totalFavourites: number;
  shareCount: number;
  topProducts: { name: string; count: number }[];
  topCategories: { category: string; count: number }[];
}

export async function getFavouriteInsights(stats: FavouriteInsightsStats): Promise<string> {
  const productList = stats.topProducts
    .slice(0, 5)
    .map((p, i) => `${i + 1}. ${p.name} (${p.count} personas)`)
    .join(", ");
  const categoryList = stats.topCategories
    .map((c) => `${c.category} (${c.count})`)
    .join(", ");

  const prompt = `${BASE_CONTEXT}

Datos sobre los productos guardados como favoritos por los usuarios:
- Total de favoritos activos: ${stats.totalFavourites}
- Listas compartidas generadas: ${stats.shareCount}
- Productos más guardados: ${productList || "sin datos"}
- Categorías más guardadas: ${categoryList || "sin datos"}

Dame exactamente 2 insights sobre el comportamiento de favoritos: qué revela sobre las preferencias de los clientes y qué acción concreta recomendás para aprovechar este dato.
${FORMAT_RULES}`;

  const result = await model().generateContent(prompt);
  return result.response.text();
}

// ─── Public assistant chat ────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function chatWithAssistant(
  message: string,
  history: ChatMessage[],
  catalog: { name: string; price: number; categories: string[] }[]
): Promise<string> {
  const catalogList = catalog
    .map((p) => `- ${p.name} (${p.categories.join(", ")}) — $${p.price.toLocaleString("es-AR")} ARS`)
    .join("\n");

  const systemContent = `Sos el asistente virtual de Infusio, una tienda artesanal argentina de cafés de especialidad, tés, yerba mate, tereré e infusiones. Solo respondés preguntas relacionadas con Infusio: sus productos, cómo prepararlos, qué elegir según gustos, política de devoluciones, envíos y contacto. Si te preguntan algo fuera de estos temas, decís amablemente que solo podés ayudar con consultas sobre la tienda.

Este es el catálogo actual con precios (los precios pueden cambiar, siempre aclaralo cuando los menciones):
${catalogList || "Catálogo no disponible en este momento."}

Respondés en español rioplatense, de forma cálida, breve y concreta. Sin markdown ni listas con guiones salvo que sea imprescindible. Máximo 3 oraciones por respuesta salvo que el usuario pida más detalle.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: (m.role === "model" ? "assistant" : "user") as "assistant" | "user",
      content: m.parts[0]?.text ?? "",
    })),
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 400,
  });

  return completion.choices[0]?.message?.content ?? "Ocurrió un error. Intentá de nuevo.";
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
