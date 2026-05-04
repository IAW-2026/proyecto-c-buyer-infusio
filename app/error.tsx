"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <p className="font-serif text-2xl text-[#2d2926]">Algo salió mal</p>
      <p className="mt-2 text-sm text-[#6b6560]">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 px-8 py-3 text-xs tracking-[0.15em] text-[#2d2926] border border-[#2d2926] hover:bg-[#2d2926] hover:text-[#f5f3ef] transition-colors"
      >
        INTENTAR DE NUEVO
      </button>
    </div>
  );
}
