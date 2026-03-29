import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('Login successful');
      
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'employee') {
        navigate('/employee/dashboard');
      } else if (user.role === 'receptionist') {
        navigate('/receptionist/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1757359315242-9813e0544bb7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGxpZ2h0JTIwZ3JheSUyMGFyY2hpdGVjdHVyYWwlMjBtaW5pbWFsfGVufDB8fHx8MTc3NDc2MjAyNHww&ixlib=rb-4.1.0&q=85)' }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-200 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight text-[#0A0A0A] mb-2">
              Guest & Room Management
            </h1>
            <p className="text-base text-[#404040]">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-zinc-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0047FF] focus:ring-offset-2"
                style={{ borderRadius: 0 }}
                placeholder="your@email.com"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs tracking-[0.2em] uppercase font-bold text-[#737373] mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-zinc-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0047FF] focus:ring-offset-2"
                style={{ borderRadius: 0 }}
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0047FF] hover:bg-[#0038CC] text-white px-6 py-3 font-semibold transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderRadius: 0 }}
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200">
            <p className="text-sm text-[#737373]">
              <strong>Demo Credentials:</strong><br />
              Admin: admin@company.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
