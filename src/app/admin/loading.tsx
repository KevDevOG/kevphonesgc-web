import React from 'react'

export default function AdminLoading() {
  return (
    <div className="bg-[#0B0B0E] min-h-screen text-[#F7F7F7] flex flex-col p-4 md:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="w-48 h-8 bg-[#1F1F24] rounded-md"></div>
          <div className="w-64 h-4 bg-[#1F1F24] rounded-md"></div>
        </div>
      </div>
      
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="h-32 bg-[#1F1F24] rounded-2xl"></div>
        <div className="h-32 bg-[#1F1F24] rounded-2xl"></div>
        <div className="h-32 bg-[#1F1F24] rounded-2xl"></div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-[#1F1F24] rounded-2xl min-h-[400px]"></div>
    </div>
  )
}
