import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Users, Building2, Calendar, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    today_bookings: 0,
    active_guests: 0,
    total_rooms: 0,
    total_users: 0,
  });
  const [utilization, setUtilization] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, utilizationRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/room-utilization'),
      ]);

      setStats(statsRes.data);
      
      // Transform utilization data for chart
      const utilizationData = Object.entries(utilizationRes.data.utilization || {}).map(
        ([roomCode, data]) => ({
          room: data.room_name,
          bookings: data.total_bookings,
          hours: Math.round(data.total_hours),
        })
      );
      setUtilization(utilizationData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Today's Bookings", value: stats.today_bookings, icon: Calendar, color: '#0047FF' },
    { label: 'Active Guests', value: stats.active_guests, icon: UserCheck, color: '#16A34A' },
    { label: 'Total Rooms', value: stats.total_rooms, icon: Building2, color: '#EAB308' },
    { label: 'Total Users', value: stats.total_users, icon: Users, color: '#DC2626' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#737373]">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="admin-dashboard">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Admin Dashboard
        </h1>
        <p className="text-base text-[#404040] mb-8">System overview and analytics</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white border border-zinc-200 p-6 hover:shadow-md transition-shadow"
                data-testid={`stat-card-${stat.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon size={32} style={{ color: stat.color }} />
                  <span className="text-3xl font-black" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Room Utilization Chart */}
        {utilization.length > 0 && (
          <div className="bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-6">
              Room Utilization
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis dataKey="room" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E4E4E7',
                    borderRadius: 0,
                  }}
                />
                <Bar dataKey="bookings" fill="#0047FF" name="Total Bookings" />
                <Bar dataKey="hours" fill="#16A34A" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
};
