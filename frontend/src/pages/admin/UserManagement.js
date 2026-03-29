import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    department: '',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      toast.success('User created successfully');
      setShowCreateDialog(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'employee',
        department: '',
        phone: '',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const toggleUserStatus = async (email) => {
    try {
      await api.patch(`/users/${email}/toggle-status`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#737373]">Loading users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div data-testid="user-management-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
              User Management
            </h1>
            <p className="text-base text-[#404040]">Manage employees and receptionists</p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#0047FF] hover:bg-[#0038CC] text-white px-6 py-3 flex items-center gap-2"
                style={{ borderRadius: 0 }}
                data-testid="create-user-button"
              >
                <UserPlus size={20} />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-zinc-200" style={{ borderRadius: 0 }}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-[#0A0A0A]">Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                    data-testid="new-user-email-input"
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                    data-testid="new-user-password-input"
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Full Name</Label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    required
                    style={{ borderRadius: 0 }}
                    data-testid="new-user-name-input"
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger style={{ borderRadius: 0 }} data-testid="new-user-role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ borderRadius: 0 }}>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Department</Label>
                  <Input
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <Label className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373]">Phone</Label>
                  <Input
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0047FF] hover:bg-[#0038CC] text-white"
                  style={{ borderRadius: 0 }}
                  data-testid="submit-new-user-button"
                >
                  Create User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-zinc-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Name</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Email</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Role</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Department</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Status</th>
                  <th className="px-6 py-4 text-left text-xs tracking-[0.2em] uppercase font-bold text-[#0A0A0A]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.email} className={index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                    <td className="px-6 py-4 text-[#0A0A0A]">{user.full_name}</td>
                    <td className="px-6 py-4 text-[#404040]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#0047FF] text-white text-xs font-bold uppercase tracking-wider">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#404040]">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="flex items-center gap-2 text-[#16A34A]">
                          <UserCheck size={16} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[#DC2626]">
                          <UserX size={16} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => toggleUserStatus(user.email)}
                        className="bg-[#0A0A0A] hover:bg-[#27272A] text-white px-4 py-2 text-sm"
                        style={{ borderRadius: 0 }}
                        data-testid={`toggle-status-${user.email}`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
