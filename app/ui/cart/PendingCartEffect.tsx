"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

export default function PendingCartEffect() {
  const { refresh, openCart } = useCart();

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingCartItem");
    if (!raw) return;

    sessionStorage.removeItem("pendingCartItem");

    let item: Record<string, unknown>;
    try { item = JSON.parse(raw); } catch { return; }

    fetch("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })
      .then(async (res) => {
        if (res.ok) { await refresh(); openCart(); }
      })
      .catch(() => {});
  // runs once on mount — refresh/openCart are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
