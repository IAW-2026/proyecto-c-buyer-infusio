"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FlyItem {
  id: number;
  x: number;
  y: number;
  imageUrl: string | null;
}

function FlyDot({ item }: { item: FlyItem }) {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    left: item.x,
    top: item.y,
    width: 44,
    height: 44,
    borderRadius: "50%",
    overflow: "hidden",
    zIndex: 9999,
    pointerEvents: "none",
    transform: "translate(-50%, -50%) scale(1)",
    opacity: 1,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "none",
  });

  useEffect(() => {
    const heart = document.querySelector("[data-heart-target]");
    if (!heart) return;
    const heartRect = heart.getBoundingClientRect();
    const tx = heartRect.left + heartRect.width / 2 - item.x;
    const ty = heartRect.top + heartRect.height / 2 - item.y;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStyle((prev) => ({
          ...prev,
          transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.15)`,
          opacity: 0,
          transition:
            "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease-in 0.15s",
        }));
      });
    });
  }, [item.x, item.y]);

  return (
    <div style={style} className="border-2 border-white">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-tan flex items-center justify-center">
          <svg className="w-4 h-4 text-brown" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function FlyingFavourite() {
  const [items, setItems] = useState<FlyItem[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    function handleFly(e: Event) {
      const { x, y, imageUrl } = (e as CustomEvent).detail;
      const id = ++counter.current;
      setItems((prev) => [...prev, { id, x, y, imageUrl }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 800);
    }
    window.addEventListener("favourite-added", handleFly);
    return () => window.removeEventListener("favourite-added", handleFly);
  }, []);

  if (typeof document === "undefined" || items.length === 0) return null;

  return createPortal(
    <>
      {items.map((item) => (
        <FlyDot key={item.id} item={item} />
      ))}
    </>,
    document.body
  );
}
