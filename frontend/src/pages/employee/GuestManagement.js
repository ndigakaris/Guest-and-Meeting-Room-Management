import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { UserPlus, Search } from 'lucide-react';
import { toast } from 'sonner';

export const GuestManagement = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [newGuest, setNewGuest] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    host_employee_email: '',
    meeting_room_code: '',
    visit_date: '',
    expected_arrival: '',
    expected_departure: '',
  });

  useEffect(() => {
    fetchGuests();
    fetchRooms();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
    } catch (error) {
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms');
    }
  };

  const handleCreateGuest = async (e) => {
    e.preventDefault();
    try {
      const guestData = {
        ...newGuest,
        visit_date: new Date(newGuest.visit_date).toISOString(),
        expected_arrival: new Date(newGuest.expected_arrival).toISOString(),
        expected_departure: new Date(newGuest.expected_departure).toISOString(),
      };
      
      await api.post('/guests', guestData);
      toast.success('Guest invitation created');
      setShowCreateDialog(false);
      setNewGuest({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        purpose: '',
        host_employee_email: '',
        meeting_room_code: '',
        visit_date: '',
        expected_arrival: '',
        expected_departure: '',
      });
      fetchGuests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create guest invitation');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#737373]">Loading guests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="guest-management-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
              My Guests
            </h1>
            <p className="text-base text-[#404040]">Manage your invited guests</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#0047FF] hover:bg-[#0038CC] text-white px-6 py-3 flex items-center gap-2"
                style={{ borderRadius: 0 }}
                data-testid="invite-guest-button"
              >
                <UserPlus size={20} />
                Invite Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-zinc-200 max-w-2xl" style={{ borderRadius: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#0A0A0A]">Invite New Guest</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGuest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Full Name</Label>
                    <Input
                      value={newGuest.full_name}
                      onChange={(e) => setNewGuest({ ...newGuest, full_name: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                      data-testid="guest-name-input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Email</Label>
                    <Input
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                      data-testid="guest-email-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Phone</Label>
                    <Input
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Company</Label>
                    <Input
                      value={newGuest.company}
                      onChange={(e) => setNewGuest({ ...newGuest, company: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Purpose of Visit</Label>
                  <Input
                    value={newGuest.purpose}
                    onChange={(e) => setNewGuest({ ...newGuest, purpose: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Host Employee Email</Label>
                  <Input
                    type="email"
                    value={newGuest.host_employee_email}
                    onChange={(e) => setNewGuest({ ...newGuest, host_employee_email: e.target.value })}
                    required
                    placeholder="Usually your own email"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Visit Date</Label>
                    <Input
                      type="date"
                      value={newGuest.visit_date}
                      onChange={(e) => setNewGuest({ ...newGuest, visit_date: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Expected Arrival</Label>
                    <Input
                      type="datetime-local"
                      value={newGuest.expected_arrival}
                      onChange={(e) => setNewGuest({ ...newGuest, expected_arrival: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Expected Departure</Label>
                    <Input
                      type="datetime-local"
                      value={newGuest.expected_departure}
                      onChange={(e) => setNewGuest({ ...newGuest, expected_departure: e.target.value })}
                      required
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0047FF] hover:bg-[#0038CC] text-white"
                  style={{ borderRadius: 0 }}
                  data-testid="submit-guest-button"
                >
                  Send Invitation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Guests List */}
        <div className="bg-white border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Name</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Company</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Purpose</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Visit Date</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Status</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                    <td className="px-6 py-4 text-[#0A0A0A]">{guest.full_name}</td>
                    <td className="px-6 py-4 text-[#404040]">{guest.company}</td>
                    <td className="px-6 py-4 text-[#404040]">{guest.purpose}</td>
                    <td className="px-6 py-4 text-[#404040]">
                      {new Date(guest.visit_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          guest.status === 'checked_in'
                            ? 'bg-[#16A34A] text-white'
                            : guest.status === 'expected'
                            ? 'bg-[#EAB308] text-white'
                            : guest.status === 'checked_out'
                            ? 'bg-zinc-400 text-white'
                            : 'bg-zinc-200 text-[#0A0A0A]'
                        }`}
                      >
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {guests.length === 0 && (
          <div className="bg-white border border-zinc-200 p-12 text-center mt-6">
            <UserPlus size={48} className="mx-auto mb-4 text-[#737373]" />
            <p className="text-[#737373]">No guests invited yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
