import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api.js';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { ChevronRight, Star, ShoppingBag, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Fetch Banners
  const { data: bannersRes, isLoading: bannersLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => API.get('/marketing/banners'),
  });

  // Fetch Categories
  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => API.get('/marketing/categories'),
  });

  // Fetch Products
  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => API.get('/products?limit=8'),
  });

  const banners = bannersRes?.data?.banners || [];
  const categories = categoriesRes?.data?.categories?.filter((c) => !c.parent) || [];
  const products = productsRes?.data?.products || [];

  // Auto banner swap
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setActiveBannerIdx((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  return (
    <div className="space-y-8">
      
      {/* Categories Cards Row */}
      {categoriesLoading ? (
        <div className="flex gap-4 overflow-x-auto py-2">
          {Array(8).fill(null).map((_, idx) => (
            <div key={idx} className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-sm animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-sm p-4 flex gap-6 overflow-x-auto justify-start md:justify-center border border-gray-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              className="flex flex-col items-center gap-1.5 text-center group cursor-pointer flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center p-2 bg-gray-50 border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                  />
                ) : (
                  <ShoppingBag size={24} className="text-primary-500" />
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-primary-500">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Hero Banner Slider */}
      {bannersLoading ? (
        <div className="w-full h-72 bg-gray-200 dark:bg-zinc-800 rounded-sm animate-pulse" />
      ) : banners.length > 0 ? (
        <div className="relative w-full h-44 sm:h-72 overflow-hidden rounded-sm border border-gray-100 shadow-sm dark:border-zinc-800">
          <Link to={banners[activeBannerIdx].linkUrl || '#'}>
            <img
              src={banners[activeBannerIdx].imageUrl}
              alt={banners[activeBannerIdx].title || 'Marketing Promotion'}
              className="w-full h-full object-cover transition-all duration-700"
            />
          </Link>
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIdx(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === activeBannerIdx ? 'bg-primary-500 w-4' : 'bg-gray-300 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-44 sm:h-72 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-sm shadow flex items-center p-12 text-white">
          <div className="space-y-4">
            <span className="bg-secondary text-zinc-950 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max">
              <Zap size={12} className="fill-zinc-950" /> FLASH DEAL ACTIVE
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold">Super Saver Days</h2>
            <p className="text-sm text-blue-100">Get up to 60% off on all trending mobiles and lifestyle products.</p>
            <Link
              to="/products"
              className="inline-block bg-secondary text-zinc-950 px-6 py-2 rounded-sm text-sm font-bold shadow hover:bg-yellow-500 transition"
            >
              Shop Now
            </Link>
          </div>
        </div>
      )}

      {/* Products Showcase: Best Sellers */}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight dark:text-white">Best Sellers</h3>
            <p className="text-xs text-gray-500 font-semibold">Our most popular products, chosen by customers.</p>
          </div>
          <Link to="/products" className="bg-primary-500 text-white text-xs font-semibold px-4 py-2 rounded-sm flex items-center gap-1 hover:bg-primary-600 transition shadow">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(null).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map((prod) => {
              const mainVariant = prod.variants[0] || {};
              const discount =
                mainVariant.price && mainVariant.offerPrice
                  ? Math.round(((mainVariant.price - mainVariant.offerPrice) / mainVariant.price) * 100)
                  : 0;

              return (
                <motion.div
                  key={prod._id}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-100 rounded-sm overflow-hidden p-4 flex flex-col justify-between group shadow-sm hover:shadow-md transition dark:bg-zinc-900 dark:border-zinc-800"
                >
                  <Link to={`/product/${prod._id}`} className="space-y-3">
                    <div className="h-44 w-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center p-2 rounded-sm relative">
                      <img
                        src={prod.images[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
                        alt={prod.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-102 transition duration-200"
                      />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-primary-500">
                        {prod.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                        {prod.brand?.name || 'Generic'}
                      </p>
                    </div>
                  </Link>

                  <div className="space-y-2 mt-3">
                    {/* Rating badge */}
                    {prod.ratings > 0 && (
                      <div className="flex items-center gap-1 w-max bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                        <span>{prod.ratings.toFixed(1)}</span>
                        <Star size={10} className="fill-white text-white" />
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                        &#8377;{mainVariant.offerPrice || 0}
                      </span>
                      {discount > 0 && (
                        <span className="text-xs text-gray-400 line-through">
                          &#8377;{mainVariant.price}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Home;
