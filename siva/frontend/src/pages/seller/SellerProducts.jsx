import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import API from '../../services/api.js';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import { Trash2, Edit, PlusCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const SellerProducts = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);

  const { data: productsRes, isLoading } = useQuery({
    queryKey: ['sellerProducts', user._id],
    queryFn: () => API.get(`/products?seller=${user._id}&limit=100`),
  });

  const products = productsRes?.data?.products || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries(['sellerProducts', user._id]);
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-50 dark:border-zinc-850 pb-4">
        <h3 className="font-bold text-base dark:text-white">Active Catalog Listing</h3>
        <Link
          to="/seller/add-product"
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-4 py-2 rounded-sm flex items-center gap-1.5 shadow"
        >
          <PlusCircle size={14} /> Add New Product
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase dark:bg-zinc-850 dark:border-zinc-800">
              <th className="p-4">Item Details</th>
              <th className="p-4">Category</th>
              <th className="p-4">SKU / Stock</th>
              <th className="p-4">Offer Price</th>
              <th className="p-4 text-center">Rating</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-850">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 font-semibold">
                  No products added yet. Click Add Product to start.
                </td>
              </tr>
            ) : (
              products.map((prod) => {
                const mainVariant = prod.variants?.[0] || {};
                return (
                  <tr key={prod._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850">
                    <td className="p-4 flex items-center gap-3">
                      <img src={prod.images?.[0]?.url} alt="" className="w-10 h-10 object-contain rounded bg-gray-50 p-1" />
                      <div className="min-w-0">
                        <p className="font-bold truncate max-w-[150px] text-zinc-800 dark:text-zinc-200">{prod.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold">Brand: {prod.brand?.name}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-zinc-650 dark:text-zinc-400">{prod.category?.name}</td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">{mainVariant.sku}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Stock: {mainVariant.stock}</p>
                    </td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">&#8377;{mainVariant.offerPrice}</td>
                    <td className="p-4 text-center">
                      {prod.ratings > 0 ? (
                        <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          {prod.ratings.toFixed(1)} <Star size={8} className="fill-green-700" />
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2.5">
                        <Link
                          to={`/seller/edit-product/${prod._id}`}
                          className="text-gray-400 hover:text-primary-500 transition"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => deleteMutation.mutate(prod._id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerProducts;
