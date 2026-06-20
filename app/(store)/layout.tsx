import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/prisma";
import Navbar from "@/app/ui/Navbar";
import Footer from "@/app/ui/Footer";
import { CartProvider } from "@/app/ui/cart/CartContext";
import CartDrawer from "@/app/ui/cart/CartDrawer";
import PendingCartEffect from "@/app/ui/cart/PendingCartEffect";
import { FavouritesProvider } from "@/app/ui/favourites/FavouritesContext";
import PendingFavouriteEffect from "@/app/ui/favourites/PendingFavouriteEffect";
import FlyingFavourite from "@/app/ui/favourites/FlyingFavourite";

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
