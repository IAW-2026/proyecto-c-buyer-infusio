import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma";
import dynamic from "next/dynamic";
import Navbar from "@/app/ui/Navbar";
import Footer from "@/app/ui/Footer";
import { CartProvider } from "@/app/ui/cart/CartContext";
import { FavouritesProvider } from "@/app/ui/favourites/FavouritesContext";

const CartDrawer          = dynamic(() => import("@/app/ui/cart/CartDrawer"),                        { ssr: false });
const PendingCartEffect   = dynamic(() => import("@/app/ui/cart/PendingCartEffect"),                 { ssr: false });
const PendingFavouriteEffect = dynamic(() => import("@/app/ui/favourites/PendingFavouriteEffect"),   { ssr: false });
const FlyingFavourite     = dynamic(() => import("@/app/ui/favourites/FlyingFavourite"),             { ssr: false });

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { roles: true } });
    if (user?.roles.includes("ADMIN")) redirect("/admin");
  }

  return (
    <CartProvider>
      <FavouritesProvider>
        <CartDrawer />
        <PendingCartEffect />
        <PendingFavouriteEffect />
        <FlyingFavourite />
        <Navbar />
        {children}
        <Footer />
      </FavouritesProvider>
    </CartProvider>
  );
}
