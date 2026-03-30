import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Calendar, UserPlus, BarChart3, Settings, LogOut, Bot, ClipboardCheck } from 'lucide-react';
import { Button } from './ui/button';

const adminLinks = [
  { to: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/rooms', icon: Building2, label: 'Meeting Rooms' },
  { to: '/admin/bookings', icon: Calendar, label: 'All Bookings' },
  { to: '/admin/visitors', icon: UserPlus, label: 'Visitor Log' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

const employeeLinks = [
  { to: '/employee/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/employee/book', icon: Calendar, label: 'Book Room' },
  { to: '/employee/bookings', icon: Calendar, label: 'My Bookings' },
  { to: '/employee/guests', icon: UserPlus, label: 'My Guests' },
  { to: '/employee/ai-chat', icon: Bot, label: 'AI Assistant' },
];

const receptionistLinks = [
  { to: '/receptionist/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/receptionist/walk-in', icon: UserPlus, label: 'Walk-In Visitor' },
  { to: '/receptionist/check-in', icon: ClipboardCheck, label: 'Check In' },
  { to: '/receptionist/check-out', icon: ClipboardCheck, label: 'Check Out' },
  { to: '/receptionist/visitors', icon: UserPlus, label: "Today's Visitors" },
  { to: '/receptionist/rooms', icon: Building2, label: 'Room Status' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let links = [];
  if (user?.role === 'admin') links = adminLinks;
  else if (user?.role === 'employee') links = employeeLinks;
  else if (user?.role === 'receptionist') links = receptionistLinks;

  return (
    <div className="w-64 bg-white border-r border-zinc-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-zinc-200">
        <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
          GuestFlow
        </h2>
        <p className="text-xs tracking-[0.2em] uppercase text-[#737373] mt-1">
          {user?.role}
        </p>
      </div>

      <nav className="flex-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 mb-1 transition-colors ${
                isActive
                  ? 'bg-[#0047FF] text-white'
                  : 'text-[#404040] hover:bg-zinc-50'
              }`}
              data-testid={`sidebar-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200">
        <div className="mb-4 px-4">
          <p className="text-sm font-semibold text-[#0A0A0A]">{user?.full_name}</p>
          <p className="text-xs text-[#737373]">{user?.email}</p>
        </div>
        <Button
          onClick={handleLogout}
          className="w-full bg-[#0A0A0A] hover:bg-[#27272A] text-white px-4 py-2 flex items-center justify-center gap-2"
          style={{ borderRadius: 0 }}
          data-testid="logout-button"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </div>
  );
};
