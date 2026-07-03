import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { DollarSign, ShoppingCart, Package, Star, Calendar } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeletons.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SellerDashboard = () => {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['sellerAnalytics'],
    queryFn: () => API.get('/analytics/seller'),
  });

  const stats = analyticsRes?.data?.stats || { productsCount: 0, totalRevenue: 0, totalItemsSold: 0 };
  const monthlySales = analyticsRes?.data?.monthlySales || [];
  const recentItems = analyticsRes?.data?.recentItems || [];

  if (isLoading) return <TableSkeleton />;

  // Chart configuration
  const chartData = {
    labels: monthlySales.map((d) => d.name),
    datasets: [
      {
        label: 'Monthly Revenue (\u20B9)',
        data: monthlySales.map((d) => d.Revenue),
        fill: false,
        borderColor: '#2874f0',
        backgroundColor: '#2874f0',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue Analytics (2026)',
      },
    },
  };

  return (
    <div className="space-y-8">
      
      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Earnings', value: `\u20B9${stats.totalRevenue}`, desc: 'Total sales revenue generated', icon: DollarSign, color: 'text-green-500 bg-green-50 dark:bg-zinc-800' },
          { label: 'Products Active', value: stats.productsCount, desc: 'Count of products in storefront', icon: Package, color: 'text-blue-500 bg-blue-50 dark:bg-zinc-800' },
          { label: 'Items Sold', value: stats.totalItemsSold, desc: 'Count of fulfilled items', icon: ShoppingCart, color: 'text-amber-500 bg-amber-50 dark:bg-zinc-800' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-gray-100 p-6 rounded-sm flex items-center justify-between shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold dark:text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-500 font-semibold">{stat.desc}</p>
              </div>
              <div className={`p-4 rounded-full ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart and Activity Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="font-bold text-sm uppercase text-gray-400 mb-4">Earnings History</h3>
          {monthlySales.length === 0 ? (
            <div className="py-20 text-center text-xs text-gray-400">No chart data available.</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Recent orders sidebar list */}
        <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-sm uppercase text-gray-400 border-b border-gray-50 dark:border-zinc-850 pb-3">
            Recent Orders
          </h3>
          <div className="space-y-3">
            {recentItems.length === 0 ? (
              <p className="text-xs text-gray-500 font-semibold py-8 text-center">No orders received yet.</p>
            ) : (
              recentItems.map((item) => (
                <div key={item._id} className="flex gap-3 text-xs justify-between items-center border-b border-gray-50 last:border-0 pb-3 dark:border-zinc-850">
                  <div className="flex gap-2.5 items-center min-w-0">
                    <img src={item.product?.images?.[0]?.url} alt="" className="w-8 h-8 object-contain rounded bg-gray-50 p-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold truncate max-w-[120px]">{item.product?.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-white">&#8377;{item.offerPrice * item.quantity}</p>
                    <span className="text-[9px] text-primary-500 font-bold uppercase">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SellerDashboard;
