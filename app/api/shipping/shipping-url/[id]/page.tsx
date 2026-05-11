import Link from "next/link";
import { getShipmentTracking } from "@/app/lib/services/externalApis";
import type { ShipmentStatusValue } from "@/app/lib/services/externalApis";

type BadgeInfo = { label: string; cls: string };

const STATUS_MAP: Record<ShipmentStatusValue, BadgeInfo> = {
  pending:    { label: "EN PREPARACIÓN", cls: "bg-tan/60 text-brown" },
  prepared:   { label: "EN PREPARACIÓN", cls: "bg-tan/60 text-brown" },
  dispatched: { label: "EN PREPARACIÓN", cls: "bg-tan/60 text-brown" },
  in_transit: { label: "EN TRÁNSITO",    cls: "bg-terracotta/20 text-terracotta" },
  delivered:  { label: "ENTREGADO",      cls: "bg-olive/20 text-olive" },
  cancelled:  { label: "CANCELADO",      cls: "bg-red-100 text-red-700" },
  incident:   { label: "INCIDENTE",      cls: "bg-red-100 text-red-700" },
};

export default async function ShippingUrlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tracking = await getShipmentTracking(id).catch(() => null);

  if (!tracking) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-[0.25em] text-terracotta mb-4">SEGUIMIENTO DE ENVÍO</p>
        <h1 className="font-serif text-4xl lg:text-5xl text-brown mb-6 leading-tight">
          No se pudo obtener la información del envío.
        </h1>
        <Link href="/orders" className="text-xs tracking-[0.15em] text-olive hover:text-brown transition-colors">
          ← VOLVER A MIS PEDIDOS
        </Link>
      </div>
    );
  }

  const badge = STATUS_MAP[tracking.status] ?? { label: tracking.status.toUpperCase(), cls: "bg-tan/60 text-brown" };
  const lastUpdate = new Date(tracking.last_update).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.25em] text-terracotta mb-4">SEGUIMIENTO DE ENVÍO</p>
      <h1 className="font-serif text-4xl lg:text-5xl text-brown mb-8 leading-tight">
        Estado de tu envío
      </h1>

      <span className={`inline-block px-4 py-2 text-[11px] tracking-[0.15em] rounded-sm mb-8 ${badge.cls}`}>
        {badge.label}
      </span>

      <div className="space-y-3 mb-12">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">UBICACIÓN ACTUAL</p>
          <p className="font-serif text-2xl text-brown">{tracking.current_city}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">ÚLTIMA ACTUALIZACIÓN</p>
          <p className="text-sm text-brown">{lastUpdate}</p>
        </div>
      </div>

      <Link href="/orders" className="text-xs tracking-[0.15em] text-olive hover:text-brown transition-colors">
        ← VOLVER A MIS PEDIDOS
      </Link>
    </div>
  );
}
