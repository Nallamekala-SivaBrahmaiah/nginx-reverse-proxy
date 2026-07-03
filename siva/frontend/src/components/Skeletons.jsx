import React from 'react';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-sm border border-gray-100 p-4 space-y-3 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 animate-pulse">
    <div className="w-full h-48 bg-gray-200 dark:bg-zinc-800 rounded-sm"></div>
    <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
    <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
    <div className="flex gap-2">
      <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
    </div>
  </div>
);

export const ProductListSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
    {Array(8).fill(null).map((_, idx) => (
      <ProductCardSkeleton key={idx} />
    ))}
  </div>
);

export const ProductDetailsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full animate-pulse">
    <div className="space-y-4">
      <div className="w-full h-96 bg-gray-200 dark:bg-zinc-800 rounded-sm"></div>
      <div className="flex gap-4">
        {Array(4).fill(null).map((_, idx) => (
          <div key={idx} className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-sm"></div>
        ))}
      </div>
    </div>
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
      <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-1/3"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="w-full bg-white rounded-sm border border-gray-100 p-6 space-y-4 dark:bg-zinc-900 dark:border-zinc-800 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-1/4 mb-4"></div>
    {Array(5).fill(null).map((_, idx) => (
      <div key={idx} className="flex gap-4 py-2 border-b border-gray-100 dark:border-zinc-800">
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded flex-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-16"></div>
      </div>
    ))}
  </div>
);
