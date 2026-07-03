import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../redux/authSlice.js';
import API from '../services/api.js';
import { User, ShoppingBag, MapPin, Edit3, Trash2, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Tabs: 'profile', 'orders', 'addresses'
  const [activeTab, setActiveTab] = useState('orders');

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [editingProfile, setEditingProfile] = useState(false);

  // Queries
  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => API.get('/orders'),
  });

  const { data: addressesRes, isLoading: addressesLoading } = useQuery({
    queryKey: ['myAddresses'],
    queryFn: () => API.get('/addresses'),
  });

  const orders = ordersRes?.data?.orders || [];
  const addresses = addressesRes?.data?.addresses || [];

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (payload) => API.put('/users/profile', payload),
    onSuccess: (res) => {
      dispatch(updateUser(res.data.user));
      toast.success('Profile updated successfully!');
      setEditingProfile(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => API.delete(`/orders/${orderId}`),
    onSuccess: () => {
      toast.success('Order cancelled successfully. Refund initiated.');
      queryClient.invalidateQueries(['myOrders']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not cancel order');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (addrId) => API.delete(`/addresses/${addrId}`),
    onSuccess: () => {
      toast.success('Address deleted');
      queryClient.invalidateQueries(['myAddresses']);
    },
  });

  const makeAddressDefaultMutation = useMutation({
    mutationFn: (addrId) => API.put(`/addresses/${addrId}`, { isDefault: true }),
    onSuccess: () => {
      toast.success('Default address updated');
      queryClient.invalidateQueries(['myAddresses']);
    },
  });

  const saveProfile = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, phone });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Tabs */}
      <aside className="w-full md:w-64 bg-white border border-gray-100 rounded-sm p-6 shadow-sm flex flex-col gap-2 dark:bg-zinc-900 dark:border-zinc-800 self-start">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-850 pb-4 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-500 font-extrabold text-lg flex items-center justify-center dark:bg-zinc-800">
            {user?.name?.[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Hello,</p>
            <p className="font-bold text-sm truncate max-w-[150px] dark:text-white">{user?.name}</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-semibold text-left transition ${
            activeTab === 'orders'
              ? 'bg-primary-50 text-primary-500 dark:bg-zinc-850'
              : 'text-zinc-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <ShoppingBag size={16} /> My Orders
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-semibold text-left transition ${
            activeTab === 'profile'
              ? 'bg-primary-50 text-primary-500 dark:bg-zinc-850'
              : 'text-zinc-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <User size={16} /> Profile Details
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs font-semibold text-left transition ${
            activeTab === 'addresses'
              ? 'bg-primary-50 text-primary-500 dark:bg-zinc-850'
              : 'text-zinc-600 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <MapPin size={16} /> Saved Addresses
        </button>
      </aside>

      {/* Main Tab Details */}
      <div className="flex-1 bg-white border border-gray-100 rounded-sm p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        
        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="font-bold text-base border-b border-gray-100 dark:border-zinc-850 pb-3 dark:text-white">
              My Order History
            </h3>

            {ordersLoading ? (
              <p className="text-xs text-gray-400">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-500 font-semibold py-6">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord._id}
                    className="border border-gray-100 rounded-sm p-5 dark:border-zinc-850 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 dark:border-zinc-850 pb-3">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Order ID</p>
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{ord._id}</p>
                      </div>
                      <div className="flex gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          Total: &#8377;{ord.totalPrice}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {ord.orderItems?.map((item) => {
                        const prod = item.product || {};
                        return (
                          <div key={item._id} className="flex gap-3 items-center">
                            <div className="h-12 w-12 bg-gray-50 rounded-sm p-1 flex items-center justify-center flex-shrink-0 dark:bg-zinc-800">
                              <img
                                src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate dark:text-zinc-300">{prod.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                Qty: {item.quantity} | Size: {item.selectedSize || 'N/A'}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === 'Delivered'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'Cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-zinc-850">
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                          ord.paymentInfo.status === 'Paid' ? 'bg-green-600 text-white' : 'bg-gray-150 text-zinc-700'
                        }`}>
                          Payment: {ord.paymentInfo.status}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">Method: {ord.paymentInfo.method}</span>
                      </div>
                      
                      {ord.status !== 'Delivered' && ord.status !== 'Cancelled' && (
                        <button
                          onClick={() => cancelOrderMutation.mutate(ord._id)}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="font-bold text-base border-b border-gray-100 dark:border-zinc-850 pb-3 dark:text-white">
              Profile Information
            </h3>

            <form onSubmit={saveProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full px-4 py-2 border border-gray-250 bg-gray-50 rounded-sm text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-850 text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!editingProfile}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-sm text-sm focus:outline-none bg-transparent ${
                    editingProfile
                      ? 'border-primary-500 focus:border-primary-600'
                      : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  disabled={!editingProfile}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-sm text-sm focus:outline-none bg-transparent ${
                    editingProfile
                      ? 'border-primary-500 focus:border-primary-600'
                      : 'border-gray-200 dark:border-zinc-800'
                  }`}
                />
              </div>

              {editingProfile ? (
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-500 text-white font-bold text-xs rounded-sm hover:bg-primary-600 transition shadow"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setName(user?.name);
                      setPhone(user?.phone);
                    }}
                    className="px-6 py-2 border border-gray-200 text-zinc-600 dark:text-zinc-300 font-bold text-xs rounded-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="px-6 py-2 bg-secondary text-white font-bold text-xs rounded-sm hover:shadow transition flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </form>
          </div>
        )}

        {/* Tab 3: Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <h3 className="font-bold text-base border-b border-gray-100 dark:border-zinc-850 pb-3 dark:text-white">
              Manage Addresses
            </h3>

            {addressesLoading ? (
              <p className="text-xs text-gray-400">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-xs text-gray-500 font-semibold py-6">No saved addresses found.</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="border border-gray-150 p-5 rounded-sm flex justify-between items-start gap-4 dark:border-zinc-850"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-800 dark:text-white">{addr.name}</span>
                        <span className="bg-gray-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          {addr.addressType}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-650 dark:text-zinc-400 leading-5">
                        {addr.addressLine}, {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex gap-2.5">
                      {!addr.isDefault && (
                        <button
                          onClick={() => makeAddressDefaultMutation.mutate(addr._id)}
                          className="text-[10px] text-primary-500 hover:underline font-bold"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddressMutation.mutate(addr._id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};

export default CustomerDashboard;
