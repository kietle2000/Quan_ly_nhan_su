'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogApi } from '@/lib/api';
import { ShieldAlert, Database, ChevronDown, ChevronRight } from 'lucide-react';

const JsonViewer = ({ data }: { data: string | null }) => {
  const [open, setOpen] = useState(false);
  if (!data || data === 'null') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13 }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Chi tiết JSON
      </button>
      {open && (
        <pre style={{ margin: '8px 0 0', padding: 12, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', overflowX: 'auto', maxWidth: 300 }}>
          {JSON.stringify(JSON.parse(data), null, 2)}
        </pre>
      )}
    </div>
  );
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState('');
  const [action, setAction] = useState('');

  const fetchLogs = async () => {
    if (user?.role !== 'Admin') return;
    setLoading(true);
    try {
      const res = await auditLogApi.getLogs({ tableName: table || undefined, action: action || undefined });
      setLogs(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [table, action, user]);

  if (user?.role !== 'Admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <ShieldAlert size={64} color="var(--accent-red)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Truy cập bị từ chối</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Chỉ Quản trị viên hệ thống (Admin) mới có quyền xem Nhật ký Hoạt động.</p>
      </div>
    );
  }

  const getActionBadge = (act: string) => {
    switch (act) {
      case 'Create': return <span className="badge badge-green">Thêm mới</span>;
      case 'Update': return <span className="badge badge-blue">Cập nhật</span>;
      case 'Delete': return <span className="badge badge-red">Xóa</span>;
      default: return <span className="badge badge-gray">{act}</span>;
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Nhật ký Hoạt động (Audit Logs)</h1>
          <p className="page-subtitle">Theo dõi mọi thay đổi dữ liệu trong hệ thống</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: 'flex', gap: 16 }}>
        <div>
          <label className="form-label">Lọc theo Bảng</label>
          <input className="form-input" placeholder="Ví dụ: Employees, Leads..." value={table} onChange={e => setTable(e.target.value)} style={{ width: 220 }} />
        </div>
        <div>
          <label className="form-label">Hành động</label>
          <select className="form-input" value={action} onChange={e => setAction(e.target.value)} style={{ width: 180 }}>
            <option value="">-- Tất cả --</option>
            <option value="Create">Thêm mới</option>
            <option value="Update">Cập nhật</option>
            <option value="Delete">Xóa</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} /></div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Không có hoạt động nào được ghi nhận.</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }}></div>
                
                {logs.map((log) => {
                  let badgeColor = 'var(--bg-hover)';
                  let iconColor = 'var(--text-muted)';
                  
                  if (log.action === 'Create' || log.action === 'Insert') { badgeColor = 'rgba(34, 197, 94, 0.15)'; iconColor = 'var(--accent-green)'; }
                  if (log.action === 'Update') { badgeColor = 'rgba(59, 130, 246, 0.15)'; iconColor = 'var(--accent-blue)'; }
                  if (log.action === 'Delete') { badgeColor = 'rgba(239, 68, 68, 0.15)'; iconColor = 'var(--accent-red)'; }

                  return (
                    <div key={log.id} style={{ position: 'relative', marginBottom: 28, zIndex: 1 }}>
                      {/* Timeline Dot */}
                      <div style={{ position: 'absolute', left: -24, top: 4, width: 16, height: 16, borderRadius: '50%', background: badgeColor, border: `2px solid ${iconColor}`, zIndex: 2 }}></div>
                      
                      <div className="glass-card" style={{ padding: 16, marginLeft: 16, borderLeft: `3px solid ${iconColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginRight: 8 }}>{log.employeeName || log.employee?.fullName || 'System'}</span>
                            <span style={{ fontSize: 13, background: badgeColor, color: iconColor, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{log.action}</span>
                            <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8 }}>
                              trên <code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>{log.tableName}</code> (ID: {log.recordId || log.primaryKey})
                            </span>
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 20 }}>
                          {(log.oldValues && log.oldValues !== 'null' && log.oldValues !== '{}') && (
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: 12, color: 'var(--accent-red)', display: 'block', marginBottom: 4 }}>Dữ liệu cũ:</strong>
                              <JsonViewer data={log.oldValues} />
                            </div>
                          )}
                          {(log.newValues && log.newValues !== 'null' && log.newValues !== '{}') && (
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: 12, color: 'var(--accent-green)', display: 'block', marginBottom: 4 }}>Dữ liệu mới:</strong>
                              <JsonViewer data={log.newValues} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
