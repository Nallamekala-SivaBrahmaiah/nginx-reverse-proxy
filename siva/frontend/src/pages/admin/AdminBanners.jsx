import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBanners = () => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState(0);

  const { data: bannersRes, isLoading } = useQuery({
    queryKey: ['adminBanners'],
    queryFn: () => API.get('/marketing/banners/admin'),
  });

  const banners = bannersRes?.data?.banners || [];

  const createMutation = useMutation({
    mutationFn: (payload) => API.post('/marketing/banners', payload),
    onSuccess: () => {
      toast.success('Banner created successfully!');
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      setLinkUrl('');
      setPosition(0);
      queryClient.invalidateQueries(['adminBanners']);
    },
    onError: () => {
      toast.error('Failed to create banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => API.delete(`/marketing/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner deleted');
      queryClient.invalidateQueries(['adminBanners']);
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Banner Creation Form */}
      <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 pb-3 dark:border-zinc-850 dark:text-white">
          Add New Banner
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!imageUrl) return;
            createMutation.mutate({ title, subtitle, imageUrl, linkUrl, position });
          }}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Banner Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="E.g., End of Season Sale"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Banner Subtitle (Optional)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="Up to 60% Off"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Image URL</label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="https://example.com/slide.png"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Redirection Link URL (Optional)</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              placeholder="/products?category=smartphones"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Sorting Position</label>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-primary-500 text-white font-bold rounded-sm text-xs hover:bg-primary-600 transition shadow flex items-center justify-center gap-1"
          >
            <Plus size={14} /> Add Banner
          </button>
        </form>
      </div>

      {/* Banners strip lists */}
      <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 pb-3 dark:border-zinc-850 dark:text-white">
          Active Advertising Banners
        </h3>

        <div className="space-y-4">
          {banners.length === 0 ? (
            <p className="text-xs text-gray-500 font-semibold py-4 text-center">No banners configured yet.</p>
          ) : (
            banners.map((ban) => (
              <div key={ban._id} className="border border-gray-150 p-4 rounded-sm flex items-center gap-4 dark:border-zinc-850 relative">
                
                <button
                  onClick={() => deleteMutation.mutate(ban._id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={16} />
                </button>

                <div className="h-16 w-28 bg-gray-50 rounded-sm overflow-hidden flex items-center justify-center dark:bg-zinc-800">
                  <img src={ban.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>

                <div className="text-xs space-y-0.5 min-w-0 pr-6">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{ban.title || 'Untitled Banner'}</p>
                  <p className="text-[10px] text-gray-400 font-bold truncate">{ban.subtitle || 'No subtitle'}</p>
                  <p className="text-[10px] text-primary-500 font-semibold truncate mt-1">Redirect: {ban.linkUrl || 'N/A'}</p>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminBanners;
