import { db } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN:  "ADMIN",
  CLIENT: "CLIENTE",
  VENDOR: "VENDEDOR",
};

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN:  "text-terracotta bg-terracotta/10",
  CLIENT: "text-olive bg-olive/10",
  VENDOR: "text-muted-foreground bg-tan/50",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { purchases: true, carts: true } },
    },
  });

  return (
    <div className="px-10 py-10">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">GESTIÓN</p>
          <h1 className="font-serif text-5xl text-brown">Usuarios</h1>
        </div>
        <div className="pt-2">
          <p className="text-xs tracking-[0.15em] text-muted-foreground">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-tan">
            {["NOMBRE", "EMAIL", "ROL", "COMPRAS", "REGISTRO"].map((h) => (
              <th key={h} className="pb-3 text-left text-xs tracking-[0.15em] text-terracotta font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center font-serif text-xl text-muted-foreground">
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="border-b border-tan/60 hover:bg-tan/20 transition-colors">
                <td className="py-4">
                  <p className="text-sm text-brown">{u.name} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{u.id.slice(0, 20)}…</p>
                </td>
                <td className="py-4 text-sm text-muted-foreground">{u.email}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 text-xs tracking-[0.1em] ${ROLE_COLOR[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="py-4 text-sm text-brown text-center">{u._count.purchases}</td>
                <td className="py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
