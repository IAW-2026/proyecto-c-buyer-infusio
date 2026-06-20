export default function Loading() {
  return (
    <div className="py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-350 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-48 animate-pulse bg-[#e8e4dd]" />
          <div className="h-4 w-24 animate-pulse bg-[#e8e4dd]" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-3/4 animate-pulse bg-[#e8e4dd]" />
          ))}
        </div>
      </div>
    </div>
  );
}
