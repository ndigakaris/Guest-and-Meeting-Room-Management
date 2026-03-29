import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_name: '',
    room_code: '',
    capacity: '',
    floor: '',
    amenities: '',
    equipment: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const roomData = {
        ...newRoom,
        capacity: parseInt(newRoom.capacity),
        floor: parseInt(newRoom.floor),
        amenities: newRoom.amenities.split(',').map(a => a.trim()).filter(Boolean),
        equipment: newRoom.equipment.split(',').map(e => e.trim()).filter(Boolean),
        images: ['https://images.unsplash.com/photo-1772112334844-2eed0111e690?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBtZWV0aW5nJTIwcm9vbXxlbnwwfHx8fDE3NzQ3NjIwMTh8MA&ixlib=rb-4.1.0&q=85'],
      };
      
      await api.post('/rooms', roomData);
      toast.success('Room created successfully');
      setShowCreateDialog(false);
      setNewRoom({
        room_name: '',
        room_code: '',
        capacity: '',
        floor: '',
        amenities: '',
        equipment: '',
      });
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create room');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#737373]">Loading rooms...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="room-management-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
              Meeting Rooms
            </h1>
            <p className="text-base text-[#404040]">Manage meeting room inventory</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#0047FF] hover:bg-[#0038CC] text-white px-6 py-3 flex items-center gap-2"
                style={{ borderRadius: 0 }}
                data-testid="create-room-button"
              >
                <Plus size={20} />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-zinc-200 max-w-2xl" style={{ borderRadius: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#0A0A0A]">Create New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Room Name</Label>
                    <Input
                      value={newRoom.room_name}
                      onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                      required
                      placeholder="Conference Room A"
                      style={{ borderRadius: 0 }}
                      data-testid="new-room-name-input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Room Code</Label>
                    <Input
                      value={newRoom.room_code}
                      onChange={(e) => setNewRoom({ ...newRoom, room_code: e.target.value })}
                      required
                      placeholder="CR-A"
                      style={{ borderRadius: 0 }}
                      data-testid="new-room-code-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Capacity</Label>
                    <Input
                      type="number"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                      required
                      placeholder="10"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Floor</Label>
                    <Input
                      type="number"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                      required
                      placeholder="1"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Amenities (comma-separated)</Label>
                  <Input
                    value={newRoom.amenities}
                    onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                    placeholder="Projector, Whiteboard, Video Conferencing"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Equipment (comma-separated)</Label>
                  <Input
                    value={newRoom.equipment}
                    onChange={(e) => setNewRoom({ ...newRoom, equipment: e.target.value })}
                    placeholder="HDMI Cable, Conference Phone"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0047FF] hover:bg-[#0038CC] text-white"
                  style={{ borderRadius: 0 }}
                  data-testid="submit-new-room-button"
                >
                  Create Room
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.room_code}
              className="bg-white border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
              data-testid={`room-card-${room.room_code}`}
            >
              {room.images && room.images[0] && (
                <img
                  src={room.images[0]}
                  alt={room.room_name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0A0A0A]">{room.room_name}</h3>
                    <p className="text-xs tracking-[0.2em] uppercase text-[#737373]">{room.room_code}</p>
                  </div>
                  <Building2 size={24} className="text-[#0047FF]" />
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-[#404040]">
                    <strong>Capacity:</strong> {room.capacity} people
                  </p>
                  <p className="text-sm text-[#404040]">
                    <strong>Floor:</strong> {room.floor}
                  </p>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-zinc-50 border border-zinc-200 text-xs text-[#404040]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="bg-white border border-zinc-200 p-12 text-center">
            <Building2 size={48} className="mx-auto mb-4 text-[#737373]" />
            <p className="text-[#737373]">No meeting rooms yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};
