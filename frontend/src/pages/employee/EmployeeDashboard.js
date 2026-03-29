import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Calendar, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

export const EmployeeDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    upcoming_bookings: [],
    today_guests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/employee');
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
      <div data-testid="employee-dashboard">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Employee Dashboard
        </h1>
        <p className="text-base text-[#404040] mb-8">Your bookings and guests overview</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Bookings */}
          <div className="bg-white border border-zinc-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar size={24} className="text-[#0047FF]" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
                Upcoming Bookings
              </h2>
            </div>

            {dashboardData.upcoming_bookings.length === 0 ? (
              <p className="text-[#737373] text-center py-8">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.upcoming_bookings.map((booking, index) => (
                  <div
                    key={index}
                    className="border border-zinc-200 p-4 hover:shadow-sm transition-shadow"
                    data-testid={`upcoming-booking-${index}`}
                  >
                    <h3 className="font-semibold text-[#0A0A0A] mb-1">{booking.title}</h3>
                    <p className="text-sm text-[#404040] mb-2">{booking.room_name}</p>
                    <p className="text-xs text-[#737373]">
                      {format(new Date(booking.start_time), 'MMM dd, yyyy h:mm a')} -{' '}
                      {format(new Date(booking.end_time), 'h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Invited Guests */}
          <div className="bg-white border border-zinc-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck size={24} className="text-[#16A34A]" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
                Today's Guests
              </h2>
            </div>

            {dashboardData.today_guests.length === 0 ? (
              <p className="text-[#737373] text-center py-8">No guests expected today</p>
            ) : (
              <div className="space-y-4">
                {dashboardData.today_guests.map((guest, index) => (
                  <div
                    key={index}
                    className="border border-zinc-200 p-4"
                    data-testid={`today-guest-${index}`}
                  >
                    <h3 className="font-semibold text-[#0A0A0A] mb-1">{guest.full_name}</h3>
                    <p className="text-sm text-[#404040] mb-1">{guest.company}</p>
                    <p className="text-xs text-[#737373]">{guest.purpose}</p>
                    <div className="mt-2">
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase ${
                          guest.status === 'checked_in'
                            ? 'bg-[#16A34A] text-white'
                            : guest.status === 'expected'
                            ? 'bg-[#EAB308] text-white'
                            : 'bg-zinc-200 text-[#0A0A0A]'
                        }`}
                      >
                        {guest.status}
                      </span>
                    </div>
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
