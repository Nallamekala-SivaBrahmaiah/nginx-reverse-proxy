import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import { Calendar, User, Truck, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const SellerOrders = () => {
  const queryClient = useQueryClient();

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['sellerOrders'],
    queryFn: () => API.get('/orders/seller'),
  });

  const orderItems = ordersRes?.data?.items || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ itemId, status }) => API.put(`/orders/item/${itemId}/status`, { status }),
    onSuccess: () => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries(['sellerOrders']);
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
      <h3 className="font-bold text-base border-b border-gray-50 dark:border-zinc-850 pb-4 dark:text-white">
        Fulfillment & Orders Tracker
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase dark:bg-zinc-850 dark:border-zinc-850">
              <th className="p-4">Item Details</th>
              <th className="p-4">Delivery To</th>
              <th className="p-4">Total Price</th>
              <th className="p-4">Placed Date</th>
              <th className="p-4">Payment</th>
              <th className="p-4 text-center">Fulfillment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-850">
            {orderItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500 font-semibold">
                  No orders received yet for your products.
                </td>
              </tr>
            ) : (
              orderItems.map((item) => {
                const order = item.order || {};
                const product = item.product || {};
                return (
                  <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-850">
                    <td className="p-4 flex items-center gap-3">
                      <img src={product.images?.[0]?.url} alt="" className="w-10 h-10 object-contain rounded bg-gray-50 p-1" />
                      <div className="min-w-0">
                        <p className="font-bold truncate max-w-[150px] text-zinc-800 dark:text-zinc-200">{product.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                          Size: {item.selectedSize || 'N/A'} | Qty: {item.quantity}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">{order.shippingAddress?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">PIN: {order.shippingAddress?.pincode}</p>
                    </td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">&#8377;{item.offerPrice * item.quantity}</td>
                    <td className="p-4 font-semibold text-zinc-650 dark:text-zinc-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        order.paymentInfo?.status === 'Paid' ? 'bg-green-600 text-white' : 'bg-gray-150 text-zinc-700'
                      }`}>
                        {order.paymentInfo?.method}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => updateStatusMutation.mutate({ itemId: item._id, status: e.target.value })}
                        className="px-2.5 py-1 border border-gray-200 rounded-sm text-xs font-semibold focus:outline-none bg-transparent dark:border-zinc-850 dark:text-zinc-300"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
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

export default SellerOrders;
