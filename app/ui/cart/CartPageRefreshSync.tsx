"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/app/ui/cart/CartContext";

// Keeps the /cart server page in sync with CartContext.
// Calls router.refresh() only when an item is removed — not on adds or qty changes —
// so the server re-renders with the correct vendor groups.
export default function CartPageRefreshSync() {
  const { items } = useCart();
  const router = useRouter();
  const initialized = useRef(false);
  const prevIdsRef = useRef(new Set(items.map((i) => i.productId)));

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      prevIdsRef.current = new Set(items.map((i) => i.productId));
      return;
    }

    const currentIds = new Set(items.map((i) => i.productId));
    const wasRemoved = [...prevIdsRef.current].some((id) => !currentIds.has(id));
    prevIdsRef.current = currentIds;

    if (wasRemoved) router.refresh();
  }, [items, router]);

  return null;
}
