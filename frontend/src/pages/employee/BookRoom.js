import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const BookRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minCapacity: '',
    floor: '',
  });
  const [booking, setBooking] = useState({
    room_code: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    attendees_internal: '',
    attendees_external: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    }
  };

  const handleFilterChange = () => {
    let filtered = [...rooms];
    
    if (filters.minCapacity) {
      filtered = filtered.filter(room => room.capacity >= parseInt(filters.minCapacity));
    }
    
    if (filters.floor) {
      filtered = filtered.filter(room => room.floor === parseInt(filters.floor));
    }
    
    setFilteredRooms(filtered);
  };

  const checkAvailability = async () => {
    if (!booking.start_time || !booking.end_time) {
      toast.error('Please select start and end time');
      return;
    }

    try {
      setLoading(true);
      const params = {
        start_time: new Date(booking.start_time).toISOString(),
        end_time: new Date(booking.end_time).toISOString(),
      };
      
      if (filters.minCapacity) {
        params.capacity = parseInt(filters.minCapacity);
      }

      const response = await api.get('/rooms/availability', { params });
      setFilteredRooms(response.data);
      toast.success(`${response.data.length} rooms available`);
    } catch (error) {
      toast.error('Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!booking.room_code) {
      toast.error('Please select a room');
      return;
    }

    try {
      const bookingData = {
        ...booking,
        start_time: new Date(booking.start_time).toISOString(),
        end_time: new Date(booking.end_time).toISOString(),
        attendees_internal: booking.attendees_internal
          .split(',')
          .map(e => e.trim())
          .filter(Boolean),
        attendees_external: booking.attendees_external
          .split(',')
          .map(e => e.trim())
          .filter(Boolean),
      };

      await api.post('/bookings', bookingData);
      toast.success('Room booked successfully!');
      
      // Reset form
      setBooking({
        room_code: '',
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        attendees_internal: '',
        attendees_external: '',
      });
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    }
  };

  return (
    <Layout>
      <div data-testid="book-room-page">
        <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
          Book Meeting Room
        </h1>
        <p className="text-base text-[#404040] mb-8">Find and reserve a meeting room</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters & Booking Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <div className="bg-white border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-[#0A0A0A] mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Min Capacity</Label>
                  <Input
                    type="number"
                    value={filters.minCapacity}
                    onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })}
                    placeholder="e.g., 10"
                    style={{ borderRadius: 0 }}
                    data-testid="filter-capacity-input"
                  />
                </div>
                
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Floor</Label>
                  <Input
                    type="number"
                    value={filters.floor}
                    onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
                    placeholder="e.g., 1"
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <Button
                  onClick={handleFilterChange}
                  className="w-full bg-[#0A0A0A] hover:bg-[#27272A] text-white"
                  style={{ borderRadius: 0 }}
                  data-testid="apply-filters-button"
                >
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-[#0A0A0A] mb-4">Booking Details</h2>
              
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Meeting Title</Label>
                  <Input
                    value={booking.title}
                    onChange={(e) => setBooking({ ...booking, title: e.target.value })}
                    required
                    placeholder="Team Sync"
                    style={{ borderRadius: 0 }}
                    data-testid="booking-title-input"
                  />
                </div>

                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={booking.start_time}
                    onChange={(e) => setBooking({ ...booking, start_time: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                    data-testid="booking-start-time-input"
                  />
                </div>

                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={booking.end_time}
                    onChange={(e) => setBooking({ ...booking, end_time: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                    data-testid="booking-end-time-input"
                  />
                </div>

                <Button
                  type="button"
                  onClick={checkAvailability}
                  disabled={loading}
                  className="w-full bg-[#0047FF] hover:bg-[#0038CC] text-white flex items-center justify-center gap-2"
                  style={{ borderRadius: 0 }}
                  data-testid="check-availability-button"
                >
                  <Search size={18} />
                  {loading ? 'Checking...' : 'Check Availability'}
                </Button>

                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Description</Label>
                  <Input
                    value={booking.description}
                    onChange={(e) => setBooking({ ...booking, description: e.target.value })}
                    placeholder="Optional"
                    style={{ borderRadius: 0 }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!booking.room_code}
                  className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white"
                  style={{ borderRadius: 0 }}
                  data-testid="confirm-booking-button"
                >
                  Confirm Booking
                </Button>
              </form>
            </div>
          </div>

          {/* Available Rooms */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 p-6">
              <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A] mb-6">
                Available Rooms ({filteredRooms.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.room_code}
                    onClick={() => setBooking({ ...booking, room_code: room.room_code })}
                    className={`border p-4 cursor-pointer transition-all ${
                      booking.room_code === room.room_code
                        ? 'border-[#0047FF] bg-blue-50'
                        : 'border-zinc-200 hover:border-[#0047FF]'
                    }`}
                    data-testid={`room-option-${room.room_code}`}
                  >
                    {room.images && room.images[0] && (
                      <img
                        src={room.images[0]}
                        alt={room.room_name}
                        className="w-full h-32 object-cover mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-[#0A0A0A] mb-1">{room.room_name}</h3>
                    <p className="text-xs text-[#737373] mb-2">{room.room_code}</p>
                    <p className="text-sm text-[#404040] mb-2">
                      <strong>Capacity:</strong> {room.capacity} | <strong>Floor:</strong> {room.floor}
                    </p>
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-zinc-100 text-xs text-[#404040]"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredRooms.length === 0 && (
                <p className="text-center text-[#737373] py-8">
                  No rooms available. Try different filters or time slot.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
