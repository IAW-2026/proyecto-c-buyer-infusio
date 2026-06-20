"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.25em] text-terracotta italic mb-4">ERROR</p>
      <h1 className="font-serif text-5xl lg:text-7xl text-brown mb-6">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground mb-10 max-w-sm leading-relaxed italic">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-10 py-4 text-[11px] tracking-[0.2em] text-cream bg-brown hover:bg-olive transition-colors"
      >
        INTENTAR DE NUEVO
      </button>
    </div>
  );
}
