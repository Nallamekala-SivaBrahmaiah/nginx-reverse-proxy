import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import { CheckCircle, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSellers = () => {
  const queryClient = useQueryClient();

  const { data: sellersRes, isLoading } = useQuery({
    queryKey: ['adminSellers'],
    queryFn: () => API.get('/users/admin/sellers'),
  });

  const sellers = sellersRes?.data?.sellers || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => API.put(`/users/admin/status/${id}`, { status }),
    onSuccess: () => {
      toast.success('Merchant status updated');
      queryClient.invalidateQueries(['adminSellers']);
    },
    onError: () => {
      toast.error('Failed to change merchant status');
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
      <h3 className="font-bold text-base border-b border-gray-50 pb-4 dark:text-white dark:border-zinc-850">
        Sellers & Merchants Moderation Panel
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase dark:bg-zinc-850 dark:border-zinc-850">
              <th className="p-4">Seller Company</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Verify Status</th>
              <th className="p-4">Account Status</th>
              <th className="p-4 text-center">Fulfill Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-850">
            {sellers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 font-semibold">
                  No merchants registered on the platform.
                </td>
              </tr>
            ) : (
              sellers.map((sel) => (
                <tr key={sel._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850">
                  <td className="p-4 font-bold text-zinc-900 dark:text-white">{sel.name}</td>
                  <td className="p-4 font-semibold text-zinc-650 dark:text-zinc-400">{sel.email}</td>
                  <td className="p-4 font-bold text-zinc-700 dark:text-zinc-350">{sel.phone || 'N/A'}</td>
                  <td className="p-4">
                    {sel.isEmailVerified ? (
                      <span className="text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Verified
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                      sel.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {sel.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {sel.status === 'active' ? (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: sel._id, status: 'blocked' })}
                        className="text-red-500 hover:text-red-600 font-bold border border-red-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-zinc-800 px-3 py-1 rounded-sm flex items-center gap-1 mx-auto"
                      >
                        <UserX size={12} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: sel._id, status: 'active' })}
                        className="text-green-600 hover:text-green-700 font-bold border border-green-200 dark:border-zinc-800 hover:bg-green-50 dark:hover:bg-zinc-800 px-3 py-1 rounded-sm flex items-center gap-1 mx-auto"
                      >
                        <ShieldCheck size={12} /> Reinstate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSellers;
