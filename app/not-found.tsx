import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.25em] text-terracotta italic mb-4">ERROR 404</p>
      <h1 className="font-serif text-5xl lg:text-7xl text-brown mb-6">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground mb-10 max-w-sm leading-relaxed italic">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-10 py-4 text-[11px] tracking-[0.2em] text-cream bg-brown hover:bg-olive transition-colors"
      >
        VOLVER AL INICIO
      </Link>
    </div>
  );
}
