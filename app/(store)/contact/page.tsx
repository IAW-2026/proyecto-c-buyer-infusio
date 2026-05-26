import ScrollToTop from "@/app/ui/ScrollToTop";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cream px-6 lg:px-12 py-20">
      <ScrollToTop />
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-4">ESTAMOS PARA VOS</p>
        <h1 className="font-serif text-5xl text-brown mb-4">Contacto</h1>
        <p className="text-sm italic text-muted-foreground mb-16 max-w-md leading-relaxed">
          Respondemos todas las consultas en menos de 24 horas hábiles.
        </p>

        <div className="space-y-10">

          <div className="border border-tan p-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">CORREO ELECTRÓNICO</p>
            <a
              href="mailto:hola@infusio.com.ar"
              className="font-serif text-2xl text-brown hover:text-olive transition-colors"
            >
              hola@infusio.com.ar
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Para consultas generales, pedidos y reclamos.
            </p>
          </div>

          <div className="border border-tan p-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">WHATSAPP</p>
            <a
              href="https://wa.me/5491155551234"
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-2xl text-brown hover:text-olive transition-colors"
            >
              +54 11 5555-1234
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Lunes a viernes, 10:00–18:00 hs.
            </p>
          </div>

          <div className="border border-tan p-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">INSTAGRAM</p>
            <a
              href="https://instagram.com/infusio.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-serif text-2xl text-brown hover:text-olive transition-colors"
            >
              @infusio.ar
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Seguinos para novedades, recetas y rituales.
            </p>
          </div>

          <div className="border border-tan p-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground mb-4">DEVOLUCIONES</p>
            <a
              href="mailto:devoluciones@infusio.com.ar"
              className="font-serif text-2xl text-brown hover:text-olive transition-colors"
            >
              devoluciones@infusio.com.ar
            </a>
            <p className="text-sm text-muted-foreground mt-2">
              Incluí tu número de pedido y fotos del producto.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
