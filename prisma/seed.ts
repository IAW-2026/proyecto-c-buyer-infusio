import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { UserRole } from "../generated/prisma/enums";
import { createClerkClient } from "@clerk/backend";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Test password for both seed users — change in Clerk dashboard after seeding
const TEST_PASSWORD = "Infusio2024!";

async function findOrCreateClerkUser(email: string, firstName: string, lastName: string, username: string) {
  const { data: existing } = await clerk.users.getUserList({ emailAddress: [email] });
  if (existing.length > 0) return existing[0];
  return clerk.users.createUser({
    emailAddress: [email],
    username,
    password: TEST_PASSWORD,
    firstName,
    lastName,
  });
}

const PRODUCTS = [
  { id: "prod_001", sellerId: "seller_001", name: "Yerba Mate Rosamonte Especial", description: "Yerba mate suave y equilibrada, ideal para cebar mate largo. Elaborada en Corrientes.", categories: ["yerba mate", "infusiones"], price: 2850, stock: 120, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp", location: "Corrientes, Argentina", isLimitedEdition: true, badge: "LOTE ESPECIAL" },
  { id: "prod_002", sellerId: "seller_001", name: "Yerba Mate CBSé Energía Pomelo", description: "Yerba con extracto de pomelo y guaraná. Sabor cítrico refrescante.", categories: ["yerba mate", "saborizadas", "infusiones"], price: 3100, stock: 85, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_927424-MLU72565713266_112023-O.webp", location: "Corrientes, Argentina", isLimitedEdition: false },
  { id: "prod_003", sellerId: "seller_002", name: "Mate Calabaza Imperial Curado", description: "Mate artesanal curado con yerba, metal plateado.", categories: ["mates", "accesorios"], price: 4500, stock: 30, unit: "250ML", imageUrl: "https://acdn-us.mitiendanube.com/stores/005/262/890/products/imp1-539d6d4d80116ffbce17316867237631-640-0.webp", location: "Buenos Aires, Argentina", isLimitedEdition: true, badge: "ÚLTIMAS UNIDADES" },
  { id: "prod_004", sellerId: "seller_002", name: "Bombilla Acero Inoxidable Pico de Loro", description: "Filtro superior, tubo recto, apta para lavavajillas.", categories: ["bombillas", "accesorios"], price: 1200, stock: 200, unit: "ACERO INOX", imageUrl: "https://acdn-us.mitiendanube.com/stores/004/274/329/products/pico-de-loro-acero-1-d208ed4b8e792db12617592794656043-1024-1024.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_005", sellerId: "seller_003", name: "Termo Stanley Classic Verde", description: "Vacío doble pared, mantiene temperatura 24h. Original USA.", categories: ["termos", "accesorios"], price: 28000, stock: 15, unit: "1L", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvAwrS7ZrOMVhlT5P3R-Jl87w46X7PWJ5vWg&s", location: "Ciudad Autónoma de Buenos Aires", isLimitedEdition: false },
  { id: "prod_006", sellerId: "seller_003", name: "Té Verde Taragüi Menta Poleo", description: "Saquitos de té verde con menta poleo, antioxidante natural.", categories: ["tés", "infusiones"], price: 890, stock: 300, unit: "x20 SAQUITOS", imageUrl: "https://statics.dinoonline.com.ar/imagenes/large_460x460/2020123_l.jpg", location: "Entre Ríos, Argentina", isLimitedEdition: true, badge: "LOTE ESPECIAL" },
  { id: "prod_007", sellerId: "seller_002", name: "Set Mate + Bombilla Artesanal", description: "Combo mate de madera pintada + bombilla alpaca. Ideal para regalo.", categories: ["mates", "accesorios", "combos"], price: 5800, stock: 5, unit: "SET COMPLETO", imageUrl: "https://acdn-us.mitiendanube.com/stores/003/024/004/products/img_5168-877e4a2f4754a8696517423171106674-480-0.webp", location: "Buenos Aires, Argentina", isLimitedEdition: true, badge: "ÚLTIMAS UNIDADES" },
  { id: "prod_008", sellerId: "seller_004", name: "Hierbas para Tereré Frío", description: "Mezcla de hierbas medicinales para preparar tereré frío tradicional.", categories: ["tereré", "infusiones"], price: 1650, stock: 0, unit: "300G", imageUrl: "https://jesper.com.ar/wp-content/uploads/2023/04/te-verde-terere-bolsa500g.jpg", location: "Misiones, Argentina", isLimitedEdition: false },
  { id: "prod_009", sellerId: "seller_005", name: "Café Yirgacheffe Etiopía", description: "Notas florales de jazmín y limón, acidez brillante. Perfil de tueste claro.", categories: ["café"], price: 4800, stock: 40, unit: "250G / GRANO", imageUrl: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", location: "Etiopía", isLimitedEdition: true, badge: "LOTE ESPECIAL" },
  { id: "prod_010", sellerId: "seller_005", name: "Espresso Blend Brasileño", description: "Cuerpo intenso con notas de chocolate y frutos secos. Equilibrado y dulce.", categories: ["café"], price: 3600, stock: 60, unit: "1KG / MOLIDO", imageUrl: "https://www.connectroasters.com/cdn/shop/files/Connect112125-8.jpg?v=1763930646&width=1946", location: "Minas Gerais, Brasil", isLimitedEdition: true, badge: "ÚLTIMAS UNIDADES" },
  { id: "prod_011", sellerId: "seller_005", name: "Café Sidamo Etiopía Natural", description: "Proceso natural, notas de frutas rojas y chocolate oscuro. Tueste medio.", categories: ["café"], price: 5200, stock: 20, unit: "250G / GRANO", imageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-Ethiopia-sidama-coffee-beans-natural-flavor.png?v=1767841523&width=1445", location: "Etiopía", isLimitedEdition: true, badge: "EDICIÓN RARA" },
  { id: "prod_012", sellerId: "seller_001", name: "Yerba Mate Amanda Tradicional", description: "Cosecha tardía de hojas seleccionadas, estacionada 24 meses. Perfil intenso.", categories: ["yerba mate", "infusiones"], price: 4200, stock: 18, unit: "500G", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVIE1QfLr6Wxp4HxU_Xon0389jiolMPKQUPw&s", location: "Corrientes, Argentina", isLimitedEdition: true, badge: "EDICIÓN RARA" },
  // ─── Accessories ─────────────────────────────────────────────────────────────
  { id: "prod_013", sellerId: "seller_002", name: "Mate de Cerámica Artesanal", description: "Mate torneado a mano en taller ceramista porteño. Esmaltado con terminación mate, borde de acero inoxidable para mayor durabilidad.", categories: ["mates", "accesorios"], price: 6500, stock: 24, unit: "350ML", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#f2ede0", "#8b7355", "#2c2c2c"], specs: { materials: "Cerámica esmaltada, borde de acero inoxidable", capacity: "350 ml", dimensions: { height: "10 cm", diameter: "8 cm" }, care: "Lavar a mano con agua tibia. No apto para microondas ni lavavajillas." } },
  { id: "prod_014", sellerId: "seller_002", name: "Mate de Palo Santo", description: "Tallado en madera de palo santo curada artesanalmente. Aporta un aroma suave y único a cada cebada.", categories: ["mates", "accesorios"], price: 8900, stock: 12, unit: "300ML", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: true, badge: "EDICIÓN RARA", colors: ["#c8a96e", "#5c3d1e"], specs: { materials: "Madera de palo santo curada, base de acero inoxidable", capacity: "300 ml", dimensions: { height: "9 cm", diameter: "7 cm" }, care: "Limpiar en seco o con trapo húmedo. Curar con yerba antes del primer uso. Evitar agua prolongada." } },
  { id: "prod_015", sellerId: "seller_002", name: "Bombilla de Plata 925", description: "Bombilla artesanal de plata 925 maciza, con filtro de malla tejida a mano. Para quienes no resignan la experiencia.", categories: ["bombillas", "accesorios"], price: 12000, stock: 8, unit: "PLATA 925", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: true, badge: "LOTE ESPECIAL", colors: ["#e8e4dc"], specs: { materials: "Plata 925 maciza, filtro de malla tejida a mano", dimensions: { length: "18 cm", width: "7 mm" }, care: "Lavar con cepillo fino luego de cada uso. Evitar lavavajillas y detergentes agresivos." } },
  { id: "prod_016", sellerId: "seller_002", name: "Kit de Iniciación Mate", description: "Todo lo que necesitás para empezar a cebar mate: mate de cerámica curado, bombilla de acero y 200g de yerba orgánica seleccionada.", categories: ["mates", "accesorios", "combos"], price: 9800, stock: 18, unit: "SET COMPLETO", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#f2ede0", "#8b7355"], specs: { materials: "Cerámica, acero inoxidable, yerba orgánica seleccionada", capacity: "350 ml", care: "Incluye guía de curado paso a paso. Ver instrucciones del kit antes del primer uso." } },
  { id: "prod_017", sellerId: "seller_003", name: "Termo Doble Pared 1L Negro", description: "Termo de vacío doble pared en acero inoxidable 316L. Mantiene la temperatura ideal para el mate durante 24 horas.", categories: ["termos", "accesorios"], price: 15000, stock: 20, unit: "1L", imageUrl: null, location: "Ciudad Autónoma de Buenos Aires", isLimitedEdition: false, colors: ["#1a1a1a", "#e8e4dc", "#6b8e6b"], specs: { materials: "Acero inoxidable 316L interior, exterior termoplástico libre de BPA", capacity: "1000 ml", dimensions: { height: "32 cm" }, care: "Lavar con agua y jabón suave. No apto para lavavajillas. Secar bien antes de cerrar." } },
  { id: "prod_018", sellerId: "seller_002", name: "Mate Vidrio con Funda de Cuero", description: "Mate de vidrio borosilicato con funda de cuero vegano cosida a mano. Permite ver la yerba en cada cebada.", categories: ["mates", "accesorios"], price: 7200, stock: 15, unit: "400ML", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#2c5f2e", "#1a1a1a"], specs: { materials: "Vidrio borosilicato resistente, funda de cuero vegano cosido a mano", capacity: "400 ml", dimensions: { height: "11 cm", diameter: "8 cm" }, care: "Vidrio apto para lavavajillas. Limpiar funda con trapo húmedo, no sumergir en agua." } },
  // ─── Machines ────────────────────────────────────────────────────────────────
  { id: "prod_019", sellerId: "seller_005", name: "Moka Express 3 Tazas", description: "La cafetera de aluminio de origen italiano que definió el café de hogar. Produce un espresso intenso y aromático en la hornalla.", categories: ["máquinas", "café"], price: 8500, stock: 35, unit: "3 TAZAS", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Aluminio alimentario fundido, junta de silicona apta para alimentos", capacity: "150 ml", dimensions: { height: "19 cm" }, care: "Enjuagar con agua fría tras cada uso. No lavar con detergente los primeros meses para preservar el curado natural." } },
  { id: "prod_020", sellerId: "seller_005", name: "Prensa Francesa 350ml", description: "Método clásico de inmersión para un café de cuerpo pleno y aceites naturales intactos. Ideal para molienda gruesa.", categories: ["máquinas", "café"], price: 5800, stock: 28, unit: "350ML", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Vidrio borosilicato reforzado, estructura y pistón de acero inoxidable", capacity: "350 ml", care: "Apto lavavajillas. Desmontar el pistón para limpieza profunda y evitar residuos de aceite." } },
  { id: "prod_021", sellerId: "seller_005", name: "Chemex 6 Tazas", description: "Ícono del diseño americano. El filtro grueso retiene aceites y produce un café limpio, floral y de alta claridad.", categories: ["máquinas", "café"], price: 14500, stock: 10, unit: "6 TAZAS", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: true, badge: "ÚLTIMAS UNIDADES", colors: [], specs: { materials: "Vidrio borosilicato de alta pureza, aro de madera natural con lazo de cuero", capacity: "900 ml", dimensions: { height: "23 cm" }, care: "Lavar con agua caliente y jabón suave. Secado al aire. No apto para microondas." } },
  { id: "prod_022", sellerId: "seller_005", name: "Molinillo Manual Cerámica", description: "Burr cónico de cerámica para molienda precisa y uniforme. Ajuste escalonado de 18 niveles para todos los métodos.", categories: ["máquinas", "accesorios"], price: 11000, stock: 16, unit: "MANUAL", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Burr cerámico cónico, cuerpo y receptáculo de acero inoxidable", dimensions: { height: "24 cm", width: "7 cm" }, care: "Limpiar el burr mensualmente con cepillo seco. No lavar con agua para evitar corrosión de las muelas." } },
  { id: "prod_023", sellerId: "seller_005", name: "Hervidor Variable 1.5L", description: "Control de temperatura en 5 rangos para cada método: 60 °C para té verde, 80 °C para té blanco, 100 °C para mate y espresso.", categories: ["máquinas", "accesorios"], price: 18000, stock: 22, unit: "1.5L", imageUrl: null, location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Interior de acero inoxidable 304, exterior termoplástico libre de BPA", capacity: "1500 ml", care: "Descalcificar mensualmente con solución de agua y vinagre blanco. Base eléctrica: mantener la superficie seca." } },
];

async function main() {
  // Remove old placeholder records so real Clerk IDs can take over
  await prisma.user.deleteMany({
    where: { id: { in: ["user_seed_admin_001", "user_seed_client_001"] } },
  });

  async function upsertUser(clerkId: string, name: string, lastName: string, email: string, roles: UserRole[]) {
    // Remove any stale record with the same email but a different ID before upserting.
    await prisma.user.deleteMany({ where: { email, NOT: { id: clerkId } } });
    await prisma.user.upsert({
      where: { id: clerkId },
      update: { roles },
      create: { id: clerkId, name, lastName, email, roles },
    });
  }

  const adminClerk = await findOrCreateClerkUser("admin@infusio.com", "Admin", "Infusio", "admin_infusio");
  await upsertUser(adminClerk.id, "Admin", "Infusio", "admin@infusio.com", [UserRole.ADMIN]);

  const clientClerk = await findOrCreateClerkUser("cliente@infusio.com", "Cliente", "Prueba", "cliente_prueba");
  await upsertUser(clientClerk.id, "Cliente", "Prueba", "cliente@infusio.com", [UserRole.CLIENT]);

  for (const p of PRODUCTS) {
    await prisma.product.upsert({ where: { id: p.id }, create: p, update: p });
  }
  console.log(`  ${PRODUCTS.length} products upserted`);

  // ─── Fake purchase orders for milivives@gmail.com ───────────────────────────
  const { data: milivList } = await clerk.users.getUserList({ emailAddress: ["milivives@gmail.com"] });
  if (milivList.length === 0) {
    console.log("  milivives@gmail.com not found in Clerk — skipping demo orders");
    return;
  }
  const milivClerk = milivList[0];
  await upsertUser(milivClerk.id, milivClerk.firstName ?? "Mili", milivClerk.lastName ?? "Vives", "milivives@gmail.com", [UserRole.CLIENT, UserRole.VENDOR]);

  // Delete any orders previously seeded under clientClerk to avoid duplicates
  await prisma.purchaseOrder.deleteMany({ where: { userId: clientClerk.id, id: { startsWith: "order_seed_" } } });

  const clientId = milivClerk.id;
  const demoAddress = { street: "Av. Corrientes 1234", city: "Buenos Aires", province: "CABA", postalCode: "1043" };

  const ORDERS: {
    id: string; cartId: string; status: "PENDING" | "CONFIRMED" | "CANCELLED";
    shippingId: string | null; daysAgo: number; shippingCost: number;
    items: { productId: string; name: string; image: string | null; price: number; qty: number }[];
  }[] = [
    {
      id: "order_seed_001", cartId: "cart_seed_001", status: "PENDING", shippingId: null, daysAgo: 1, shippingCost: 0,
      items: [
        { productId: "prod_009", name: "Café Yirgacheffe Etiopía",      image: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp",  price: 4800, qty: 2 },
      ],
    },
    {
      id: "order_seed_002", cartId: "cart_seed_002", status: "CONFIRMED", shippingId: "ship_pending_001", daysAgo: 4, shippingCost: 1500,
      items: [
        { productId: "prod_010", name: "Espresso Blend Brasileño",       image: "https://www.connectroasters.com/cdn/shop/files/Connect112125-8.jpg?v=1763930646&width=1946", price: 3600, qty: 1 },
        { productId: "prod_004", name: "Bombilla Acero Inox Pico de Loro", image: "https://acdn-us.mitiendanube.com/stores/004/274/329/products/pico-de-loro-acero-1-d208ed4b8e792db12617592794656043-1024-1024.webp", price: 1200, qty: 1 },
      ],
    },
    {
      id: "order_seed_003", cartId: "cart_seed_003", status: "CONFIRMED", shippingId: "ship_transit_001", daysAgo: 8, shippingCost: 2800,
      items: [
        { productId: "prod_001", name: "Yerba Mate Rosamonte Especial",  image: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp",  price: 2850, qty: 3 },
        { productId: "prod_006", name: "Té Verde Taragüi Menta Poleo",   image: "https://statics.dinoonline.com.ar/imagenes/large_460x460/2020123_l.jpg", price: 890, qty: 2 },
      ],
    },
    {
      id: "order_seed_004", cartId: "cart_seed_004", status: "CONFIRMED", shippingId: "ship_transit_002", daysAgo: 14, shippingCost: 4200,
      items: [
        { productId: "prod_003", name: "Mate Calabaza Imperial Curado",  image: "https://acdn-us.mitiendanube.com/stores/005/262/890/products/imp1-539d6d4d80116ffbce17316867237631-640-0.webp",  price: 4500, qty: 1 },
        { productId: "prod_005", name: "Termo Stanley Classic Verde",    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvAwrS7ZrOMVhlT5P3R-Jl87w46X7PWJ5vWg&s", price: 28000, qty: 1 },
      ],
    },
    {
      id: "order_seed_005", cartId: "cart_seed_005", status: "CONFIRMED", shippingId: "ship_delivered_001", daysAgo: 30, shippingCost: 1500,
      items: [
        { productId: "prod_011", name: "Café Sidamo Etiopía Natural",    image: "https://beanswithoutborders.com/cdn/shop/files/No-text-Ethiopia-sidama-coffee-beans-natural-flavor.png?v=1767841523&width=1445", price: 5200, qty: 1 },
        { productId: "prod_002", name: "Yerba Mate CBSé Energía Pomelo", image: "https://http2.mlstatic.com/D_NQ_NP_927424-MLU72565713266_112023-O.webp", price: 3100, qty: 2 },
      ],
    },
    {
      id: "order_seed_006", cartId: "cart_seed_006", status: "CONFIRMED", shippingId: "ship_delivered_002", daysAgo: 45, shippingCost: 2800,
      items: [
        { productId: "prod_007", name: "Set Mate + Bombilla Artesanal",  image: "https://acdn-us.mitiendanube.com/stores/003/024/004/products/img_5168-877e4a2f4754a8696517423171106674-480-0.webp", price: 5800, qty: 1 },
      ],
    },
    {
      id: "order_seed_007", cartId: "cart_seed_007", status: "CANCELLED", shippingId: null, daysAgo: 20, shippingCost: 0,
      items: [
        { productId: "prod_012", name: "Yerba Mate Amanda Tradicional",  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVIE1QfLr6Wxp4HxU_Xon0389jiolMPKQUPw&s", price: 4200, qty: 1 },
      ],
    },
    {
      id: "order_seed_008", cartId: "cart_seed_008", status: "CONFIRMED", shippingId: "ship_incident_001", daysAgo: 10, shippingCost: 1500,
      items: [
        { productId: "prod_008", name: "Hierbas para Tereré Frío",       image: "https://jesper.com.ar/wp-content/uploads/2023/04/te-verde-terere-bolsa500g.jpg", price: 1650, qty: 2 },
        { productId: "prod_009", name: "Café Yirgacheffe Etiopía",       image: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", price: 4800, qty: 1 },
      ],
    },
  ];

  for (const o of ORDERS) {
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);

    await prisma.cart.upsert({
      where: { id: o.cartId },
      create: {
        id: o.cartId, userId: clientId, status: "CHECKED_OUT", createdAt,
        items: {
          create: o.items.map((item) => ({
            productId: item.productId, productName: item.name,
            productImageUrl: item.image, priceAtTime: item.price, quantity: item.qty,
          })),
        },
      },
      update: {},
    });

    await prisma.purchaseOrder.upsert({
      where: { id: o.id },
      create: {
        id: o.id, cartId: o.cartId, userId: clientId,
        status: o.status, userAddress: demoAddress,
        shippingId: o.shippingId, createdAt,
      },
      update: {},
    });

    if (o.shippingCost > 0) {
      const amount = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      await prisma.package.upsert({
        where: { id: `pkg_seed_${o.id}` },
        create: {
          id: `pkg_seed_${o.id}`,
          purchaseOrderId: o.id,
          sellerId: "seller_001",
          buyerId: clientId,
          amount,
          shippingCost: o.shippingCost,
          shippingId: o.shippingId,
          createdAt,
        },
        update: {},
      });
    }
  }
  console.log(`  ${ORDERS.length} demo orders upserted`);

  console.log(`\nSeed complete. Test password: ${TEST_PASSWORD}`);
  console.log(`  admin@infusio.com   → ${adminClerk.id}`);
  console.log(`  cliente@infusio.com → ${clientClerk.id}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
