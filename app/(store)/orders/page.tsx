import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/app/lib/prisma";
import { getShipmentTracking } from "@/app/lib/services/externalApis";
import OrdersTable, { type OrderRow } from "@/app/ui/OrdersTable";

export default async function OrdersPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="font-serif text-2xl text-brown italic mb-4">
          Debés estar logueado para ver tus pedidos.
        </p>
        <Link
          href="/sign-in"
          className="text-xs tracking-[0.15em] text-olive hover:text-brown transition-colors"
        >
          INICIAR SESIÓN →
        </Link>
      </div>
    );
  }

  const rawOrders = await db.purchaseOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { cart: { include: { items: true } } },
  });

  const trackingMap = Object.fromEntries(
    await Promise.all(
      rawOrders
        .filter((o) => o.shippingId)
        .map(async (o) => [
          o.id,
          await getShipmentTracking(o.shippingId!).catch(() => null),
        ])
    )
  );

  const orders: OrderRow[] = rawOrders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    shippingId: o.shippingId,
    items: o.cart.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productVariant: item.productVariant,
      productImageUrl: item.productImageUrl,
      priceAtTime: Number(item.priceAtTime),
      quantity: item.quantity,
    })),
  }));

  return (
    <div className="py-16 lg:py-24 px-6 lg:px-20 xl:px-32 w-full">
      <p className="text-xs tracking-[0.2em] text-terracotta mb-3">
        BIENVENIDO DE VUELTA
      </p>
      <h1 className="font-serif text-4xl lg:text-5xl text-brown leading-tight">
        Mis Pedidos
      </h1>

      <OrdersTable orders={orders} trackingMap={trackingMap} />
    </div>
  );
}
