import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import CartItemRow from "@/app/ui/CartItemRow";
import CartSummary from "@/app/ui/CartSummary";

export const metadata = { title: "Carrito — Infusio" };

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
    <section className="max-w-350 mx-auto px-6 lg:px-12 py-12 lg:py-20">
      <h1 className="font-serif text-3xl lg:text-4xl text-brown mb-10">Tu Carrito</h1>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-x-16 lg:items-start">
        {/* Item list */}
        <div>
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        {/* Summary + checkout */}
        <div className="mt-10 lg:mt-0 lg:sticky lg:top-24">
          <CartSummary items={items} />
        </div>
      </div>
    </section>
  );
}
