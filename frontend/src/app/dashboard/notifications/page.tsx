'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationApi, employeeApi } from '@/lib/api';
import { Bell, Check, Send, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', recipientId: '' });
  const [saving, setSaving] = useState(false);

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data);
      if (isManagerOrAdmin && employees.length === 0) {
        const eRes = await employeeApi.getAll();
        setEmployees(eRes.data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifs(); }, []);

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await notificationApi.createNotification({ ...form, recipientId: form.recipientId || undefined });
      setShowAdd(false); setForm({ title: '', content: '', recipientId: '' }); fetchNotifs();
    } catch { alert('Lỗi gửi thông báo'); }
    setSaving(false);
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Thông báo</h1>
          <p className="page-subtitle">Cập nhật tin tức và nhắc nhở</p>
        </div>
        {isManagerOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Send size={16} /> Gửi thông báo</button>
        )}
      </div>

      <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((n) => (
              <div key={n.id} onClick={() => handleRead(n.id, n.isRead)} style={{
                padding: '16px 24px', borderBottom: '1px solid var(--border)', cursor: n.isRead ? 'default' : 'pointer',
                background: n.isRead ? 'transparent' : 'rgba(79,142,247,0.05)',
                borderLeft: n.isRead ? '4px solid transparent' : '4px solid var(--accent-blue)',
                transition: 'background 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: n.isRead ? 600 : 700, margin: 0, color: n.isRead ? 'var(--text-primary)' : 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }} />}
                    {n.title}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', paddingLeft: n.isRead ? 0 : 16 }}>{n.content}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Gửi thông báo nội bộ</h2>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label className="form-label">Tiêu đề *</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
                <div><label className="form-label">Nội dung *</label><textarea className="form-input" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required /></div>
                <div>
                  <label className="form-label">Người nhận (Bỏ trống để gửi toàn công ty)</label>
                  <select className="form-input" value={form.recipientId} onChange={e => setForm({...form, recipientId: e.target.value})}>
                    <option value="">-- Gửi tất cả mọi người --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Gửi đi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
