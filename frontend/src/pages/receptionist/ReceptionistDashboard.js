import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { UserCheck, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const ReceptionistDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    expected_visitors: [],
    checked_in_guests: [],
    today_bookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/receptionist');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div data-testid="receptionist-dashboard">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Receptionist Dashboard
        </h1>
        <p className="text-base text-[#404040] mb-8">Real-time visitor and room status</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white border border-zinc-200 p-6" data-testid="expected-visitors-card">
            <div className="flex items-center justify-between mb-2">
              <Users size={32} className="text-[#EAB308]" />
              <span className="text-3xl font-black text-[#EAB308]">
                {dashboardData.expected_visitors.length}
              </span>
            </div>
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
              Expected Visitors
            </p>
          </div>

          <div className="bg-white border border-zinc-200 p-6" data-testid="checked-in-card">
            <div className="flex items-center justify-between mb-2">
              <UserCheck size={32} className="text-[#16A34A]" />
              <span className="text-3xl font-black text-[#16A34A]">
                {dashboardData.checked_in_guests.length}
              </span>
            </div>
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
              Checked In
            </p>
          </div>

          <div className="bg-white border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar size={32} className="text-[#0047FF]" />
              <span className="text-3xl font-black text-[#0047FF]">
                {dashboardData.today_bookings.length}
              </span>
            </div>
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
              Today's Bookings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expected Visitors */}
          <div className="bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-6">
              Expected Visitors
            </h2>

            {dashboardData.expected_visitors.length === 0 ? (
              <p className="text-[#737373] text-center py-8">No expected visitors</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.expected_visitors.map((guest, index) => (
                  <div
                    key={index}
                    className="border border-zinc-200 p-4"
                    data-testid={`expected-visitor-${index}`}
                  >
                    <h3 className="font-semibold text-[#0A0A0A]">{guest.full_name}</h3>
                    <p className="text-sm text-[#404040]">{guest.company}</p>
                    <p className="text-xs text-[#737373] mt-1">
                      Host: {guest.host_employee_name}
                    </p>
                    <p className="text-xs text-[#737373]">
                      Expected: {format(new Date(guest.expected_arrival), 'h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checked-In Guests */}
          <div className="bg-white border border-zinc-200 p-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-6">
              Checked-In Guests
            </h2>

            {dashboardData.checked_in_guests.length === 0 ? (
              <p className="text-[#737373] text-center py-8">No checked-in guests</p>
            ) : (
              <div className="space-y-3">
                {dashboardData.checked_in_guests.map((guest, index) => (
                  <div
                    key={index}
                    className="border border-[#16A34A] bg-green-50 p-4"
                    data-testid={`checked-in-guest-${index}`}
                  >
                    <h3 className="font-semibold text-[#0A0A0A]">{guest.full_name}</h3>
                    <p className="text-sm text-[#404040]">{guest.company}</p>
                    <p className="text-xs text-[#737373] mt-1">
                      Badge: {guest.visitor_badge_number || 'N/A'}
                    </p>
                    <p className="text-xs text-[#737373]">
                      Checked in: {guest.actual_arrival ? format(new Date(guest.actual_arrival), 'h:mm a') : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
