import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma";
import AdminSidebar from "@/app/ui/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { roles: true, name: true, lastName: true },
  });

  if (!user?.roles.includes("ADMIN")) redirect("/");

  const adminName = [user.name, user.lastName].filter(Boolean).join(" ") || "Admin";

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar adminName={adminName} />
      <main className="flex-1 ml-65 min-h-screen">
        {children}
      </main>
    </div>
  );
}
