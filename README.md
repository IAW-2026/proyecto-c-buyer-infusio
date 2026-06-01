[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/8-wwxMvS)

Esta app corresponde al rol del comprador en los proyectos de tipo **C (Marketplace)**.

# Infusio — Buyer App

Aplicación de compras de **Infusio**, una tienda artesanal argentina de cafés de especialidad, tés, yerba mate e infusiones.

- Catálogo con filtros por categoría, búsqueda por texto y sección de ediciones limitadas con fecha de vencimiento
- Ficha detallada de cada producto con mapa de origen (productos consumibles)
- Carrito con checkout, validación de dirección a escala nacional y redirección al pago
- Seguimiento del envío en tiempo real desde el detalle de la orden
- Favoritos con opción de compartir la selección mediante enlace público
- Asistente virtual con IA (Groq) para descubrir productos y resolver dudas sobre la tienda
- Panel de administración con estadísticas de ventas, usuarios y comportamiento, potenciado por IA (Gemini)

**Deploy:** [https://proyecto-c-buyer-infusio.vercel.app](https://proyecto-c-buyer-infusio.vercel.app)

**Docs:** [https://github.com/IAW-2026/proyecto-c-buyer-infusio/tree/main/docs/tutorial](https://github.com/IAW-2026/proyecto-c-buyer-infusio/tree/main/docs/tutorial)

---

## Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@infusio.com | Infusio2024! |
| Usuario final | buyer+clerktest@iaw.com | iawuser# |

---

## Importante

- **Flujo de checkout:** El proceso de pago tiene tres pasos: el usuario confirma la orden → la app crea el pedido en el Seller App y obtiene una URL de pago → el usuario es redirigido al procesador de pagos externo. El retorno exitoso, fallido o pendiente es manejado por `PaymentToast`, que restaura el carrito si el pago fue fallido (la órden de pago dejó de existir). Esta app está conectada con el **Shipping App** desplegado, no a un mock local (el mock existe pero no lo utilizo), solo redirijo al usuario hacia su página para ver detalles de envío y políticas. 

## Notas

- **Lighthouse — Best Practices:** La puntuación de Best Practices en Lighthouse es inferior a la esperada. Esto se debe a scripts de terceros inyectados por **Clerk** que utilizan cookies sin el atributo `SameSite`, lo cual Lighthouse penaliza. No es un problema de código propio de la aplicación y no afecta la funcionalidad ni la seguridad del sistema.

- **Creación de usuarios (Clerk + base de datos):** Clerk gestiona las sesiones, pero los usuarios se registran en la base de datos recién la primera vez que agregan un producto al carrito (upsert lazy). El script `scripts/sync-clerk-users.ts` permite sincronizar retroactivamente los usuarios de Clerk que no hayan pasado por ese flujo, útil si el webhook no estaba configurado desde el inicio.

- **Imágenes de productos y `next.config.ts`:** Se usó el componente `<Image>` de Next.js para optimizar las imágenes de los productos. Esto requiere declarar los dominios externos en `remotePatterns`, por lo que se fueron agregando a mano a medida que se cargaban las imágenes del seed. Sin embargo, en la integración el Seller App será quien cargue los productos con sus propias URLs, y no es posible saber de antemano qué dominios va a usar. Hay dos soluciones posibles: reemplazar la lista manual por un wildcard (`hostname: '**'`) para seguir optimizando imágenes de cualquier dominio, o directamente abandonar la optimización y usar un `<img>` común, que muestra la imagen tal como viene sin necesidad de configurar nada. Además, esos mismos dominios se agregaron por error al CSP `img-src`, lo cual no corresponde: `<Image>` proxea las imágenes por el propio servidor (`/_next/image`), así que el browser nunca accede a esos dominios directamente. Ambas cosas se corrigen en la integración.
