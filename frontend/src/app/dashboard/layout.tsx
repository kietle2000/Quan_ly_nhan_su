'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceApi, notificationApi } from '@/lib/api';
import {
  LayoutDashboard, Users, Building2, Briefcase, ClipboardList,
  FileText, BarChart3, Clock, Calendar, Bell, LogOut,
  ChevronLeft, ChevronRight, UserCheck, ShieldCheck, Activity,
  TrendingUp, Menu, X, BookOpen, Star, Link as LinkIcon, GraduationCap
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
  { href: '/dashboard/employees', label: 'Nhân viên', icon: Users, roles: ['Admin', 'Manager'] },
  { href: '/dashboard/departments', label: 'Phòng ban', icon: Building2, roles: ['Admin'] },
  { href: '/dashboard/positions', label: 'Chức vụ', icon: Briefcase, roles: ['Admin'] },
  { href: '/dashboard/workplan', label: 'Kế hoạch tuần', icon: ClipboardList, roles: ['Admin', 'Manager', 'Employee'] },
  { href: '/dashboard/reports', label: 'Báo cáo', icon: FileText, roles: ['Admin', 'Manager', 'Employee'] },
  { href: '/dashboard/crm', label: 'CRM Khách hàng', icon: UserCheck, roles: ['Admin', 'Manager', 'Employee'] },
  { href: '/dashboard/kpi', label: 'KPI', icon: TrendingUp, roles: ['Admin', 'Manager', 'Employee'] },
  { href: '/dashboard/attendance', label: 'Chấm công', icon: Clock, roles: ['Admin', 'Manager', 'Employee', 'Instructor'] },
  { href: '/dashboard/leave', label: 'Nghỉ phép', icon: Calendar, roles: ['Admin', 'Manager', 'Employee', 'Instructor'] },
  { href: '/dashboard/classes', label: 'Quản lý Đào tạo', icon: GraduationCap, roles: ['Admin', 'Manager', 'Instructor'] },
  { href: '/dashboard/knowledge', label: 'Kho tài liệu', icon: BookOpen, roles: ['Admin', 'Manager', 'Employee', 'Instructor'] },
  { href: '/dashboard/integrations', label: 'Tích hợp & API', icon: LinkIcon, roles: ['Admin'] },
  { href: '/dashboard/notifications', label: 'Thông báo', icon: Bell, roles: ['Admin', 'Manager', 'Employee', 'Instructor'] },
  { href: '/dashboard/auditlog', label: 'Nhật ký HĐ', icon: Activity, roles: ['Admin'] },
];

function CheckInWidget() {
  const [status, setStatus] = useState<{ checkedIn: boolean; checkedOut: boolean; log?: { checkInTime?: string; workHours?: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    attendanceApi.getTodayStatus().then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkIn();
      const r = await attendanceApi.getTodayStatus();
      setStatus(r.data);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi check-in');
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.checkOut();
      const r = await attendanceApi.getTodayStatus();
      setStatus(r.data);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi check-out');
    }
    setLoading(false);
  };

  const localTime = new Date(time.getTime() + 0); // already local
  const hms = localTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
      background: 'var(--bg-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)', fontVariantNumeric: 'tabular-nums' }}>
          {hms}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {status?.checkedIn ? (status.checkedOut ? `✅ ${status.log?.workHours?.toFixed(1)}h` : '🟢 Đang làm') : '⭕ Chưa vào'}
        </div>
      </div>
      {!status?.checkedIn ? (
        <button className="btn btn-success btn-sm" onClick={handleCheckIn} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Check-in'}
        </button>
      ) : !status?.checkedOut ? (
        <button className="btn btn-danger btn-sm" onClick={handleCheckOut} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Check-out'}
        </button>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Đã về ✓</span>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    notificationApi.getNotifications()
      .then(r => setUnreadCount(r.data.filter((n: { isRead: boolean }) => !n.isRead).length))
      .catch(() => {});
  }, []);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  const visibleItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role));
  const sidebarWidth = collapsed ? 72 : 256;

  const roleColors = { Admin: 'var(--accent-purple)', Manager: 'var(--accent-blue)', Employee: 'var(--accent-green)', Instructor: 'var(--accent-orange)' };
  const roleColor = roleColors[user.role as keyof typeof roleColors] || 'var(--text-secondary)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 39 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth, minHeight: '100vh', background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)', position: 'fixed', left: 0, top: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease',
        overflow: 'hidden',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }} className={`sidebar${mobileOpen ? ' open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--gradient-main)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(79,142,247,0.3)'
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>Nhân Phú HRM</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Du học Nhân Phú</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  margin: '2px 8px', borderRadius: 8, textDecoration: 'none',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(79,142,247,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s ease', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          {!collapsed && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `${roleColor}22`, border: `2px solid ${roleColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: roleColor
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: 11, color: roleColor, fontWeight: 600 }}>{user.role}</div>
              </div>
            </div>
          )}
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 500
          }}>
            <LogOut size={16} />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 24, right: -14, width: 28, height: 28,
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-muted)'
          }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: sidebarWidth, flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.2s ease' }}>
        {/* Top Header */}
        <header style={{
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 30
        }}>
          <button onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
            className="md:hidden">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <CheckInWidget />
            <Link href="/dashboard/notifications" style={{ position: 'relative', color: 'var(--text-secondary)' }}>
              <Bell size={22} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6, background: 'var(--accent-red)',
                  color: 'white', fontSize: 10, fontWeight: 700, width: 18, height: 18,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--bg-secondary)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
