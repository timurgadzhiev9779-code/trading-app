export function PositionSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-3 mb-2 border border-gray-800 animate-pulse">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="h-5 w-24 bg-gray-800 rounded skeleton mb-2"></div>
          <div className="h-3 w-16 bg-gray-800 rounded skeleton"></div>
        </div>
        <div className="text-right">
          <div className="h-5 w-16 bg-gray-800 rounded skeleton mb-1"></div>
          <div className="h-3 w-12 bg-gray-800 rounded skeleton"></div>
        </div>
      </div>
      <div className="flex justify-between text-xs">
        <div className="h-3 w-20 bg-gray-800 rounded skeleton"></div>
        <div className="h-3 w-20 bg-gray-800 rounded skeleton"></div>
      </div>
    </div>
  )
}

export function SignalSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 mb-3 border border-gray-800 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="h-6 w-28 bg-gray-800 rounded skeleton mb-2"></div>
          <div className="h-4 w-32 bg-gray-800 rounded skeleton"></div>
        </div>
        <div className="h-6 w-16 bg-gray-800 rounded skeleton"></div>
      </div>
      <div className="h-1 bg-gray-800 rounded skeleton mb-3"></div>
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-gray-800 rounded skeleton"></div>
        <div className="h-4 w-20 bg-gray-800 rounded skeleton"></div>
        <div className="h-4 w-20 bg-gray-800 rounded skeleton"></div>
      </div>
      <div className="h-10 bg-gray-800 rounded skeleton mt-3"></div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-gray-800 animate-pulse">
      <div className="h-4 w-32 bg-gray-800 rounded skeleton mb-4"></div>
      <div className="h-64 bg-gray-800 rounded skeleton"></div>
    </div>
  )
}
