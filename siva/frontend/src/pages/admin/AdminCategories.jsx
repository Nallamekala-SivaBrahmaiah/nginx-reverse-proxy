import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import { Plus, Trash2, Folder } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCategories = () => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [parent, setParent] = useState('');

  const { data: categoriesRes, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => API.get('/marketing/categories'),
  });

  const categories = categoriesRes?.data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (payload) => API.post('/marketing/categories', payload),
    onSuccess: () => {
      toast.success('Category created successfully!');
      setName('');
      setImage('');
      setParent('');
      queryClient.invalidateQueries(['adminCategories']);
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/marketing/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries(['adminCategories']);
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Category Creation Form */}
      <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 pb-3 dark:border-zinc-850 dark:text-white">
          Add New Category
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            createMutation.mutate({ name, image, parent });
          }}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="E.g., Smartphones"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Image URL (Optional)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Parent Category (Optional)</label>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent font-semibold"
            >
              <option value="">None (Top-Level Category)</option>
              {categories.filter(c => !c.parent).map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-primary-500 text-white font-bold rounded-sm text-xs hover:bg-primary-600 transition shadow flex items-center justify-center gap-1"
          >
            <Plus size={14} /> Add Category
          </button>
        </form>
      </div>

      {/* Categories tree lists */}
      <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 pb-3 dark:border-zinc-850 dark:text-white">
          Active Categories Catalog
        </h3>

        <div className="divide-y divide-gray-50 dark:divide-zinc-850">
          {categories.length === 0 ? (
            <p className="text-xs text-gray-500 font-semibold py-4 text-center">No categories configured yet.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="flex justify-between items-center py-3 text-xs">
                <div className="flex items-center gap-2">
                  <Folder size={14} className="text-primary-500" />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white">{cat.name}</span>
                    {cat.parent && (
                      <span className="text-[10px] text-gray-400 font-bold ml-2">
                        Subcategory of: {cat.parent.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(cat._id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminCategories;
