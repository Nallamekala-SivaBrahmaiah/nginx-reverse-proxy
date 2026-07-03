import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../services/api.js';
import { ProductCardSkeleton } from '../components/Skeletons.jsx';
import { Heart, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const queryClient = useQueryClient();

  const { data: wishlistRes, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => API.get('/wishlist'),
  });

  const wishlist = wishlistRes?.data?.wishlist || { products: [] };

  const removeMutation = useMutation({
    mutationFn: (productId) => API.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      toast.success('Removed from Wishlist');
      queryClient.invalidateQueries(['wishlist']);
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(4).fill(null).map((_, idx) => (
          <ProductCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (wishlist.products.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-sm p-12 text-center shadow-sm max-w-2xl mx-auto dark:bg-zinc-900 dark:border-zinc-800">
        <Heart size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
        <h3 className="font-bold text-lg dark:text-white">Your Wishlist is Empty!</h3>
        <p className="text-xs text-gray-500 font-semibold mt-1">Tap hearts on products to save them for later.</p>
        <Link
          to="/products"
          className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-sm font-bold text-sm shadow hover:bg-primary-600 transition mt-6"
        >
          Explore Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
      <h3 className="font-bold text-base border-b border-gray-105 pb-4 dark:text-white dark:border-zinc-850">
        My Wishlist ({wishlist.products.length} Items)
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wishlist.products.map((prod) => {
          const mainVariant = prod.variants?.[0] || {};
          const discount =
            mainVariant.price && mainVariant.offerPrice
              ? Math.round(((mainVariant.price - mainVariant.offerPrice) / mainVariant.price) * 100)
              : 0;

          return (
            <div
              key={prod._id}
              className="bg-white border border-gray-100 rounded-sm overflow-hidden p-4 flex flex-col justify-between group shadow-sm hover:shadow-md transition relative dark:bg-zinc-900 dark:border-zinc-800"
            >
              <button
                onClick={() => removeMutation.mutate(prod._id)}
                className="absolute top-2 right-2 p-1.5 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition dark:bg-zinc-850"
              >
                <Trash2 size={12} />
              </button>

              <Link to={`/product/${prod._id}`} className="space-y-3">
                <div className="h-40 w-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center p-2 rounded-sm">
                  <img
                    src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
                    alt={prod.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-primary-500">
                    {prod.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold">{prod.brand?.name || 'Generic'}</p>
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
                    <span className="text-[10px] text-gray-400 line-through">&#8377;{mainVariant.price}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
