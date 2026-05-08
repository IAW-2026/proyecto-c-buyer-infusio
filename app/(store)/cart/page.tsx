import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import CheckoutForm from "@/app/ui/CheckoutForm";

export const metadata = { title: "Pago — Infusio" };

export default async function CartPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const cart = await db.cart.findFirst({
    where: { userId, status: "NOT_CHECKED_OUT" },
    include: { items: true },
  });

  const items = (cart?.items ?? []).map((item) => ({
    ...item,
    priceAtTime: Number(item.priceAtTime),
  }));

  if (items.length === 0) {
    return (
      <section className="max-w-350 mx-auto px-6 lg:px-12 py-24 text-center">
        <p className="font-serif text-4xl text-brown mb-4">Tu carrito está vacío</p>
        <p className="text-sm italic text-muted-foreground mb-10">
          Explorá nuestra colección y encontrá algo especial.
        </p>
        <Link
          href="/"
          className="px-8 py-3 text-xs tracking-[0.15em] text-cream bg-olive hover:bg-brown transition-colors"
        >
          VER COLECCIÓN
        </Link>
      </section>
    );
  }

  return (
    <main className="max-w-350 mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <CheckoutForm items={items} />
    </main>
  );
}
