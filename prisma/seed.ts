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
  { id: "prod_001", sellerId: "seller_001", name: "Yerba Mate Rosamonte Especial", description: "Yerba mate suave y equilibrada, ideal para cebar mate largo. Elaborada en Corrientes.", categories: ["yerba mate", "infusiones"], price: 2850, stock: 120, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp", location: "Corrientes, Argentina", isLimitedEdition: false },
  { id: "prod_002", sellerId: "seller_001", name: "Yerba Mate CBSé Energía Pomelo", description: "Yerba con extracto de pomelo y guaraná. Sabor cítrico refrescante.", categories: ["yerba mate", "saborizadas", "infusiones"], price: 3100, stock: 85, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_927424-MLU72565713266_112023-O.webp", location: "Corrientes, Argentina", isLimitedEdition: false },
  { id: "prod_003", sellerId: "seller_002", name: "Mate Calabaza Imperial Curado", description: "Mate artesanal curado con yerba, metal plateado.", categories: ["mates", "accesorios"], price: 4500, stock: 30, unit: "250ML", imageUrl: "https://acdn-us.mitiendanube.com/stores/005/262/890/products/imp1-539d6d4d80116ffbce17316867237631-640-0.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_004", sellerId: "seller_002", name: "Bombilla Acero Inoxidable Pico de Loro", description: "Filtro superior, tubo recto, apta para lavavajillas.", categories: ["bombillas", "accesorios"], price: 1200, stock: 200, unit: "ACERO INOX", imageUrl: "https://acdn-us.mitiendanube.com/stores/004/274/329/products/pico-de-loro-acero-1-d208ed4b8e792db12617592794656043-1024-1024.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_005", sellerId: "seller_003", name: "Termo Stanley Classic Verde", description: "Vacío doble pared, mantiene temperatura 24h. Original USA.", categories: ["termos", "accesorios"], price: 28000, stock: 15, unit: "1L", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvAwrS7ZrOMVhlT5P3R-Jl87w46X7PWJ5vWg&s", location: "Ciudad Autónoma de Buenos Aires", isLimitedEdition: false },
  { id: "prod_006", sellerId: "seller_003", name: "Té Verde Taragüi Menta Poleo", description: "Saquitos de té verde con menta poleo, antioxidante natural.", categories: ["tés", "infusiones"], price: 890, stock: 300, unit: "x20 SAQUITOS", imageUrl: "https://statics.dinoonline.com.ar/imagenes/large_460x460/2020123_l.jpg", location: "Entre Ríos, Argentina", isLimitedEdition: false },
  { id: "prod_007", sellerId: "seller_002", name: "Set Mate + Bombilla Artesanal", description: "Combo mate de madera pintada + bombilla alpaca. Ideal para regalo.", categories: ["mates", "accesorios", "combos"], price: 5800, stock: 5, unit: "SET COMPLETO", imageUrl: "https://acdn-us.mitiendanube.com/stores/003/024/004/products/img_5168-877e4a2f4754a8696517423171106674-480-0.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_008", sellerId: "seller_004", name: "Hierbas para Tereré Frío", description: "Mezcla de hierbas medicinales para preparar tereré frío tradicional.", categories: ["tereré", "infusiones"], price: 1650, stock: 0, unit: "300G", imageUrl: "https://jesper.com.ar/wp-content/uploads/2023/04/te-verde-terere-bolsa500g.jpg", location: "Misiones, Argentina", isLimitedEdition: false },
  { id: "prod_009", sellerId: "seller_005", name: "Café Yirgacheffe Etiopía", description: "Notas florales de jazmín y limón, acidez brillante. Perfil de tueste claro.", categories: ["café"], price: 4800, stock: 40, unit: "250G / GRANO", imageUrl: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", location: "Etiopía", isLimitedEdition: false },
  { id: "prod_010", sellerId: "seller_005", name: "Espresso Blend Brasileño", description: "Cuerpo intenso con notas de chocolate y frutos secos. Equilibrado y dulce.", categories: ["café"], price: 3600, stock: 60, unit: "1KG / MOLIDO", imageUrl: "https://www.connectroasters.com/cdn/shop/files/Connect112125-8.jpg?v=1763930646&width=1946", location: "Minas Gerais, Brasil", isLimitedEdition: false },
  { id: "prod_011", sellerId: "seller_005", name: "Café Sidamo Etiopía Natural", description: "Proceso natural, notas de frutas rojas y chocolate oscuro. Tueste medio.", categories: ["café"], price: 5200, stock: 20, unit: "250G / GRANO", imageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-Ethiopia-sidama-coffee-beans-natural-flavor.png?v=1767841523&width=1445", location: "Etiopía", isLimitedEdition: false },
  { id: "prod_012", sellerId: "seller_001", name: "Yerba Mate Amanda Tradicional", description: "Cosecha tardía de hojas seleccionadas, estacionada 24 meses. Perfil intenso.", categories: ["yerba mate", "infusiones"], price: 4200, stock: 18, unit: "500G", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVIE1QfLr6Wxp4HxU_Xon0389jiolMPKQUPw&s", location: "Corrientes, Argentina", isLimitedEdition: false },
  // ─── Accessories ─────────────────────────────────────────────────────────────
  { id: "prod_013", sellerId: "seller_002", name: "Mate de Cerámica Artesanal", description: "Mate torneado a mano en taller ceramista porteño. Esmaltado con terminación mate, borde de acero inoxidable para mayor durabilidad.", categories: ["mates", "accesorios"], price: 6500, stock: 24, unit: "350ML", imageUrl: "https://http2.mlstatic.com/D_708204-MLA41405319123_042020-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#f2ede0", "#8b7355", "#2c2c2c"], specs: { materials: "Cerámica esmaltada, borde de acero inoxidable", capacity: "350 ml", dimensions: { height: "10 cm", diameter: "8 cm" }, care: "Lavar a mano con agua tibia. No apto para microondas ni lavavajillas." } },
  { id: "prod_014", sellerId: "seller_002", name: "Mate de Palo Santo", description: "Tallado en madera de palo santo curada artesanalmente. Aporta un aroma suave y único a cada cebada.", categories: ["mates", "accesorios"], price: 8900, stock: 12, unit: "300ML", imageUrl: "https://http2.mlstatic.com/D_827510-MLA79136088203_092024-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#c8a96e", "#5c3d1e"], specs: { materials: "Madera de palo santo curada, base de acero inoxidable", capacity: "300 ml", dimensions: { height: "9 cm", diameter: "7 cm" }, care: "Limpiar en seco o con trapo húmedo. Curar con yerba antes del primer uso. Evitar agua prolongada." } },
  { id: "prod_015", sellerId: "seller_002", name: "Bombilla de Plata 925", description: "Bombilla artesanal de plata 925 maciza, con filtro de malla tejida a mano. Para quienes no resignan la experiencia.", categories: ["bombillas", "accesorios"], price: 12000, stock: 8, unit: "PLATA 925", imageUrl: "https://http2.mlstatic.com/D_707519-MLA85730056086_062025-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#e8e4dc"], specs: { materials: "Plata 925 maciza, filtro de malla tejida a mano", dimensions: { length: "18 cm", width: "7 mm" }, care: "Lavar con cepillo fino luego de cada uso. Evitar lavavajillas y detergentes agresivos." } },
  { id: "prod_016", sellerId: "seller_002", name: "Kit de Iniciación Mate", description: "Todo lo que necesitás para empezar a cebar mate: mate de cerámica curado, bombilla de acero y 200g de yerba orgánica seleccionada.", categories: ["mates", "accesorios", "combos"], price: 9800, stock: 18, unit: "SET COMPLETO", imageUrl: "https://http2.mlstatic.com/D_920694-MLA50437530963_062022-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#f2ede0", "#8b7355"], specs: { materials: "Cerámica, acero inoxidable, yerba orgánica seleccionada", capacity: "350 ml", care: "Incluye guía de curado paso a paso. Ver instrucciones del kit antes del primer uso." } },
  { id: "prod_017", sellerId: "seller_003", name: "Termo Doble Pared 1L Negro", description: "Termo de vacío doble pared en acero inoxidable 316L. Mantiene la temperatura ideal para el mate durante 24 horas.", categories: ["termos", "accesorios"], price: 15000, stock: 20, unit: "1L", imageUrl: "https://http2.mlstatic.com/D_NQ_NP_711960-MLA105356759167_012026-OO.png", location: "Ciudad Autónoma de Buenos Aires", isLimitedEdition: false, colors: ["#1a1a1a", "#e8e4dc", "#6b8e6b"], specs: { materials: "Acero inoxidable 316L interior, exterior termoplástico libre de BPA", capacity: "1000 ml", dimensions: { height: "32 cm" }, care: "Lavar con agua y jabón suave. No apto para lavavajillas. Secar bien antes de cerrar." } },
  { id: "prod_018", sellerId: "seller_002", name: "Mate Vidrio con Funda de Cuero", description: "Mate de vidrio borosilicato con funda de cuero vegano cosida a mano. Permite ver la yerba en cada cebada.", categories: ["mates", "accesorios"], price: 7200, stock: 15, unit: "400ML", imageUrl: "https://http2.mlstatic.com/D_683124-MLA74325930283_012024-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#2c5f2e", "#1a1a1a"], specs: { materials: "Vidrio borosilicato resistente, funda de cuero vegano cosido a mano", capacity: "400 ml", dimensions: { height: "11 cm", diameter: "8 cm" }, care: "Vidrio apto para lavavajillas. Limpiar funda con trapo húmedo, no sumergir en agua." } },
  // ─── Machines ────────────────────────────────────────────────────────────────
  { id: "prod_019", sellerId: "seller_005", name: "Moka Express 3 Tazas", description: "La cafetera de aluminio de origen italiano que definió el café de hogar. Produce un espresso intenso y aromático en la hornalla.", categories: ["máquinas", "café"], price: 8500, stock: 35, unit: "3 TAZAS", imageUrl: "https://http2.mlstatic.com/D_817045-MLA92323647773_092025-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Aluminio alimentario fundido, junta de silicona apta para alimentos", capacity: "150 ml", dimensions: { height: "19 cm" }, care: "Enjuagar con agua fría tras cada uso. No lavar con detergente los primeros meses para preservar el curado natural." } },
  { id: "prod_020", sellerId: "seller_005", name: "Prensa Francesa 350ml", description: "Método clásico de inmersión para un café de cuerpo pleno y aceites naturales intactos. Ideal para molienda gruesa.", categories: ["máquinas", "café"], price: 5800, stock: 28, unit: "350ML", imageUrl: "https://http2.mlstatic.com/D_993430-MLA51001355957_082022-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Vidrio borosilicato reforzado, estructura y pistón de acero inoxidable", capacity: "350 ml", care: "Apto lavavajillas. Desmontar el pistón para limpieza profunda y evitar residuos de aceite." } },
  { id: "prod_021", sellerId: "seller_005", name: "Chemex 6 Tazas", description: "Ícono del diseño americano. El filtro grueso retiene aceites y produce un café limpio, floral y de alta claridad.", categories: ["máquinas", "café"], price: 14500, stock: 10, unit: "6 TAZAS", imageUrl: "https://http2.mlstatic.com/D_682066-MLA89286303058_082025-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Vidrio borosilicato de alta pureza, aro de madera natural con lazo de cuero", capacity: "900 ml", dimensions: { height: "23 cm" }, care: "Lavar con agua caliente y jabón suave. Secado al aire. No apto para microondas." } },
  { id: "prod_022", sellerId: "seller_005", name: "Molinillo Manual Cerámica", description: "Burr cónico de cerámica para molienda precisa y uniforme. Ajuste escalonado de 18 niveles para todos los métodos.", categories: ["máquinas", "accesorios"], price: 11000, stock: 16, unit: "MANUAL", imageUrl: "https://http2.mlstatic.com/D_614158-MLA89952426337_082025-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Burr cerámico cónico, cuerpo y receptáculo de acero inoxidable", dimensions: { height: "24 cm", width: "7 cm" }, care: "Limpiar el burr mensualmente con cepillo seco. No lavar con agua para evitar corrosión de las muelas." } },
  { id: "prod_023", sellerId: "seller_005", name: "Hervidor Variable 1.5L", description: "Control de temperatura en 5 rangos para cada método: 60 °C para té verde, 80 °C para té blanco, 100 °C para mate y espresso.", categories: ["máquinas", "accesorios"], price: 18000, stock: 22, unit: "1.5L", imageUrl: "https://http2.mlstatic.com/D_725494-MLA73210258439_122023-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: [], specs: { materials: "Interior de acero inoxidable 304, exterior termoplástico libre de BPA", capacity: "1500 ml", care: "Descalcificar mensualmente con solución de agua y vinagre blanco. Base eléctrica: mantener la superficie seca." } },
  // ─── Tés & Infusiones ─────────────────────────────────────────────────────────
  { id: "prod_024", sellerId: "seller_006", name: "Té Verde Premium", description: "Hojas enteras de té verde de cosecha temprana. Notas de pasto fresco y melón. Bajo en taninos, perfecto para el mediodía.", categories: ["tés", "infusiones"], price: 2800, stock: 60, unit: "50G / SUELTO", imageUrl: "https://http2.mlstatic.com/D_840131-MLA72599852952_112023-O.jpg", location: "Misiones, Argentina", isLimitedEdition: false },
  { id: "prod_025", sellerId: "seller_001", name: "Yerba Mate Especial", description: "Blend premium con palo seleccionado, estacionada 18 meses. Sabor suave y persistente, ideal para el mate del día.", categories: ["yerba mate", "infusiones"], price: 3200, stock: 90, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_729881-MLA45891728481_052021-O.jpg", location: "Corrientes, Argentina", isLimitedEdition: false },
  { id: "prod_026", sellerId: "seller_005", name: "Café Molido Gourmet", description: "Mezcla de arábica colombiano y brasileño, tueste medio-oscuro. Cuerpo pleno con notas de caramelo y nuez tostada.", categories: ["café"], price: 5400, stock: 45, unit: "250G / MOLIDO", imageUrl: "https://http2.mlstatic.com/D_817704-MLA89650881878_082025-O.jpg", location: "Colombia", isLimitedEdition: false },
  { id: "prod_027", sellerId: "seller_006", name: "Set de Infusiones Herbales", description: "Selección de 5 variedades de hierbas medicinales: manzanilla, menta, tilo, boldo y melisa. Presentación en caja kraft.", categories: ["tés", "infusiones", "combos"], price: 4200, stock: 25, unit: "SET COMPLETO", imageUrl: "https://http2.mlstatic.com/D_739265-MLA42615586116_072020-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_028", sellerId: "seller_006", name: "Té Negro Assam", description: "Té de cuerpo robusto y color cobrizo intenso. Maltoso y vigorizante. Ideal con leche o solo al desayuno.", categories: ["tés", "infusiones"], price: 1900, stock: 80, unit: "100G", imageUrl: "https://http2.mlstatic.com/D_716036-MLA47804007429_102021-O.webp", location: "Assam, India", isLimitedEdition: false },
  { id: "prod_029", sellerId: "seller_005", name: "Café Blend Especial", description: "Gran formato para cafeteros cotidianos. Blend de Huila y Nariño, acidez brillante y postgusto largo.", categories: ["café"], price: 8900, stock: 30, unit: "500G / GRANO", imageUrl: "https://http2.mlstatic.com/D_879463-MLA45741550943_042021-O.webp", location: "Colombia", isLimitedEdition: false },
  { id: "prod_030", sellerId: "seller_001", name: "Yerba Mate Premium", description: "Gran formato sin palo, hoja fina seleccionada. Estacionada 24 meses. Para quienes ceben todos los días.", categories: ["yerba mate", "infusiones"], price: 4500, stock: 70, unit: "1KG", imageUrl: "https://http2.mlstatic.com/D_750268-MLA89465354811_082025-O.webp", location: "Misiones, Argentina", isLimitedEdition: false },
  { id: "prod_031", sellerId: "seller_002", name: "Bombilla de Acero Inox.", description: "Bombilla clásica de acero inoxidable 304. Filtro de malla fina, apta para yerba con palo y sin palo. Incluye limpiabarrilla.", categories: ["bombillas", "accesorios"], price: 2100, stock: 150, unit: "ACERO INOX", imageUrl: "https://http2.mlstatic.com/D_636173-MLA70578947416_072023-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_032", sellerId: "seller_006", name: "Infusión de Manzanilla", description: "Flores secas de manzanilla alemana. Reconfortante, digestiva y suavemente floral. Sin cafeína.", categories: ["tés", "infusiones"], price: 1200, stock: 120, unit: "30 SAQUITOS", imageUrl: "https://http2.mlstatic.com/D_940625-MLA92661835645_092025-O.webp", location: "Argentina", isLimitedEdition: false },
  { id: "prod_033", sellerId: "seller_006", name: "Té de Rosa Mosqueta", description: "Frutos secos de rosa mosqueta patagónica, ricos en vitamina C. Sabor suavemente ácido y afrutado, sin cafeína.", categories: ["tés", "infusiones"], price: 1400, stock: 100, unit: "25 SAQUITOS", imageUrl: "https://http2.mlstatic.com/D_778843-MLA46246609076_062021-O.jpg", location: "Patagonia, Argentina", isLimitedEdition: false },
  { id: "prod_034", sellerId: "seller_002", name: "Gift Box Premium Infusio", description: "Caja regalo curada: mate artesanal, bombilla de alpaca, 3 variedades de yerba y mezcla de tés seleccionada. El regalo perfecto.", categories: ["mates", "accesorios", "combos"], price: 12000, stock: 10, unit: "SET COMPLETO", imageUrl: "https://http2.mlstatic.com/D_613941-MLA43782541560_102020-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false },
  { id: "prod_035", sellerId: "seller_006", name: "Té Rojo Pu-erh", description: "Té fermentado post-oxidado de Yunnan. Notas terrosas y dulces, sabor profundo y complejo. Mejora con el tiempo de guarda.", categories: ["tés", "infusiones"], price: 3800, stock: 35, unit: "100G", imageUrl: "https://http2.mlstatic.com/D_872560-MLA69503085271_052023-O.jpg", location: "Yunnan, China", isLimitedEdition: false },
  { id: "prod_036", sellerId: "seller_005", name: "Café Arábica Colombia", description: "Origen único de Huila, proceso lavado. Notas de ciruela, panela y mandarina. Acidez media, cuerpo sedoso.", categories: ["café"], price: 6200, stock: 40, unit: "250G / GRANO", imageUrl: "https://http2.mlstatic.com/D_707096-MLA88936372426_082025-O.webp", location: "Huila, Colombia", isLimitedEdition: false },
  // ─── More Accessories & Machines (pagination testing) ────────────────────────
  { id: "prod_037", sellerId: "seller_002", name: "Mate Cerámico con Asa", description: "Mate ergonómico con asa lateral, ideal para quienes prefieren sostenerlo sin quemarse. Esmaltado interior total, fácil de limpiar.", categories: ["mates", "accesorios"], price: 7800, stock: 18, unit: "400ML", imageUrl: "https://http2.mlstatic.com/D_809718-MLA76532756982_052024-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#d9c4a8", "#7a5c3e", "#2c2c2c"], specs: { materials: "Cerámica esmaltada, asa ergonómica integrada", capacity: "400 ml", dimensions: { height: "11 cm", diameter: "8.5 cm" }, care: "Apto lavavajillas. No requiere curado." } },
  { id: "prod_038", sellerId: "seller_002", name: "Bombilla Pico de Loro Dorada", description: "Punta curva en acero inoxidable con terminación dorada PVD para mejor filtrado de yerbas sin palo.", categories: ["bombillas", "accesorios"], price: 3200, stock: 40, unit: "ACERO / GOLD", imageUrl: "https://http2.mlstatic.com/D_900710-MLA83206210383_032025-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#c9a84c"], specs: { materials: "Acero inoxidable 304 con baño de oro PVD", dimensions: { length: "19 cm" }, care: "Lavar con cepillo fino. El baño PVD es resistente pero evitar abrasivos." } },
  { id: "prod_039", sellerId: "seller_003", name: "Termo Mateador 800ml Hueso", description: "Boquilla lateral giratoria para puntear agua sin levantar el termo. Doble pared acero 316L, mantiene temperatura 18 h.", categories: ["termos", "accesorios"], price: 16500, stock: 25, unit: "800ML", imageUrl: "https://http2.mlstatic.com/D_889699-MLA109991366930_042026-O.webp", location: "Ciudad Autónoma de Buenos Aires", isLimitedEdition: false, colors: ["#e8e4dc", "#2c2c2c", "#6b8e6b"], specs: { materials: "Acero inoxidable 316L, boquilla lateral rotativa", capacity: "800 ml", dimensions: { height: "29 cm" }, care: "Lavar a mano. Boquilla desmontable para limpieza. No apto para lavavajillas." } },
  { id: "prod_040", sellerId: "seller_002", name: "Set Bombillas Artesanales x3", description: "Trío artesanal: pico de loro, espiral y vertedor. Cada una con funda de algodón orgánico. Para distintos tipos de yerba.", categories: ["bombillas", "accesorios", "combos"], price: 7500, stock: 15, unit: "SET x3", imageUrl: "https://http2.mlstatic.com/D_970612-MLA109987308298_042026-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, specs: { materials: "Acero inoxidable y alpaca, fundas de algodón orgánico", care: "Ver instrucciones individuales de cada bombilla." } },
  { id: "prod_041", sellerId: "seller_005", name: "Kit Barista Portátil V60", description: "Dripper plegable V60, molinillo de cerámica compacto y 50 filtros blanqueados. Todo en un bolso de lona. Para café de especialidad en cualquier lugar.", categories: ["máquinas", "accesorios", "combos"], price: 22000, stock: 10, unit: "SET COMPLETO", imageUrl: "https://http2.mlstatic.com/D_909369-MLA89128251045_082025-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, specs: { materials: "Plástico alimentario (dripper), cerámica (burr), papel sin blanquear (filtros)", care: "Limpiar por separado según instrucciones de cada componente." } },
  { id: "prod_042", sellerId: "seller_005", name: "Alfombrilla Tamper con Reborde", description: "Base de silicona con reborde que protege el portafiltros durante el prensado. Antideslizante, esquinas redondeadas.", categories: ["máquinas", "accesorios"], price: 2800, stock: 50, unit: "23CM", imageUrl: "https://http2.mlstatic.com/D_623780-MLA31020404933_062019-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#1a1a1a", "#e8e4dc"], specs: { materials: "Silicona alimentaria libre de BPA", dimensions: { width: "23 cm", depth: "16 cm" }, care: "Apto lavavajillas (cesta superior). Resistente hasta 230 °C." } },
  { id: "prod_043", sellerId: "seller_005", name: "Distribuidor Nivelador 58mm", description: "Distribución pareja del café molido antes de prensar. Profundidad ajustable en 3 niveles para distintas dosis.", categories: ["máquinas", "accesorios"], price: 5200, stock: 30, unit: "58MM", imageUrl: "https://http2.mlstatic.com/D_720751-MLA78280094409_082024-O.webp", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#c0c0c0", "#1a1a1a"], specs: { materials: "Aluminio anodizado CNC con pins de acero inoxidable", dimensions: { diameter: "58 mm" }, care: "Limpiar con paño seco. Evitar agua directa en el mecanismo ajustable." } },
  { id: "prod_044", sellerId: "seller_002", name: "Cucharita Medidora de Yerba", description: "Cucharita de quebracho torneada a mano. Medición exacta de 8 g — la porción ideal para un mate cargado.", categories: ["mates", "accesorios"], price: 900, stock: 100, unit: "8G PORCIÓN", imageUrl: "https://http2.mlstatic.com/D_761314-MLA94698288897_102025-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#a07850"], specs: { materials: "Madera de quebracho torneada a mano", dimensions: { length: "12 cm" }, care: "Limpiar con trapo seco. No sumergir en agua." } },
  { id: "prod_045", sellerId: "seller_003", name: "Portatermos de Cuero Vegano", description: "Funda artesanal de cuero vegano con asa de cuerda. Compatible con cualquier termo de hasta 1 L y 8 cm de diámetro.", categories: ["termos", "accesorios"], price: 4800, stock: 20, unit: "TALLA ÚNICA", imageUrl: "https://http2.mlstatic.com/D_811981-MLA44961222151_022021-O.jpg", location: "Buenos Aires, Argentina", isLimitedEdition: false, colors: ["#3b2a1e", "#c4956a", "#1a1a1a"], specs: { materials: "Cuero vegano cosido a mano, forro de algodón, asa trenzada", dimensions: { diameter: "max 8 cm", height: "max 35 cm" }, care: "Limpiar con trapo húmedo. Nutrir cada 3 meses con acondicionador vegano." } },
  { id: "prod_046", sellerId: "seller_002", name: "Mate de Calabaza Natural Curado", description: "Calabaza curada a mano con yerba orgánica. Aro y base de acero inoxidable para mayor durabilidad. Cada mate es único.", categories: ["mates", "accesorios"], price: 3800, stock: 35, unit: "250ML", imageUrl: "https://http2.mlstatic.com/D_803954-MLA81306879093_122024-O.jpg", location: "Corrientes, Argentina", isLimitedEdition: false, specs: { materials: "Calabaza natural curada, aro y base de acero inoxidable", capacity: "250 ml", care: "Curar antes del primer uso. Secar boca abajo. Reemplazar yerba de curado tras 24 hs." } },
  // ─── Limited Editions ────────────────────────────────────────────────────────
  { id: "prod_le_001", sellerId: "seller_006", name: "Matcha Ceremonial Primera Cosecha", description: "Hojas de la primera cosecha de primavera japonesa, molidas a piedra. Color verde intenso, sabor umami y dulce natural. El matcha más fino que importamos.", categories: ["tés", "infusiones"], price: 6800, stock: 20, unit: "30G / POLVO", imageUrl: "https://http2.mlstatic.com/D_875263-MLA92715836535_092025-O.webp", location: "Uji, Japón", isLimitedEdition: true, badge: "COSECHA ÚNICA", availableUntil: new Date("2026-06-30") },
  { id: "prod_le_002", sellerId: "seller_005", name: "Café Geisha Panamá Washed", description: "La variedad más buscada del mundo. Origen único de Boquete, proceso lavado. Notas de jazmín, bergamota y durazno blanco. Disponibilidad extremadamente limitada.", categories: ["café"], price: 9200, stock: 12, unit: "100G / GRANO", imageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-Antigua-coffee-beans.png", location: "Boquete, Panamá", isLimitedEdition: true, badge: "EDICIÓN RARA", availableUntil: new Date("2026-07-15") },
  { id: "prod_le_003", sellerId: "seller_001", name: "Yerba Mate Cosecha de Invierno 2026", description: "Lote especial cosechado en mayo, antes de las heladas. Hojas finas seleccionadas a mano, estacionadas 12 meses. Sabor intenso con notas ahumadas y terrosas.", categories: ["yerba mate", "infusiones"], price: 5100, stock: 30, unit: "500G", imageUrl: "https://http2.mlstatic.com/D_744183-MLA28021944563_082018-O.jpg", location: "Misiones, Argentina", isLimitedEdition: true, badge: "LOTE ESPECIAL", availableUntil: new Date("2026-07-31") },
  { id: "prod_le_004", sellerId: "seller_005", name: "Café Kenia AA Washed — Lote 3", description: "Tercer lote del año de nuestra finca en Nyeri. Proceso lavado doble fermentación. Notas de grosella negra, tomate cherry y dulce de leche. Acidez brillante característica keniana.", categories: ["café"], price: 7400, stock: 18, unit: "250G / GRANO", imageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-African-kahawa-blend-coffee-toffee-fruit-beans.png", location: "Nyeri, Kenia", isLimitedEdition: true, badge: "LOTE ESPECIAL", availableUntil: new Date("2026-08-15") },
  { id: "prod_le_005", sellerId: "seller_006", name: "Blend Patagónico de Invierno", description: "Mezcla artesanal de rosa mosqueta patagónica, escaramujo, manzanilla de altura y jengibre seco. Cálida, reconfortante, sin cafeína. Formulada especialmente para la temporada fría.", categories: ["tés", "infusiones"], price: 4600, stock: 25, unit: "80G / SUELTO", imageUrl: "https://http2.mlstatic.com/D_814403-MLA76201219221_052024-O.webp", location: "Patagonia, Argentina", isLimitedEdition: true, badge: "TEMPORADA", availableUntil: new Date("2026-09-01") },
  { id: "prod_le_006", sellerId: "seller_006", name: "Té Blanco Buds de Primavera", description: "Solo los brotes tiernos de la planta de té, cosechados a mano dos días al año. Sabor delicado, floral y levemente dulce. El té más suave y antioxidante de nuestra selección.", categories: ["tés", "infusiones"], price: 5800, stock: 15, unit: "25G / BROTES", imageUrl: "https://http2.mlstatic.com/D_713468-MLA71681616483_092023-O.jpg", location: "Fujian, China", isLimitedEdition: true, badge: "COSECHA ÚNICA", availableUntil: new Date("2026-09-30") },
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

  // ─── Orders for cliente@infusio.com (every possible status) ─────────────────
  await prisma.package.deleteMany({ where: { purchaseOrderId: { startsWith: "order_client_" } } });
  await prisma.purchaseOrder.deleteMany({ where: { userId: clientClerk.id, id: { startsWith: "order_client_" } } });
  await prisma.cart.deleteMany({ where: { id: { startsWith: "cart_client_" } } });

  const clientUserId = clientClerk.id;

  // seller_001 origin: Lavalle 234, Corrientes · seller_005 origin: Thames 1445, Palermo, CABA
  const CLIENT_ORDERS: {
    id: string; cartId: string;
    status: "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "CANCELLED";
    shippingId: string | null; daysAgo: number; shippingCost: number;
    sellerId: string;
    userAddress: { street: string; city: string; province: string; postalCode: string };
    items: { productId: string; name: string; image: string | null; price: number; qty: number }[];
  }[] = [
    // 1. CONFIRMED — SHIP-CB78, seller_001 → Mendoza (oldest, 60 days ago)
    {
      id: "order_client_001", cartId: "cart_client_001", status: "CONFIRMED",
      shippingId: "SHIP-CB78", daysAgo: 60, shippingCost: 4200, sellerId: "seller_001",
      userAddress: { street: "Belgrano 890", city: "Mendoza", province: "Mendoza", postalCode: "5500" },
      items: [
        { productId: "prod_001", name: "Yerba Mate Rosamonte Especial", image: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp", price: 2850, qty: 3 },
        { productId: "prod_008", name: "Hierbas para Tereré Frío", image: "https://jesper.com.ar/wp-content/uploads/2023/04/te-verde-terere-bolsa500g.jpg", price: 1650, qty: 2 },
      ],
    },
    // 2. CONFIRMED — SHIP-6171, seller_005 → Posadas, Misiones (45 days ago)
    {
      id: "order_client_002", cartId: "cart_client_002", status: "CONFIRMED",
      shippingId: "SHIP-6171", daysAgo: 45, shippingCost: 3500, sellerId: "seller_005",
      userAddress: { street: "Av. Mitre 1234", city: "Posadas", province: "Misiones", postalCode: "3300" },
      items: [
        { productId: "prod_010", name: "Espresso Blend Brasileño", image: "https://www.connectroasters.com/cdn/shop/files/Connect112125-8.jpg?v=1763930646&width=1946", price: 3600, qty: 2 },
        { productId: "prod_022", name: "Molinillo Manual Cerámica", image: "https://http2.mlstatic.com/D_614158-MLA89952426337_082025-O.webp", price: 11000, qty: 1 },
      ],
    },
    // 3. CONFIRMED — SHIP-3B31, seller_005 → La Plata (30 days ago)
    {
      id: "order_client_003", cartId: "cart_client_003", status: "CONFIRMED",
      shippingId: "SHIP-3B31", daysAgo: 30, shippingCost: 800, sellerId: "seller_005",
      userAddress: { street: "Diagonal 73 Nro. 450", city: "La Plata", province: "Buenos Aires", postalCode: "1900" },
      items: [
        { productId: "prod_017", name: "Termo Doble Pared 1L Negro", image: "https://http2.mlstatic.com/D_NQ_NP_711960-MLA105356759167_012026-OO.png", price: 15000, qty: 1 },
      ],
    },
    // 4. CONFIRMED — SHIP-25CE, seller_001 → Rosario, Santa Fe (20 days ago)
    {
      id: "order_client_004", cartId: "cart_client_004", status: "CONFIRMED",
      shippingId: "SHIP-25CE", daysAgo: 20, shippingCost: 1500, sellerId: "seller_001",
      userAddress: { street: "Calle Florida 500", city: "Rosario", province: "Santa Fe", postalCode: "2000" },
      items: [
        { productId: "prod_012", name: "Yerba Mate Amanda Tradicional", image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVIE1QfLr6Wxp4HxU_Xon0389jiolMPKQUPw&s", price: 4200, qty: 3 },
      ],
    },
    // 5. CANCELLED — before payment (15 days ago)
    {
      id: "order_client_005", cartId: "cart_client_005", status: "CANCELLED",
      shippingId: null, daysAgo: 15, shippingCost: 0, sellerId: "seller_001",
      userAddress: { street: "Calle 7 Nro. 843", city: "La Plata", province: "Buenos Aires", postalCode: "1900" },
      items: [
        { productId: "prod_003", name: "Mate Calabaza Imperial Curado", image: "https://acdn-us.mitiendanube.com/stores/005/262/890/products/imp1-539d6d4d80116ffbce17316867237631-640-0.webp", price: 4500, qty: 1 },
      ],
    },
    // 6. CONFIRMED — SHIP-AEA5, seller_005 → Salta (14 days ago)
    {
      id: "order_client_006", cartId: "cart_client_006", status: "CONFIRMED",
      shippingId: "SHIP-AEA5", daysAgo: 14, shippingCost: 3000, sellerId: "seller_005",
      userAddress: { street: "Caseros 456", city: "Salta", province: "Salta", postalCode: "4400" },
      items: [
        { productId: "prod_011", name: "Café Sidamo Etiopía Natural", image: "https://beanswithoutborders.com/cdn/shop/files/No-text-Ethiopia-sidama-coffee-beans-natural-flavor.png?v=1767841523&width=1445", price: 5200, qty: 1 },
        { productId: "prod_036", name: "Café Arábica Colombia", image: "https://http2.mlstatic.com/D_707096-MLA88936372426_082025-O.webp", price: 6200, qty: 1 },
      ],
    },
    // 7. CONFIRMED — SHIP-5720, seller_005 → Neuquén (10 days ago)
    {
      id: "order_client_007", cartId: "cart_client_007", status: "CONFIRMED",
      shippingId: "SHIP-5720", daysAgo: 10, shippingCost: 3500, sellerId: "seller_005",
      userAddress: { street: "Av. Argentina 254", city: "Neuquén", province: "Neuquén", postalCode: "8300" },
      items: [
        { productId: "prod_009", name: "Café Yirgacheffe Etiopía", image: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", price: 4800, qty: 1 },
        { productId: "prod_022", name: "Molinillo Manual Cerámica", image: "https://http2.mlstatic.com/D_614158-MLA89952426337_082025-O.webp", price: 11000, qty: 1 },
      ],
    },
    // 8. CONFIRMED — SHIP-5ADF, seller_001 → Tucumán (8 days ago)
    {
      id: "order_client_008", cartId: "cart_client_008", status: "CONFIRMED",
      shippingId: "SHIP-5ADF", daysAgo: 8, shippingCost: 2000, sellerId: "seller_001",
      userAddress: { street: "Muñecas 671", city: "San Miguel de Tucumán", province: "Tucumán", postalCode: "4000" },
      items: [
        { productId: "prod_007", name: "Set Mate + Bombilla Artesanal", image: "https://acdn-us.mitiendanube.com/stores/003/024/004/products/img_5168-877e4a2f4754a8696517423171106674-480-0.webp", price: 5800, qty: 1 },
        { productId: "prod_004", name: "Bombilla Acero Inox Pico de Loro", image: "https://acdn-us.mitiendanube.com/stores/004/274/329/products/pico-de-loro-acero-1-d208ed4b8e792db12617592794656043-1024-1024.webp", price: 1200, qty: 1 },
      ],
    },
    // 9. CONFIRMED — SHIP-9512, seller_001 → Córdoba (5 days ago)
    {
      id: "order_client_009", cartId: "cart_client_009", status: "CONFIRMED",
      shippingId: "SHIP-9512", daysAgo: 5, shippingCost: 2500, sellerId: "seller_001",
      userAddress: { street: "Av. General Paz 1200", city: "Córdoba", province: "Córdoba", postalCode: "5000" },
      items: [
        { productId: "prod_002", name: "Yerba Mate CBSé Energía Pomelo", image: "https://http2.mlstatic.com/D_NQ_NP_927424-MLU72565713266_112023-O.webp", price: 3100, qty: 1 },
        { productId: "prod_008", name: "Hierbas para Tereré Frío", image: "https://jesper.com.ar/wp-content/uploads/2023/04/te-verde-terere-bolsa500g.jpg", price: 1650, qty: 2 },
      ],
    },
    // 10. AWAITING_PAYMENT — payment link sent (2 days ago)
    {
      id: "order_client_010", cartId: "cart_client_010", status: "AWAITING_PAYMENT",
      shippingId: null, daysAgo: 2, shippingCost: 0, sellerId: "seller_005",
      userAddress: { street: "Bv. Oroño 1500", city: "Rosario", province: "Santa Fe", postalCode: "2000" },
      items: [
        { productId: "prod_010", name: "Espresso Blend Brasileño", image: "https://www.connectroasters.com/cdn/shop/files/Connect112125-8.jpg?v=1763930646&width=1946", price: 3600, qty: 2 },
        { productId: "prod_009", name: "Café Yirgacheffe Etiopía", image: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", price: 4800, qty: 1 },
      ],
    },
    // 11. PENDING — just placed (today)
    {
      id: "order_client_011", cartId: "cart_client_011", status: "PENDING",
      shippingId: null, daysAgo: 0, shippingCost: 0, sellerId: "seller_001",
      userAddress: { street: "San Martín 340", city: "Mendoza", province: "Mendoza", postalCode: "5500" },
      items: [
        { productId: "prod_001", name: "Yerba Mate Rosamonte Especial", image: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp", price: 2850, qty: 2 },
        { productId: "prod_006", name: "Té Verde Taragüi Menta Poleo", image: "https://statics.dinoonline.com.ar/imagenes/large_460x460/2020123_l.jpg", price: 890, qty: 1 },
      ],
    },
  ];

  for (const o of CLIENT_ORDERS) {
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000);
    await prisma.cart.upsert({
      where: { id: o.cartId },
      create: {
        id: o.cartId, userId: clientUserId, status: "CHECKED_OUT", createdAt,
        items: { create: o.items.map((item) => ({ productId: item.productId, productName: item.name, productImageUrl: item.image, priceAtTime: item.price, quantity: item.qty })) },
      },
      update: {},
    });
    await prisma.purchaseOrder.upsert({
      where: { id: o.id },
      create: { id: o.id, cartId: o.cartId, userId: clientUserId, status: o.status, userAddress: o.userAddress, shippingId: o.shippingId, createdAt },
      update: {},
    });
    if (o.shippingCost > 0) {
      const amount = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      await prisma.package.upsert({
        where: { id: `pkg_client_${o.id}` },
        create: {
          id: `pkg_client_${o.id}`, purchaseOrderId: o.id, sellerId: o.sellerId, buyerId: clientUserId, amount, shippingCost: o.shippingCost, shippingId: o.shippingId, createdAt,
          items: {
            create: o.items.map((item) => ({
              productId: item.productId,
              productName: item.name,
              unitPrice: item.price,
              quantity: item.qty,
              subtotal: item.price * item.qty,
            })),
          },
        },
        update: {},
      });
    }
  }
  console.log(`  ${CLIENT_ORDERS.length} client orders upserted`);

  // ─── Favourites for cliente@infusio.com ──────────────────────────────────────
  const CLIENT_FAVOURITES = [
    { productId: "prod_009", productName: "Café Yirgacheffe Etiopía",      productImageUrl: "https://newsite.fazenda.com.ar/wp-content/uploads/2025/01/Cafe-Ethiopia-La-fazenda.webp", price: 4800, location: "Etiopía",                    categories: ["café"],                    description: "Notas florales de jazmín y limón, acidez brillante. Perfil de tueste claro." },
    { productId: "prod_001", productName: "Yerba Mate Rosamonte Especial", productImageUrl: "https://http2.mlstatic.com/D_NQ_NP_654535-MLA92396918908_092025-O.webp",                   price: 2850, location: "Corrientes, Argentina",       categories: ["yerba mate", "infusiones"], description: "Yerba mate suave y equilibrada, ideal para cebar mate largo." },
    { productId: "prod_013", productName: "Mate de Cerámica Artesanal",    productImageUrl: "https://http2.mlstatic.com/D_708204-MLA41405319123_042020-O.webp",                             price: 6500, location: "Buenos Aires, Argentina",     categories: ["mates", "accesorios"],     description: "Mate torneado a mano en taller ceramista porteño." },
    { productId: "prod_017", productName: "Termo Doble Pared 1L Negro",    productImageUrl: "https://http2.mlstatic.com/D_NQ_NP_711960-MLA105356759167_012026-OO.png",                   price: 15000, location: "Ciudad Autónoma de Buenos Aires", categories: ["termos", "accesorios"], description: "Termo de vacío doble pared en acero inoxidable 316L. Mantiene 24 h." },
    { productId: "prod_024", productName: "Té Verde Premium",              productImageUrl: "https://http2.mlstatic.com/D_840131-MLA72599852952_112023-O.jpg",                           price: 2800, location: "Misiones, Argentina",         categories: ["tés", "infusiones"],       description: "Hojas enteras de cosecha temprana. Notas de pasto fresco y melón." },
    { productId: "prod_le_002", productName: "Café Geisha Panamá Washed",  productImageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-Antigua-coffee-beans.png",           price: 9200, location: "Boquete, Panamá",             categories: ["café"],                    description: "La variedad más buscada del mundo. Notas de jazmín, bergamota y durazno blanco." },
  ];

  for (const fav of CLIENT_FAVOURITES) {
    await prisma.favouriteProduct.upsert({
      where: { userId_productId: { userId: clientUserId, productId: fav.productId } },
      create: { userId: clientUserId, ...fav },
      update: {},
    });
  }
  console.log(`  ${CLIENT_FAVOURITES.length} client favourites upserted`);

  // ─── Active cart for cliente@infusio.com (2 items, not checked out) ──────────
  await prisma.cart.upsert({
    where: { id: "cart_client_active" },
    create: { id: "cart_client_active", userId: clientUserId, status: "NOT_CHECKED_OUT" },
    update: { status: "NOT_CHECKED_OUT" },
  });
  await prisma.cartItem.deleteMany({ where: { cartId: "cart_client_active" } });
  await prisma.cartItem.createMany({
    data: [
      { cartId: "cart_client_active", productId: "prod_011", productName: "Café Sidamo Etiopía Natural", productImageUrl: "https://beanswithoutborders.com/cdn/shop/files/No-text-Ethiopia-sidama-coffee-beans-natural-flavor.png?v=1767841523&width=1445", priceAtTime: 5200, quantity: 1 },
      { cartId: "cart_client_active", productId: "prod_005", productName: "Termo Stanley Classic Verde",  productImageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvAwrS7ZrOMVhlT5P3R-Jl87w46X7PWJ5vWg&s",                                  priceAtTime: 28000, quantity: 1 },
    ],
  });
  console.log("  Active cart with 2 items upserted for cliente@infusio.com");

  console.log(`\nSeed complete. Test password: ${TEST_PASSWORD}`);
  console.log(`  admin@infusio.com   → ${adminClerk.id}`);
  console.log(`  cliente@infusio.com → ${clientClerk.id}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
