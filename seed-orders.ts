import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const BASE_URL = "http://localhost:3000";

// ─── New products (also added to prisma/seed.ts) ──────────────────────────────

const NEW_PRODUCTS = [
  { id: "prod_024", sellerId: "seller_006", name: "Té Verde Premium",         description: "Hojas enteras de té verde de cosecha temprana. Notas de pasto fresco y melón. Bajo en taninos.",                                                    categories: ["tés", "infusiones"],           price: 2800, stock: 60,  unit: "50G / SUELTO",  imageUrl: null, location: "Misiones, Argentina",       isLimitedEdition: false },
  { id: "prod_025", sellerId: "seller_001", name: "Yerba Mate Especial",       description: "Blend premium con palo seleccionado, estacionada 18 meses. Sabor suave y persistente.",                                                                categories: ["yerba mate", "infusiones"],    price: 3200, stock: 90,  unit: "500G",           imageUrl: null, location: "Corrientes, Argentina",     isLimitedEdition: false },
  { id: "prod_026", sellerId: "seller_005", name: "Café Molido Gourmet",       description: "Mezcla de arábica colombiano y brasileño, tueste medio-oscuro. Notas de caramelo y nuez.",                                                             categories: ["café"],                        price: 5400, stock: 45,  unit: "250G / MOLIDO",  imageUrl: null, location: "Colombia",                  isLimitedEdition: false },
  { id: "prod_027", sellerId: "seller_006", name: "Set de Infusiones Herbales",description: "5 variedades de hierbas medicinales: manzanilla, menta, tilo, boldo y melisa. Presentación en caja kraft.",                                          categories: ["tés", "infusiones", "combos"], price: 4200, stock: 25,  unit: "SET COMPLETO",   imageUrl: null, location: "Buenos Aires, Argentina",   isLimitedEdition: false },
  { id: "prod_028", sellerId: "seller_006", name: "Té Negro Assam",            description: "Cuerpo robusto y color cobrizo intenso. Maltoso y vigorizante. Ideal con leche al desayuno.",                                                          categories: ["tés", "infusiones"],           price: 1900, stock: 80,  unit: "100G",           imageUrl: null, location: "Assam, India",             isLimitedEdition: false },
  { id: "prod_029", sellerId: "seller_005", name: "Café Blend Especial",       description: "Blend de Huila y Nariño, gran formato para cafeteros cotidianos. Acidez brillante, postgusto largo.",                                                  categories: ["café"],                        price: 8900, stock: 30,  unit: "500G / GRANO",   imageUrl: null, location: "Colombia",                  isLimitedEdition: false },
  { id: "prod_030", sellerId: "seller_001", name: "Yerba Mate Premium",        description: "Gran formato sin palo, hoja fina seleccionada. Estacionada 24 meses. Para quienes ceben todos los días.",                                              categories: ["yerba mate", "infusiones"],    price: 4500, stock: 70,  unit: "1KG",            imageUrl: null, location: "Misiones, Argentina",       isLimitedEdition: false },
  { id: "prod_031", sellerId: "seller_002", name: "Bombilla de Acero Inox.",   description: "Bombilla de acero inoxidable 304 con filtro de malla fina. Apta para yerba con y sin palo. Incluye limpiabarrilla.",                                  categories: ["bombillas", "accesorios"],     price: 2100, stock: 150, unit: "ACERO INOX",     imageUrl: null, location: "Buenos Aires, Argentina",   isLimitedEdition: false },
  { id: "prod_032", sellerId: "seller_006", name: "Infusión de Manzanilla",    description: "Flores secas de manzanilla alemana. Reconfortante, digestiva y suavemente floral. Sin cafeína.",                                                       categories: ["tés", "infusiones"],           price: 1200, stock: 120, unit: "30 SAQUITOS",    imageUrl: null, location: "Argentina",                 isLimitedEdition: false },
  { id: "prod_033", sellerId: "seller_006", name: "Té de Rosa Mosqueta",       description: "Frutos secos de rosa mosqueta patagónica, ricos en vitamina C. Sabor suavemente ácido y afrutado.",                                                    categories: ["tés", "infusiones"],           price: 1400, stock: 100, unit: "25 SAQUITOS",    imageUrl: null, location: "Patagonia, Argentina",      isLimitedEdition: false },
  { id: "prod_034", sellerId: "seller_002", name: "Gift Box Premium Infusio",  description: "Caja regalo: mate artesanal, bombilla de alpaca, 3 variedades de yerba y mezcla de tés. El regalo perfecto.",                                          categories: ["mates", "accesorios", "combos"], price: 12000, stock: 10, unit: "SET COMPLETO", imageUrl: null, location: "Buenos Aires, Argentina",   isLimitedEdition: true, badge: "LOTE ESPECIAL" },
  { id: "prod_035", sellerId: "seller_006", name: "Té Rojo Pu-erh",            description: "Té fermentado post-oxidado de Yunnan. Notas terrosas y dulces, sabor profundo y complejo.",                                                            categories: ["tés", "infusiones"],           price: 3800, stock: 35,  unit: "100G",           imageUrl: null, location: "Yunnan, China",            isLimitedEdition: false },
  { id: "prod_036", sellerId: "seller_005", name: "Café Arábica Colombia",     description: "Origen único de Huila, proceso lavado. Notas de ciruela, panela y mandarina. Acidez media, cuerpo sedoso.",                                            categories: ["café"],                        price: 6200, stock: 40,  unit: "250G / GRANO",   imageUrl: null, location: "Huila, Colombia",           isLimitedEdition: false },
];

