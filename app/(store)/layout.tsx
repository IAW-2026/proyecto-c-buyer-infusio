import Navbar from "@/app/ui/Navbar";
import Footer from "@/app/ui/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
