export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-48 bg-gray-200 rounded-xl w-full"></div>
      
      {/* Search Bar Skeleton */}
      <div className="h-16 bg-gray-200 rounded-xl w-full"></div>

      {/* Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
