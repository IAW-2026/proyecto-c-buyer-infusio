import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/app/ui/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /*
    const user = await currentUser();
  const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];

  if (!roles.includes("admin")) {
    redirect("/");
  }

  const adminName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin";
*/
  const adminName = "Mili";

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar adminName={adminName} />
      <main className="flex-1 ml-65 min-h-screen">
        {children}
      </main>
    </div>
  );
}
