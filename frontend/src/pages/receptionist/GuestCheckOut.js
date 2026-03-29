import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const GuestCheckOut = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    fetchCheckedInGuests();
  }, []);

  const fetchCheckedInGuests = async () => {
    try {
      const response = await api.get('/guests', {
        params: { status: 'checked_in' },
      });
      setGuests(response.data);
    } catch (error) {
      toast.error('Failed to fetch guests');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchCheckedInGuests();
      return;
    }

    const filtered = guests.filter(
      (guest) =>
        guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.visitor_badge_number?.includes(searchQuery)
    );
    setGuests(filtered);
  };

  const handleCheckOut = async (guestEmail) => {
    try {
      await api.post(`/guests/${guestEmail}/check-out`);
      toast.success('Guest checked out successfully');
      setSelectedGuest(null);
      fetchCheckedInGuests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-out failed');
    }
  };

  return (
    <Layout>
      <div data-testid="check-out-page">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Guest Check-Out
        </h1>
        <p className="text-base text-[#404040] mb-8">Check out visitors</p>

        <div className="bg-white border border-zinc-200 p-6">
          <div className="flex gap-3 mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or badge number"
              style={{ borderRadius: 0 }}
              data-testid="search-guest-input"
            />
            <Button
              onClick={handleSearch}
              className="bg-[#0047FF] hover:bg-[#0038CC] text-white px-6"
              style={{ borderRadius: 0 }}
              data-testid="search-button"
            >
              <Search size={20} />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-[#0A0A0A] mb-4">
            Checked-In Guests ({guests.length})
          </h2>

          {guests.length === 0 ? (
            <p className="text-center text-[#737373] py-8">No checked-in guests</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guests.map((guest) => (
                <div
                  key={guest.email}
                  className="border border-[#16A34A] bg-green-50 p-4"
                  data-testid={`checked-in-guest-${guest.email}`}
                >
                  <h3 className="font-semibold text-[#0A0A0A] mb-1">{guest.full_name}</h3>
                  <p className="text-sm text-[#404040] mb-1">{guest.company}</p>
                  <p className="text-xs text-[#737373] mb-1">
                    Badge: {guest.visitor_badge_number || 'N/A'}
                  </p>
                  <p className="text-xs text-[#737373] mb-1">
                    Host: {guest.host_employee_name}
                  </p>
                  <p className="text-xs text-[#737373] mb-3">
                    Checked in: {guest.actual_arrival ? format(new Date(guest.actual_arrival), 'h:mm a') : 'N/A'}
                  </p>
                  
                  <Button
                    onClick={() => handleCheckOut(guest.email)}
                    className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center gap-2"
                    style={{ borderRadius: 0 }}
                    data-testid={`check-out-button-${guest.email}`}
                  >
                    <LogOut size={16} />
                    Check Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
