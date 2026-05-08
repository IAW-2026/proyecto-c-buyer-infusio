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
];

async function main() {
  // Remove old placeholder records so real Clerk IDs can take over
  await prisma.user.deleteMany({
    where: { id: { in: ["user_seed_admin_001", "user_seed_client_001"] } },
  });

  async function upsertUser(clerkId: string, name: string, lastName: string, email: string, role: UserRole) {
    // Remove any stale record with the same email but a different ID before upserting.
    await prisma.user.deleteMany({ where: { email, NOT: { id: clerkId } } });
    await prisma.user.upsert({
      where: { id: clerkId },
      update: {},
      create: { id: clerkId, name, lastName, email, role },
    });
  }

  const adminClerk = await findOrCreateClerkUser("admin@infusio.com", "Admin", "Infusio", "admin_infusio");
  await upsertUser(adminClerk.id, "Admin", "Infusio", "admin@infusio.com", UserRole.ADMIN);

  const clientClerk = await findOrCreateClerkUser("cliente@infusio.com", "Cliente", "Prueba", "cliente_prueba");
  await upsertUser(clientClerk.id, "Cliente", "Prueba", "cliente@infusio.com", UserRole.CLIENT);

  for (const p of PRODUCTS) {
    await prisma.product.upsert({ where: { id: p.id }, create: p, update: p });
  }
  console.log(`  ${PRODUCTS.length} products upserted`);

  console.log(`\nSeed complete. Test password: ${TEST_PASSWORD}`);
  console.log(`  admin@infusio.com   → ${adminClerk.id}`);
  console.log(`  cliente@infusio.com → ${clientClerk.id}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
