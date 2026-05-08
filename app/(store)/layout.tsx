import Navbar from "@/app/ui/Navbar";
import Footer from "@/app/ui/Footer";
import { CartProvider } from "@/app/ui/CartContext";
import CartDrawer from "@/app/ui/CartDrawer";
import PendingCartEffect from "@/app/ui/PendingCartEffect";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CartDrawer />
      <PendingCartEffect />
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  );
}
