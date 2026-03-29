import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const GuestCheckIn = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [checkInData, setCheckInData] = useState({
    visitor_badge_number: '',
    id_proof_type: '',
    notes: '',
  });

  useEffect(() => {
    fetchExpectedGuests();
  }, []);

  const fetchExpectedGuests = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/guests', {
        params: { status: 'expected', date: today },
      });
      setGuests(response.data);
    } catch (error) {
      toast.error('Failed to fetch guests');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchExpectedGuests();
      return;
    }

    const filtered = guests.filter(
      (guest) =>
        guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone.includes(searchQuery)
    );
    setGuests(filtered);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedGuest) return;

    try {
      await api.post(`/guests/${selectedGuest.email}/check-in`, checkInData);
      toast.success('Guest checked in successfully');
      setSelectedGuest(null);
      setCheckInData({
        visitor_badge_number: '',
        id_proof_type: '',
        notes: '',
      });
      fetchExpectedGuests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    }
  };

  return (
    <Layout>
      <div data-testid="check-in-page">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Guest Check-In
        </h1>
        <p className="text-base text-[#404040] mb-8">Check in expected visitors</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guest List */}
          <div className="bg-white border border-zinc-200 p-6">
            <div className="flex gap-3 mb-6">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone"
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
              Expected Visitors ({guests.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {guests.map((guest) => (
                <div
                  key={guest.email}
                  onClick={() => setSelectedGuest(guest)}
                  className={`border p-4 cursor-pointer transition-all ${
                    selectedGuest?.email === guest.email
                      ? 'border-[#0047FF] bg-blue-50'
                      : 'border-zinc-200 hover:border-[#0047FF]'
                  }`}
                  data-testid={`guest-item-${guest.email}`}
                >
                  <h3 className="font-semibold text-[#0A0A0A]">{guest.full_name}</h3>
                  <p className="text-sm text-[#404040]">{guest.company}</p>
                  <p className="text-xs text-[#737373] mt-1">Host: {guest.host_employee_name}</p>
                  <p className="text-xs text-[#737373]">
                    Expected: {format(new Date(guest.expected_arrival), 'h:mm a')}
                  </p>
                  <p className="text-xs text-[#737373]">Purpose: {guest.purpose}</p>
                </div>
              ))}
            </div>

            {guests.length === 0 && (
              <p className="text-center text-[#737373] py-8">No expected visitors found</p>
            )}
          </div>

          {/* Check-In Form */}
          <div className="bg-white border border-zinc-200 p-6">
            {selectedGuest ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">
                    Check In: {selectedGuest.full_name}
                  </h2>
                  <p className="text-sm text-[#404040]">{selectedGuest.company}</p>
                </div>

                <form onSubmit={handleCheckIn} className="space-y-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
                      Visitor Badge Number
                    </Label>
                    <Input
                      value={checkInData.visitor_badge_number}
                      onChange={(e) =>
                        setCheckInData({ ...checkInData, visitor_badge_number: e.target.value })
                      }
                      required
                      placeholder="e.g., V-001"
                      style={{ borderRadius: 0 }}
                      data-testid="badge-number-input"
                    />
                  </div>

                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
                      ID Proof Type
                    </Label>
                    <Input
                      value={checkInData.id_proof_type}
                      onChange={(e) => setCheckInData({ ...checkInData, id_proof_type: e.target.value })}
                      placeholder="e.g., Driver's License, Passport"
                      style={{ borderRadius: 0 }}
                    />
                  </div>

                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">
                      Notes (Optional)
                    </Label>
                    <Input
                      value={checkInData.notes}
                      onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                      placeholder="Any additional notes"
                      style={{ borderRadius: 0 }}
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-3 flex items-center justify-center gap-2"
                      style={{ borderRadius: 0 }}
                      data-testid="confirm-check-in-button"
                    >
                      <UserCheck size={20} />
                      Check In Guest
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => setSelectedGuest(null)}
                      className="w-full bg-zinc-200 hover:bg-zinc-300 text-[#0A0A0A]"
                      style={{ borderRadius: 0 }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <UserCheck size={64} className="text-[#737373] mb-4" />
                <p className="text-[#737373]">Select a guest from the list to check in</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
