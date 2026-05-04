import { prisma } from "@/lib/prisma";

interface CartBadgeProps {
  userId: string;
}

export default async function CartBadge({ userId }: CartBadgeProps) {
  let itemCount = 0;

  try {
    const result = await prisma.cartItem.aggregate({
      where: {
        cart: { userId, status: "NOT_CHECKED_OUT" },
      },
      _sum: { quantity: true },
    });
    itemCount = result._sum.quantity ?? 0;
  } catch {
    // DB unavailable during development — degrade gracefully
  }

  return (
    <div
      className="relative"
      aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} items` : ""}`}
    >
      <svg
        className="h-6 w-6 text-gray-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 5h14M17 18a1 1 0 110 2 1 1 0 010-2M9 18a1 1 0 110 2 1 1 0 010-2"
        />
      </svg>
      {itemCount > 0 && (
        <span
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white"
          aria-hidden
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </div>
  );
}