// ─── Addresses ────────────────────────────────────────────────────────────────

const ADDRESS_CABA = { firstName: "Milagros", lastName: "Vives", street: "Av. Corrientes 1234", apartment: "3B",  city: "Buenos Aires",           province: "CABA",     postal_code: "1043", country: "Argentina" };
const ADDRESS_CBA  = { firstName: "Milagros", lastName: "Vives", street: "Av. Colón 456",       city: "Córdoba",                province: "Córdoba",  postal_code: "5000", country: "Argentina" };
const ADDRESS_MDZ  = { firstName: "Milagros", lastName: "Vives", street: "Calle San Martín 789", city: "Mendoza",               province: "Mendoza",  postal_code: "5500", country: "Argentina" };
const ADDRESS_TUC  = { firstName: "Milagros", lastName: "Vives", street: "Av. Independencia 321", city: "San Miguel de Tucumán", province: "Tucumán", postal_code: "4000", country: "Argentina" };

// ─── Helper ───────────────────────────────────────────────────────────────────

type ItemDef = { productId: string; name: string; variant?: string; imageUrl?: string | null; price: number; qty: number };

async function createOrder(userId: string, opts: {
  items: ItemDef[];
  address: object;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  shippingId?: string;
  shippingCost: number;
  createdDaysAgo?: number;
}) {
  const cart = await db.cart.create({
    data: {
      userId,
      status: "CHECKED_OUT",
      items: {
        create: opts.items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productVariant: item.variant ?? null,
          productImageUrl: item.imageUrl ?? null,
          priceAtTime: item.price,
          quantity: item.qty,
        })),
      },
    },
  });

  const subtotal = opts.items.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = subtotal + opts.shippingCost;
  const createdAt = opts.createdDaysAgo
    ? new Date(Date.now() - opts.createdDaysAgo * 24 * 60 * 60 * 1000)
    : new Date();

  const order = await db.purchaseOrder.create({
    data: {
      cartId: cart.id,
      userId,
      userAddress: opts.address as object,
      status: opts.status,
      shippingId: opts.shippingId ?? null,
      paymentUrl: "",
      createdAt,
      packages: {
        create: {
          sellerId: "mock-seller",
          buyerId: userId,
          amount: subtotal,
          shippingCost: opts.shippingCost,
          items: {
            create: opts.items.map((item) => ({
              productId: item.productId,
              productName: item.name,
              unitPrice: item.price,
              quantity: item.qty,
              subtotal: item.price * item.qty,
            })),
          },
        },
      },
    },
  });

  await db.purchaseOrder.update({
    where: { id: order.id },
    data: { paymentUrl: `${BASE_URL}/api/payments/payment-url?order_id=${order.id}&amount=${total}` },
  });

  console.log(`  ✓ ${opts.status.padEnd(10)} | ${(opts.shippingId ?? "no-ship").padEnd(20)} | ${opts.items.map((i) => i.name).join(", ")}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const user = await db.user.findUnique({ where: { email: "milivives@gmail.com" } });
  if (!user) { console.error("User not found"); process.exit(1); }

  // Upsert the new products so they appear in the catalog
  for (const p of NEW_PRODUCTS) {
    await db.product.upsert({ where: { id: p.id }, create: p as never, update: p as never });
  }
  console.log(`Upserted ${NEW_PRODUCTS.length} new products\n`);

  // Wipe old orders (packages/items cascade)
  const deleted = await db.purchaseOrder.deleteMany({ where: { userId: user.id } });
  console.log(`Deleted ${deleted.count} old order(s) for ${user.email}\n`);

  console.log("Creating test orders:");

  // 1. Just placed — no shipment yet
  await createOrder(user.id, {
    items: [
      { productId: "prod_024", name: "Té Verde Premium",   variant: "50G / SUELTO", price: 2800, qty: 2 },
      { productId: "prod_025", name: "Yerba Mate Especial",                          price: 3200, qty: 1 },
    ],
    address: ADDRESS_CABA, status: "PENDING", shippingCost: 1500, createdDaysAgo: 0,
  });

  // 2. Preparing
  await createOrder(user.id, {
    items: [
      { productId: "prod_026", name: "Café Molido Gourmet", variant: "250G / MOLIDO", price: 5400, qty: 1 },
    ],
    address: ADDRESS_CABA, status: "PENDING", shippingId: "ship_pending_001", shippingCost: 2800, createdDaysAgo: 1,
  });

  // 3. In transit — Rosario → Córdoba
  await createOrder(user.id, {
    items: [
      { productId: "prod_027", name: "Set de Infusiones Herbales",               price: 4200, qty: 1 },
      { productId: "prod_028", name: "Té Negro Assam",         variant: "100G",  price: 1900, qty: 2 },
    ],
    address: ADDRESS_CBA, status: "CONFIRMED", shippingId: "ship_transit_001", shippingCost: 2800, createdDaysAgo: 3,
  });

  // 4. In transit — Tucumán
  await createOrder(user.id, {
    items: [
      { productId: "prod_029", name: "Café Blend Especial", variant: "500G / GRANO", price: 8900, qty: 1 },
    ],
    address: ADDRESS_TUC, status: "CONFIRMED", shippingId: "ship_transit_002", shippingCost: 4200, createdDaysAgo: 5,
  });

  // 5. Delivered — Buenos Aires
  await createOrder(user.id, {
    items: [
      { productId: "prod_030", name: "Yerba Mate Premium",        variant: "1KG",        price: 4500, qty: 2 },
      { productId: "prod_031", name: "Bombilla de Acero Inox.",   variant: "ACERO INOX", price: 2100, qty: 1 },
    ],
    address: ADDRESS_CABA, status: "CONFIRMED", shippingId: "ship_delivered_001", shippingCost: 1500, createdDaysAgo: 12,
  });

  // 6. Delivered — Córdoba
  await createOrder(user.id, {
    items: [
      { productId: "prod_032", name: "Infusión de Manzanilla", variant: "30 SAQUITOS", price: 1200, qty: 3 },
      { productId: "prod_033", name: "Té de Rosa Mosqueta",    variant: "25 SAQUITOS", price: 1400, qty: 2 },
    ],
    address: ADDRESS_CBA, status: "CONFIRMED", shippingId: "ship_delivered_002", shippingCost: 2800, createdDaysAgo: 20,
  });

  // 7. Incident — Mendoza
  await createOrder(user.id, {
    items: [
      { productId: "prod_034", name: "Gift Box Premium Infusio", price: 12000, qty: 1 },
    ],
    address: ADDRESS_MDZ, status: "CONFIRMED", shippingId: "ship_incident_001", shippingCost: 4200, createdDaysAgo: 8,
  });

  // 8. Cancelled
  await createOrder(user.id, {
    items: [
      { productId: "prod_035", name: "Té Rojo Pu-erh",        variant: "100G",       price: 3800, qty: 1 },
      { productId: "prod_036", name: "Café Arábica Colombia",  variant: "250G / GRANO", price: 6200, qty: 2 },
    ],
    address: ADDRESS_CABA, status: "CANCELLED", shippingCost: 2800, createdDaysAgo: 15,
  });

  console.log("\nDone — 13 products + 8 orders seeded.");
}

main().catch(console.error).finally(() => db.$disconnect());
