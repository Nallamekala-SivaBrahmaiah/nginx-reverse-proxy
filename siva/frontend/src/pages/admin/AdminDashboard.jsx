import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DollarSign, Users, Store, Package, ShoppingBag, ShieldAlert, Settings as SettingsIcon } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeletons.jsx';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('analytics');

  // Form settings states
  const [email, setEmail] = useState('support@flipkartclone.com');
  const [phone, setPhone] = useState('+1800100200');
  const [fee, setFee] = useState(5.0);
  const [maintenance, setMaintenance] = useState(false);

  // Queries
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => API.get('/analytics/admin'),
  });

  const stats = analyticsRes?.data?.stats || { usersCount: 0, sellersCount: 0, productsCount: 0, ordersCount: 0, totalRevenue: 0 };
  const monthlySales = analyticsRes?.data?.monthlySales || [];
  const recentOrders = analyticsRes?.data?.recentOrders || [];

  const updateSettingsMutation = useMutation({
    mutationFn: () => API.put('/settings', { contactEmail: email, contactPhone: phone, platformFeePercent: fee, maintenanceMode: maintenance }),
    onSuccess: () => {
      toast.success('Site configurations updated!');
    },
    onError: () => {
      toast.error('Failed to update configurations');
    },
  });

  if (isLoading) return <TableSkeleton />;

  const chartData = {
    labels: monthlySales.map((d) => d.name),
    datasets: [
      {
        label: 'Global Sales Revenue (\u20B9)',
        data: monthlySales.map((d) => d.Revenue),
        borderColor: '#1a5bcf',
        backgroundColor: '#1a5bcf',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      
      {/* Sub Tabs */}
      <div className="flex border-b border-gray-100 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'analytics' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500'
          }`}
        >
          Overall Analytics
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-2.5 text-sm font-bold border-b-2 transition ${
            activeSubTab === 'settings' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500'
          }`}
        >
          Platform Settings
        </button>
      </div>

      {activeSubTab === 'analytics' ? (
        <>
          {/* Admin stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Revenue', value: `\u20B9${stats.totalRevenue}`, icon: DollarSign, color: 'text-green-500 bg-green-50 dark:bg-zinc-800' },
              { label: 'Active Users', value: stats.usersCount, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-zinc-800' },
              { label: 'Sellers', value: stats.sellersCount, icon: Store, color: 'text-amber-500 bg-amber-50 dark:bg-zinc-800' },
              { label: 'Products', value: stats.productsCount, icon: Package, color: 'text-purple-500 bg-purple-50 dark:bg-zinc-800' },
              { label: 'Orders', value: stats.ordersCount, icon: ShoppingBag, color: 'text-rose-500 bg-rose-50 dark:bg-zinc-800' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white border border-gray-150 p-4 rounded-sm flex flex-col justify-between shadow-sm dark:bg-zinc-900 dark:border-zinc-800 min-h-[110px]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <div className="flex justify-between items-baseline mt-2">
                    <p className="text-xl font-extrabold dark:text-white truncate max-w-[100px]">{stat.value}</p>
                    <span className={`p-1.5 rounded-full ${stat.color}`}>
                      <Icon size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart and Recent items grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="font-bold text-sm uppercase text-gray-400 mb-4">Platform Sales Performance</h3>
              {monthlySales.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">No chart data available.</div>
              ) : (
                <Line data={chartData} />
              )}
            </div>

            {/* Recent master orders list */}
            <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
              <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 dark:border-zinc-850 pb-3">
                Recent Master Orders
              </h3>
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div key={ord._id} className="text-xs flex justify-between items-center border-b border-gray-50 last:border-0 pb-3 dark:border-zinc-850">
                    <div className="min-w-0">
                      <p className="font-bold truncate max-w-[150px]">{ord.user?.name || 'Customer'}</p>
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900 dark:text-white">&#8377;{ord.totalPrice}</p>
                      <span className="text-[9px] text-green-600 font-bold uppercase">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Settings */
        <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6 max-w-xl">
          <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-55 pb-3 dark:text-white dark:border-zinc-850 flex items-center gap-1.5">
            <SettingsIcon size={16} /> Platform Settings Management
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettingsMutation.mutate();
            }}
            className="space-y-4 text-sm"
          >
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Platform Cut / Fee Percent (%)</label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-850 bg-transparent"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-gray-500 mb-1">Maintenance Mode</span>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenance}
                  onChange={(e) => setMaintenance(e.target.checked)}
                  className="rounded text-primary-500 border-gray-300"
                />
                Activate Maintenance Mode (Suspends customer checkouts)
              </label>
            </div>

            <button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="w-full py-2.5 bg-secondary text-white font-bold rounded-sm text-xs hover:shadow transition disabled:opacity-50"
            >
              Update Configs
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
