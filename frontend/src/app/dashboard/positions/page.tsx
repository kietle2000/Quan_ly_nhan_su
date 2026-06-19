'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { positionApi } from '@/lib/api';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';

interface Position { id: string; name: string; description?: string; }

export default function PositionsPage() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editPos, setEditPos] = useState<Position | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await positionApi.getAll();
      setPositions(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await positionApi.create(form);
      setShowAdd(false); setForm({ name: '', description: '' }); fetchPositions();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi'); }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editPos) return; setSaving(true); setError('');
    try {
      await positionApi.update(editPos.id, form);
      setEditPos(null); fetchPositions();
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi'); }
    setSaving(false);
  };

  const openEdit = (pos: Position) => {
    setEditPos(pos);
    setForm({ name: pos.name, description: pos.description || '' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa chức vụ "${name}"?`)) return;
    try { await positionApi.delete(id); fetchPositions(); } catch (err: unknown) { alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi xóa'); }
  };

  const renderModal = (onClose: () => void, onSubmit: (e: React.FormEvent) => void, title: string) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>{title}</h2>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>{error}</div>}
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="form-label">Tên chức vụ *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="form-label">Mô tả</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Quản lý Chức vụ</h1>
          <p className="page-subtitle">Các chức vụ trong công ty</p>
        </div>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '' }); setShowAdd(true); }}><Plus size={16} /> Thêm chức vụ</button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên chức vụ</th>
                  <th>Mô tả</th>
                  {user?.role === 'Admin' && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => (
                  <tr key={pos.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Briefcase size={16} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>{pos.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{pos.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    {user?.role === 'Admin' && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(pos)}><Edit size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pos.id, pos.name)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr><td colSpan={user?.role === 'Admin' ? 3 : 2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chưa có chức vụ nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAdd && renderModal(() => setShowAdd(false), handleAdd, "Thêm chức vụ mới")}
      {editPos && renderModal(() => setEditPos(null), handleEdit, `Chỉnh sửa: ${editPos.name}`)}
    </div>
  );
}
