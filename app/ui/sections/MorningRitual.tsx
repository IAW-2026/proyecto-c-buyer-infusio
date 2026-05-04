import Image from "next/image";

export default function MorningRitual() {
  return (
    <section className="w-full py-16 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <svg
          viewBox="0 0 1400 800"
          fill="none"
          className="absolute w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M-100 600 Q 200 450, 500 500 T 900 400 T 1500 500"
            stroke="rgba(212, 207, 197, 0.4)"
            strokeWidth="200"
            fill="none"
          />
        </svg>
      </div>

      <div className="max-w-350 mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-12 lg:gap-16">
          <div className="w-full lg:w-2/5 pt-8 lg:pt-16">
            <p className="text-xs tracking-[0.2em] text-terracotta mb-6">EL RITUAL DE LA MAÑANA</p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-brown leading-[1.1] mb-8">
              Restaura la mente, el cuerpo y el espíritu.
            </h2>
            <p className="text-muted-foreground text-base italic leading-relaxed mb-10 max-w-sm">
              Un marketplace que une a los productores artesanales de infusiones con quienes buscan
              el ritual perfecto del mate, el té y los blends.
            </p>
            <a
              href="#collection"
              className="inline-block px-8 py-4 text-xs tracking-[0.15em] text-brown border border-brown hover:bg-brown hover:text-cream transition-colors"
            >
              EXPLORAR LA COLECCIÓN
            </a>
          </div>

          <div className="w-full lg:w-3/5 relative">
            <div className="relative">
              <div className="relative aspect-4/3 lg:aspect-5/4">
                <Image
                  src="/images/morning-ritual.jpg"
                  alt="Ritual matutino con infusiones"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute -bottom-6 left-0 lg:-left-8 bg-olive text-cream px-10 py-8 lg:px-12 lg:py-10 flex flex-col items-center justify-center z-10">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-4">
                  <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="20" y1="6" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="20" y1="30" x2="20" y2="34" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="6" y1="20" x2="10" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="30" y1="20" x2="34" y2="20" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10.1" y1="10.1" x2="12.9" y2="12.9" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="27.1" y1="27.1" x2="29.9" y2="29.9" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10.1" y1="29.9" x2="12.9" y2="27.1" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="27.1" y1="12.9" x2="29.9" y2="10.1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <p className="text-xs tracking-[0.15em] mb-1">EST. 2024</p>
                <p className="text-xs tracking-[0.15em]">ARTESANAL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
