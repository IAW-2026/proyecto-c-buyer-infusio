import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="w-full">
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 relative aspect-square lg:aspect-auto lg:min-h-150">
          <Image
            src="/images/hero-coffee.jpg"
            alt="Infusión artesanal"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="w-full lg:w-1/2 bg-olive flex items-center">
          <div className="px-8 py-16 lg:px-16 lg:py-24 xl:px-24">
            <p className="text-xs tracking-[0.2em] text-cream/80 mb-6">
              LA ESQUINA DEL ALQUIMISTA
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-8">
              La arquitectura del sabor.
            </h1>
            <p className="text-cream/80 text-lg leading-relaxed mb-10 max-w-md">
              Creemos que preparar una infusión es un acto de arquitectura. Requiere una base de
              calidad, una estructura de técnica y el alma del origen.
            </p>
            <a
              href="#collection"
              className="inline-block px-8 py-4 text-xs tracking-[0.15em] text-olive bg-cream hover:bg-cream/90 transition-colors"
            >
              EXPLORAR
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
