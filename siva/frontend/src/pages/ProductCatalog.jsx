import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api.js';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import StarRating from '../components/StarRating.jsx';
import { Filter, Star, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // local states for inputs
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [ratingMin, setRatingMin] = useState(searchParams.get('ratingMin') || '');
  const [discountMin, setDiscountMin] = useState(searchParams.get('discountMin') || '');
  const [selectedBrands, setSelectedBrands] = useState(searchParams.get('brand')?.split(',') || []);
  const [selectedCategories, setSelectedCategories] = useState(searchParams.get('category')?.split(',') || []);
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Queries
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => API.get('/marketing/categories'),
  });

  const { data: brandsRes } = useQuery({
    queryKey: ['brands'],
    queryFn: () => API.get('/marketing/brands'),
  });

  const keyword = searchParams.get('keyword') || '';

  // Master product query
  const queryParams = {
    page,
    limit: 8,
    sort,
    ...(keyword && { keyword }),
    ...(priceMin && { priceMin }),
    ...(priceMax && { priceMax }),
    ...(ratingMin && { ratingMin }),
    ...(discountMin && { discountMin }),
    ...(selectedBrands.length > 0 && { brand: selectedBrands.join(',') }),
    ...(selectedCategories.length > 0 && { category: selectedCategories.join(',') }),
  };

  const { data: productsRes, isLoading, refetch } = useQuery({
    queryKey: ['catalogProducts', queryParams],
    queryFn: () => API.get('/products', { params: queryParams }),
  });

  const products = productsRes?.data?.products || [];
  const totalPages = productsRes?.data?.totalPages || 1;
  const categories = categoriesRes?.data?.categories || [];
  const brands = brandsRes?.data?.brands || [];

  // Update URL search parameters
  const applyFilters = () => {
    const params = {
      page: 1,
      sort,
      ...(keyword && { keyword }),
      ...(priceMin && { priceMin }),
      ...(priceMax && { priceMax }),
      ...(ratingMin && { ratingMin }),
      ...(discountMin && { discountMin }),
      ...(selectedBrands.length > 0 && { brand: selectedBrands.join(',') }),
      ...(selectedCategories.length > 0 && { category: selectedCategories.join(',') }),
    };
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setRatingMin('');
    setDiscountMin('');
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  // Trigger filters update when sort changes
  useEffect(() => {
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...currentParams, sort, page: 1 });
    setPage(1);
  }, [sort]);

  // Handle page change
  const handlePageChange = (pageNum) => {
    setPage(pageNum);
    const currentParams = Object.fromEntries(searchParams.entries());
    setSearchParams({ ...currentParams, page: pageNum });
  };

  const handleBrandChange = (brandId) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Filter Panel */}
      <aside className="w-full md:w-64 bg-white rounded-sm border border-gray-100 p-6 flex flex-col gap-6 shadow-sm flex-shrink-0 self-start dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-3">
          <h3 className="font-bold text-sm flex items-center gap-1.5 dark:text-white">
            <Filter size={16} /> Filters
          </h3>
          <button onClick={clearFilters} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
            <RefreshCw size={10} /> Clear All
          </button>
        </div>

        {/* Categories Checkboxes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500">Categories</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <label key={cat._id} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat._id)}
                  onChange={() => handleCategoryChange(cat._id)}
                  className="rounded text-primary-500 focus:ring-primary-500 border-gray-300"
                />
                <span className="truncate">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brand Checkboxes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500">Brands</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {brands.map((b) => (
              <label key={b._id} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b._id)}
                  onChange={() => handleBrandChange(b._id)}
                  className="rounded text-primary-500 focus:ring-primary-500 border-gray-300"
                />
                <span className="truncate">{b.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price filter */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500">Price Range</h4>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
          </div>
        </div>

        {/* Ratings Filter */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500">Min Rating</h4>
          <div className="flex flex-col gap-2">
            {[4, 3, 2].map((num) => (
              <label key={num} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={Number(ratingMin) === num}
                  onChange={() => setRatingMin(num)}
                  className="text-primary-500 focus:ring-primary-500 border-gray-300"
                />
                <span className="flex items-center gap-1">
                  {num}★ & above
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount Filter */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-gray-500">Min Discount</h4>
          <div className="flex flex-col gap-2">
            {[50, 30, 10].map((num) => (
              <label key={num} className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="discount"
                  checked={Number(discountMin) === num}
                  onChange={() => setDiscountMin(num)}
                  className="text-primary-500 focus:ring-primary-500 border-gray-300"
                />
                <span>{num}% & more</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={applyFilters}
          className="w-full py-2 bg-primary-500 text-white font-bold rounded-sm text-sm hover:bg-primary-600 transition shadow"
        >
          Apply Filters
        </button>

      </aside>

      {/* Product List Panel */}
      <div className="flex-1 space-y-6">
        
        {/* Header toolbar */}
        <div className="bg-white rounded-sm border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-xs text-gray-500 font-semibold">
            {keyword ? `Search results for "${keyword}"` : 'Explore Catalogue'}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Sort By</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent font-semibold dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="ratings">Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(8).fill(null).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-sm border border-gray-100 p-12 text-center shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <p className="text-gray-500 font-medium">No products matching filters found.</p>
            <button onClick={clearFilters} className="text-primary-500 font-semibold hover:underline mt-2 text-sm">
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((prod) => {
                const mainVariant = prod.variants[0] || {};
                const discount =
                  mainVariant.price && mainVariant.offerPrice
                    ? Math.round(((mainVariant.price - mainVariant.offerPrice) / mainVariant.price) * 100)
                    : 0;

                return (
                  <motion.div
                    key={prod._id}
                    whileHover={{ y: -3 }}
                    className="bg-white border border-gray-100 rounded-sm overflow-hidden p-4 flex flex-col justify-between group shadow-sm hover:shadow-md transition dark:bg-zinc-900 dark:border-zinc-800"
                  >
                    <Link to={`/product/${prod._id}`} className="space-y-3">
                      <div className="h-40 w-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center p-2 rounded-sm relative">
                        <img
                          src={prod.images[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
                          alt={prod.title}
                          className="max-h-full max-w-full object-contain"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-primary-500">
                          {prod.title}
                        </h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                          {prod.brand?.name || 'Generic'}
                        </p>
                      </div>
                    </Link>

                    <div className="space-y-2 mt-3">
                      {prod.ratings > 0 && (
                        <div className="flex items-center gap-1 w-max bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          <span>{prod.ratings.toFixed(1)}</span>
                          <Star size={8} className="fill-white text-white" />
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                          &#8377;{mainVariant.offerPrice || 0}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] text-gray-400 line-through">
                            &#8377;{mainVariant.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-6">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-sm text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-850 dark:hover:bg-zinc-800"
                >
                  Prev
                </button>
                {Array(totalPages).fill(null).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    className={`px-3 py-1.5 rounded-sm text-xs font-bold transition ${
                      page === idx + 1
                        ? 'bg-primary-500 text-white'
                        : 'border border-gray-200 hover:bg-gray-50 dark:border-zinc-850 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-sm text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-850 dark:hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default ProductCatalog;
