"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductRef {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  location: string | null;
  categories: string[];
}

interface Message {
  role: "user" | "model";
  text: string;
  product?: ProductRef | null;
}

const GREETING: Message = {
  role: "model",
  text: "Hola, estoy acá para ayudarte a descubrir tu próxima infusión favorita. Ya sea que busques un perfil de sabor específico o un regalo especial, contame qué te gusta y te recomiendo algo perfecto.",
};

const SUGGESTIONS = [
  "¿Qué yerba me recomendás?",
  "Tés para el desayuno",
  "Regalo para amante del café",
  "¿Cómo preparo el tereré?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const conversationStarted = useRef(false);

  // Scroll the page to top on mount — not the chat container
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Scroll chat container to bottom only after conversation starts
  useEffect(() => {
    if (!conversationStarted.current) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    conversationStarted.current = true;

    const userMessage: Message = { role: "user", text: trimmed };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    const history = next
      .filter((m) => m !== GREETING)
      .slice(0, -1)
      .map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      setMessages([...next, {
        role: "model",
        text: data.reply ?? "Ocurrió un error. Intentá de nuevo.",
        product: data.product ?? null,
      }]);
    } catch {
      setMessages([...next, { role: "model", text: "Ocurrió un error. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="pt-24 pb-10 px-6 text-center">
        <p className="text-[10px] tracking-[0.25em] text-terracotta italic mb-4">
          EL ASISTENTE DE INFUSIO
        </p>
        <h1 className="font-serif text-5xl lg:text-6xl text-brown mb-5">
          Asistente Virtual
        </h1>
        <p className="text-sm italic text-muted-foreground max-w-md mx-auto leading-relaxed">
          Tu guía personal para encontrar la infusión perfecta. Contanos tus gustos
          y descubrí tu próximo ritual matutino.
        </p>
      </div>

      {/* ── Chat card ── */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <div className="border border-tan rounded-2xl overflow-hidden">

          {/* Messages */}
          <div
            ref={messagesRef}
            className="h-[52vh] overflow-y-auto p-6 space-y-4 bg-cream/40"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-terracotta text-white rounded-br-sm"
                      : "bg-olive text-cream rounded-bl-sm"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Embedded product card */}
                  {m.role === "model" && m.product && (
                    <div className="mt-4 bg-cream rounded-xl overflow-hidden border border-tan/60">
                      <div className="flex items-center gap-3 p-3">
                        <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-tan/40">
                          {m.product.imageUrl ? (
                            <Image
                              src={m.product.imageUrl}
                              alt={m.product.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-tan/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-brown leading-tight">{m.product.name}</p>
                          {m.product.categories.length > 0 && (
                            <p className="text-[10px] tracking-wider text-muted-foreground uppercase mt-0.5">
                              {m.product.categories.slice(0, 2).join(" — ")}
                              {m.product.location ? ` — ${m.product.location}` : ""}
                            </p>
                          )}
                        </div>
                        <p className="font-serif text-sm text-brown shrink-0">
                          ${m.product.price.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <div className="px-3 pb-3">
                        <Link
                          href={`/products/${m.product.id}`}
                          className="text-[10px] tracking-[0.15em] text-terracotta hover:underline"
                        >
                          VER PRODUCTO →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-olive text-cream px-5 py-4 rounded-2xl rounded-bl-sm text-sm italic opacity-80">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          {/* ── Input section — part of the same card ── */}
          <div className="border-t border-tan bg-cream p-4">
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-full border border-tan text-[11px] tracking-[0.08em] text-muted-foreground hover:border-brown hover:text-brown transition-colors disabled:opacity-40"
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Input row */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Preguntame sobre café, té o preparación..."
                disabled={loading}
                className="flex-1 rounded-full border border-tan bg-transparent px-5 py-3 text-sm text-brown placeholder:text-muted-foreground focus:outline-none focus:border-brown transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Enviar"
                className="w-10 h-10 rounded-full bg-olive hover:bg-brown disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-cream">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </form>

            <p className="text-[10px] text-muted-foreground tracking-wide text-center mt-3">
              POWERED BY INFUSIO KNOWLEDGE BASE · Los precios son orientativos y pueden cambiar.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
