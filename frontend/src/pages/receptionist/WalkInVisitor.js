import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { UserPlus, Briefcase, Users, Truck, Wrench, HardHat, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const purposeIcons = {
  'Business Meeting': Briefcase,
  'Interview': Users,
  'Delivery': Truck,
  'Maintenance': Wrench,
  'Casual Worker': HardHat,
  'Other': UserPlus,
};

export const WalkInVisitor = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    id_passport_number: '',
    vehicle_plate: '',
    host_employee_email: '',
    purpose: 'Business Meeting',
    arrival_time: new Date().toISOString().slice(0, 16),
    additional_notes: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users/employees/list');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        arrival_time: new Date(formData.arrival_time).toISOString(),
      };

      const response = await api.post('/guests/walk-in', submitData);
      
      setSuccessData(response.data);
      setShowSuccess(true);
      toast.success('Walk-in visitor registered!');

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        id_passport_number: '',
        vehicle_plate: '',
        host_employee_email: '',
        purpose: 'Business Meeting',
        arrival_time: new Date().toISOString().slice(0, 16),
        additional_notes: '',
      });

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to register visitor');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess && successData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white border-2 border-[#FF9800] p-12 max-w-2xl w-full text-center">
            <CheckCircle size={80} className="text-[#FF9800] mx-auto mb-6" />
            <h1 className="text-4xl font-black text-[#0A0A0A] mb-4">
              Welcome, {successData.visitor_name}!
            </h1>
            <p className="text-lg text-[#404040] mb-6">
              Your host <strong>{successData.host_name}</strong> has been notified.
            </p>
            <div className="bg-[#FF9800] text-white p-6 mb-6">
              <p className="text-sm uppercase tracking-wider mb-2">Visitor Badge Number</p>
              <p className="text-3xl font-black">{successData.badge_number}</p>
            </div>
            <p className="text-[#737373] mb-8">
              Please wait at reception. Thank you!
            </p>
            <Button
              onClick={() => setShowSuccess(false)}
              className="bg-[#0A0A0A] hover:bg-[#27272A] text-white px-8 py-3"
              style={{ borderRadius: 0 }}
            >
              Register Another Visitor
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="walk-in-visitor-page">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#FF9800] flex items-center justify-center">
              <UserPlus size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A]">
              Walk-In Visitor Registration
            </h1>
          </div>
          <p className="text-base text-[#404040] ml-16">Register visitors without prior appointment</p>
        </div>

        <div className="bg-white border-2 border-[#FF9800] p-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                  Full Name *
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="border-2 border-zinc-200 px-4 py-3 text-lg focus:border-[#FF9800]"
                  style={{ borderRadius: 0 }}
                  placeholder="John Doe"
                  data-testid="walk-in-name-input"
                />
              </div>
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                  Phone Number *
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="border-2 border-zinc-200 px-4 py-3 text-lg focus:border-[#FF9800]"
                  style={{ borderRadius: 0 }}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Email & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                  Email Address
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-2 border-zinc-200 px-4 py-3 text-lg"
                  style={{ borderRadius: 0 }}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                  Company / Organization
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="border-2 border-zinc-200 px-4 py-3 text-lg"
                  style={{ borderRadius: 0 }}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            {/* ID & Vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                  ID / Passport Number *
                </Label>
                <Input
                  value={formData.id_passport_number}
                  onChange={(e) => setFormData({ ...formData, id_passport_number: e.target.value })}
                  required
                  className="border-2 border-zinc-200 px-4 py-3 text-lg focus:border-[#FF9800]"
                  style={{ borderRadius: 0 }}
                  placeholder="ID12345678"
                />
              </div>
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                  Vehicle Number Plate
                </Label>
                <Input
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  className="border-2 border-zinc-200 px-4 py-3 text-lg"
                  style={{ borderRadius: 0 }}
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            {/* Host Employee */}
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                Host Employee *
              </Label>
              <Select 
                value={formData.host_employee_email} 
                onValueChange={(value) => setFormData({ ...formData, host_employee_email: value })}
                required
              >
                <SelectTrigger 
                  className="border-2 border-zinc-200 px-4 py-3 text-lg focus:border-[#FF9800]"
                  style={{ borderRadius: 0 }}
                  data-testid="host-employee-select"
                >
                  <SelectValue placeholder="Select host employee" />
                </SelectTrigger>
                <SelectContent style={{ borderRadius: 0 }}>
                  {employees.map((emp) => (
                    <SelectItem key={emp.email} value={emp.email}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                Purpose of Visit *
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(purposeIcons).map(([purpose, Icon]) => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setFormData({ ...formData, purpose })}
                    className={`border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                      formData.purpose === purpose
                        ? 'border-[#FF9800] bg-orange-50'
                        : 'border-zinc-200 hover:border-[#FF9800]'
                    }`}
                  >
                    <Icon size={32} className={formData.purpose === purpose ? 'text-[#FF9800]' : 'text-[#737373]'} />
                    <span className={`text-sm font-semibold ${
                      formData.purpose === purpose ? 'text-[#FF9800]' : 'text-[#737373]'
                    }`}>
                      {purpose}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Arrival Time */}
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#FF9800] mb-2 block">
                Arrival Time *
              </Label>
              <Input
                type="datetime-local"
                value={formData.arrival_time}
                onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                required
                className="border-2 border-zinc-200 px-4 py-3 text-lg focus:border-[#FF9800]"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Additional Notes */}
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                Additional Notes
              </Label>
              <Input
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                className="border-2 border-zinc-200 px-4 py-3 text-lg"
                style={{ borderRadius: 0 }}
                placeholder="Any special requirements or notes"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF9800] hover:bg-[#F57C00] text-white px-8 py-4 text-lg font-bold flex items-center justify-center gap-3"
              style={{ borderRadius: 0 }}
              data-testid="submit-walk-in-button"
            >
              <UserPlus size={24} />
              {loading ? 'Registering...' : 'Register Visitor'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
