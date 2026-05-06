export default function VendorsPage() {
  return (
    <div className="px-10 py-10">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] text-terracotta italic mb-2">GESTIÓN</p>
        <h1 className="font-serif text-5xl text-brown">Vendedores</h1>
      </div>

      <div className="border border-tan p-10 max-w-lg">
        <p className="font-serif text-2xl text-brown mb-4">Gestionado desde el Seller App</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          La administración de vendedores, productos y verificaciones se gestiona
          desde la aplicación de vendedores. Este panel refleja únicamente los datos
          que el Seller App comparte con la plataforma.
        </p>
        <p className="text-xs tracking-[0.15em] text-terracotta">SELLER APP — PRÓXIMAMENTE</p>
      </div>
    </div>
  );
}
