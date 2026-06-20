import ScrollToTop from "@/app/ui/ScrollToTop";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-cream px-6 lg:px-12 py-20">
      <ScrollToTop />
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-4">DEVOLUCIONES</p>
        <h1 className="font-serif text-5xl text-brown mb-12">Política de Devoluciones</h1>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="font-serif text-2xl text-brown mb-4">Plazo para devoluciones</h2>
            <p>
              Aceptamos devoluciones dentro de los <strong className="text-brown">30 días corridos</strong> desde
              la fecha de entrega del pedido. Pasado ese plazo, lamentablemente no podemos ofrecer reembolso
              ni cambio.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-brown mb-4">Condiciones del producto</h2>
            <p>
              Para que una devolución sea aceptada, el producto debe estar sin abrir, en su empaque
              original, y en el mismo estado en que fue recibido. No procesamos devoluciones de productos
              que hayan sido usados, abiertos o dañados por el comprador.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-brown mb-4">Cómo iniciar una devolución</h2>
            <p className="mb-4">
              Para iniciar el proceso, envianos un correo a{" "}
              <a href="mailto:devoluciones@infusio.com.ar" className="text-brown hover:underline">
                devoluciones@infusio.com.ar
              </a>{" "}
              con la siguiente información:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Número de pedido</li>
              <li>Producto a devolver y motivo</li>
              <li>Fotos del producto en su estado actual</li>
            </ul>
            <p className="mt-4">
              Nuestro equipo te responderá dentro de las 48 horas hábiles con las instrucciones
              para el envío de devolución.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-brown mb-4">Reembolso</h2>
            <p>
              Una vez recibido y revisado el producto, procesamos el reembolso al medio de pago original
              dentro de los <strong className="text-brown">5 a 10 días hábiles</strong>. Te notificaremos
              por correo cuando el reembolso haya sido acreditado.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-brown mb-4">Exclusiones</h2>
            <p className="mb-3">No se aceptan devoluciones en los siguientes casos:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Productos en oferta o con descuento especial</li>
              <li>Productos perecederos abiertos o con el packaging roto</li>
              <li>Artículos personalizados o a medida</li>
              <li>Productos dañados por mal uso o almacenamiento inadecuado</li>
            </ul>
          </section>

          <section className="border-t border-tan pt-8">
            <p className="italic">
              Si tenés alguna duda sobre nuestra política, no dudes en escribirnos a{" "}
              <a href="mailto:hola@infusio.com.ar" className="text-brown hover:underline">
                hola@infusio.com.ar
              </a>
              . Estamos para ayudarte.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
