import { useEffect, useState } from 'react';
import { Package, Eye, MessageCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalProducts: 0, totalViews: 0, totalClicks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        let totalProducts = 0;
        let totalViews = 0;
        let totalClicks = 0;

        querySnapshot.forEach((doc) => {
          totalProducts++;
          const data = doc.data();
          totalViews += data.views || 0;
          totalClicks += data.whatsapp_clicks || 0;
        });

        setStats({ totalProducts, totalViews, totalClicks });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f1f3d]"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'WhatsApp Clicks', value: stats.totalClicks, icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-500">Monitor your store's performance and analytics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white overflow-hidden rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 truncate">{stat.title}</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
