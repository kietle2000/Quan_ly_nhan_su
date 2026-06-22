'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogIn, Phone, Lock, AlertCircle } from 'lucide-react';
import { studentAuthApi } from '@/lib/api';

export default function StudentLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await studentAuthApi.login({ phone, password });
      if (res.data && res.data.token) {
        // Lưu token và thông tin user
        localStorage.setItem('student_token', res.data.token);
        localStorage.setItem('student_user', JSON.stringify(res.data.user));
        
        // Chuyển hướng đến Dashboard học viên
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Số điện thoại hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', padding: 20 }}>
      <div className="glass-card animate-fadeInUp" style={{ width: '100%', maxWidth: 420, padding: 40, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 20, background: 'var(--accent-blue)', color: 'white', marginBottom: 16 }}>
            <GraduationCap size={36} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>Cổng Học Viên</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Đăng nhập để xem lịch học và điểm danh</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(255, 59, 48, 0.1)', color: 'var(--accent-red)', borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="form-label">Số điện thoại</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Phone size={18} />
              </div>
              <input 
                type="tel" 
                className="form-input" 
                style={{ paddingLeft: 42 }}
                placeholder="Nhập số điện thoại của bạn"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: 42 }}
                placeholder="Mật khẩu mặc định"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
              *Mật khẩu mặc định: NhanPhu2026
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 16, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : <><LogIn size={20} /> Đăng nhập</>}
          </button>
        </form>
      </div>
    </div>
  );
}
