import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface CartNavLinkProps {
  userId: string | null;
  className?: string;
}

export default async function CartNavLink({ userId, className }: CartNavLinkProps) {
  let count = 0;

  if (userId) {
    try {
      const result = await prisma.cartItem.aggregate({
        where: { cart: { userId, status: "NOT_CHECKED_OUT" } },
        _sum: { quantity: true },
      });
      count = result._sum.quantity ?? 0;
    } catch {
      // DB unavailable — degrade gracefully
    }
  }

  return (
    <Link href="/cart" className={className} aria-label={`Carrito, ${count} productos`}>
      CARRITO ({count})
    </Link>
  );
}
