"use client";

import { useEffect } from "react";
import { useFavourites } from "./FavouritesContext";

export default function PendingFavouriteEffect() {
  const { refresh } = useFavourites();

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingFavourite");
    if (!raw) return;

    sessionStorage.removeItem("pendingFavourite");

    let product: Record<string, unknown>;
    try { product = JSON.parse(raw); } catch { return; }

    fetch("/favourites/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })
      .then(async (res) => { if (res.ok) await refresh(); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
