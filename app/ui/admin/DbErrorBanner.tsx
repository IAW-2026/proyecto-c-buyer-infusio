export default function DbErrorBanner() {
  return (
    <div className="mb-8 border border-terracotta/30 bg-terracotta/5 px-5 py-3 text-xs tracking-widest text-terracotta">
      No se pudo conectar a la base de datos. Los datos pueden estar incompletos — intentá recargar.
    </div>
  );
}
