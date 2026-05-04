const features = [
  {
    number: "01",
    label: "ORIGEN",
    title: "Infusiones de origen único, del productor a tu mesa.",
    bgColor: "bg-olive",
    textColor: "text-cream",
    buttonClass: "border-cream/40 text-cream/80 hover:bg-cream/10",
  },
  {
    number: "02",
    label: "SELECCIÓN",
    title: "Más de 40 productores artesanales seleccionados.",
    bgColor: "bg-terracotta",
    textColor: "text-cream",
    buttonClass: "border-cream/40 text-cream/80 hover:bg-cream/10",
  },
  {
    number: "03",
    label: "CALIDAD",
    title: "Cada blend es una firma. Cada hoja, un legado.",
    bgColor: "bg-tan",
    textColor: "text-brown",
    buttonClass: "border-brown/40 text-brown/80 hover:bg-brown/10",
  },
];

export default function FeatureCards() {
  return (
    <section className="w-full py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature) => (
            <div
              key={feature.number}
              className={`${feature.bgColor} ${feature.textColor} p-8 lg:p-10 flex flex-col justify-between min-h-100 lg:min-h-120`}
            >
              <p className="text-xs tracking-[0.15em] opacity-80">
                {feature.number} / {feature.label}
              </p>
              <div>
                <p className="font-serif text-2xl lg:text-3xl leading-snug mb-8 lg:mb-12">
                  {feature.title}
                </p>
                <a
                  href="#collection"
                  className={`block w-full py-4 text-center text-xs tracking-[0.15em] border ${feature.buttonClass} transition-colors`}
                >
                  VER COLECCIÓN
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
