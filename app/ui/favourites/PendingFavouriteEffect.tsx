"use client";

import { useEffect, useState } from "react";
import { useFavourites } from "./FavouritesContext";

export default function PendingFavouriteEffect() {
  const { refresh } = useFavourites();
  const [failed, setFailed] = useState(false);

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
      .then(async (res) => {
        if (res.ok) await refresh();
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!failed) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-brown text-cream px-6 py-3 text-xs tracking-[0.12em] shadow-lg">
      No pudimos guardar tu favorito pendiente — intentalo nuevamente.
      <button
        onClick={() => setFailed(false)}
        aria-label="Cerrar"
        className="text-cream/60 hover:text-cream transition-colors"
      >
        ×
      </button>
    </div>
  );
}
