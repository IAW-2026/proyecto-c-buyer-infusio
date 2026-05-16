"use client";

import { useCart } from "./CartContext";

interface CartNavButtonProps {
  userId: string | null;
  className?: string;
}

export default function CartNavButton({ className }: CartNavButtonProps) {
  const { items, openCart } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={openCart}
      className={className}
      aria-label={`Carrito, ${count} productos`}
    >
      CARRITO ({count})
    </button>
  );
}
