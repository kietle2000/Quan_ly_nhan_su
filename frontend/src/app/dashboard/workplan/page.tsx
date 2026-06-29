'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workPlanApi, employeeApi, crmApi } from '@/lib/api';
import { Plus, Save, Trash2, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { getISOWeek, getYear, setISOWeek as dateFnsSetISOWeek, setYear as dateFnsSetYear, startOfWeek, endOfWeek, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Employee { id: string; fullName: string; role?: string; }
interface WorkPlanItem { id?: string; date: string; taskName: string; actionPlan: string; supporterId: string | null; deadline: string; kpi: string; status: string; notes: string; }
interface WeeklyWorkPlan { 
  id?: string; weekNumber: number; year: number; employeeId: string; weekTarget: string; notes: string; items: WorkPlanItem[]; 
  targetNew?: number; targetContacted?: number; targetConsulting?: number; targetMeeting?: number; targetSigned?: number;
  actualNew?: number; actualContacted?: number; actualConsulting?: number; actualMeeting?: number; actualSigned?: number;
  evalNew?: string; evalContacted?: string; evalConsulting?: string; evalMeeting?: string; evalSigned?: string;
  failureReasonAnalysis?: string;
  adminFeedback?: string;
}

const STATUS_COLORS: Record<string, string> = { Pending: 'badge-gray', InProgress: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
const STATUS_LABELS: Record<string, string> = { Pending: 'Chưa làm', InProgress: 'Đang làm', Completed: 'Hoàn thành', Cancelled: 'Hủy bỏ' };

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WorkPlanPage() {
  const { user } = useAuth();
  const [week, setWeek] = useState(getISOWeek(new Date()));
  const [year, setYear] = useState(getYear(new Date()));
  const [plan, setPlan] = useState<WeeklyWorkPlan | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  // States for Daily Work Plan Items
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState<WorkPlanItem>({
    date: getLocalDateString(), taskName: '', actionPlan: '', supporterId: '', deadline: '', kpi: '', status: 'Pending', notes: ''
  });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const getDateRangeStr = () => {
    try {
      const baseDate = dateFnsSetISOWeek(dateFnsSetYear(new Date(), year), week);
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      return `(${format(start, 'dd/MM', { locale: vi })} - ${format(end, 'dd/MM', { locale: vi })})`;
    } catch { return ''; }
  };
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';
  const isViewingOthers = !!(isManagerOrAdmin && selectedEmployeeId && selectedEmployeeId !== user?.id);

  useEffect(() => {
    employeeApi.getAll().then(res => setEmployees(res.data)).catch(() => {});
  }, []);

  const fetchPlan = async () => {
    setLoading(true); setPlan(null); setAllPlans([]);
    try {
      const [plansRes, leadsRes] = await Promise.all([
        isManagerOrAdmin ? workPlanApi.getPlans() : workPlanApi.getMyPlan(undefined, undefined, user?.id),
        crmApi.getLeads()
      ]);
      const allLeads = leadsRes.data || [];
      
      const getMetrics = (empId: string) => {
        let crmCustomersCount = 0;
        const isInWeek = (dateStr: string) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return false;
          return getISOWeek(d) === week && getYear(d) === year;
        };
        allLeads.forEach((l: any) => {
          if (l.ownerId !== empId) return;
          if (isInWeek(l.createdAt)) crmCustomersCount++;
        });
        return { targetNew: crmCustomersCount };
      };

      let filteredPlans = (plansRes.data || []).filter((x: any) => x.weekNumber === week && x.year === year);
      // Ghi đè targetNew từ CRM
      filteredPlans = filteredPlans.map((p: any) => ({ ...p, ...getMetrics(p.employeeId) }));

      let p: any = null;
      if (isManagerOrAdmin) {
        setAllPlans(filteredPlans);
        if (selectedEmployeeId) {
          p = filteredPlans.find((x: any) => x.employeeId === selectedEmployeeId);
          if (!p) p = { weekNumber: week, year, employeeId: selectedEmployeeId, weekTarget: '', notes: '', items: [], ...getMetrics(selectedEmployeeId) };
        }
      } else {
        p = filteredPlans.length > 0 ? filteredPlans[0] : { weekNumber: week, year, employeeId: user?.id || '', weekTarget: '', notes: '', items: [], ...getMetrics(user?.id || '') };
      }

      if (p) setPlan(p);
    } catch (e) { console.error('Lỗi lấy dữ liệu KPI:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchPlan(); }, [week, year, selectedEmployeeId, isManagerOrAdmin]);

  const handleSave = async () => {
    if (!plan || isViewingOthers) return;
    setSaving(true);
    try {
      await workPlanApi.savePlan(plan);
      alert('Đã lưu kế hoạch thành công!');
      fetchPlan();
    } catch (err: unknown) { alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Lỗi lưu kế hoạch'); }
    setSaving(false);
  };

  const submitFeedback = async () => {
    if (!plan) return;
    if (!plan.id) {
      alert('Nhân viên này chưa lưu kế hoạch cho tuần này lên hệ thống. Không thể gửi nhận xét!');
      return;
    }
    if (!feedbackText.trim()) return;
    
    setSubmittingFeedback(true);
    try {
      await workPlanApi.addFeedback(plan.id, feedbackText);
      alert('Đã gửi nhận xét thành công!');
      fetchPlan();
      setFeedbackText('');
    } catch {
      alert('Lỗi gửi nhận xét');
    }
    setSubmittingFeedback(false);
  };



  const handleSaveItem = async () => {
    if (!plan) return;
    if (!itemForm.taskName) return alert('Vui lòng nhập Mục tiêu & Đầu việc cụ thể');
    
    const newItems = [...(plan.items || [])];
    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = { ...itemForm };
    } else {
      newItems.push({ ...itemForm, id: Math.random().toString(36).substring(7) });
    }
    
    const newPlan = { ...plan, items: newItems };
    setPlan(newPlan);
    setShowItemForm(false);
    setItemForm({ date: getLocalDateString(), taskName: '', actionPlan: '', supporterId: '', deadline: '', kpi: '', status: 'Pending', notes: '' });
    setEditingItemIndex(null);
    
    // Auto save to backend immediately
    try {
      const res = await workPlanApi.savePlan(newPlan);
      if (res.data?.id && !newPlan.id) {
        setPlan(prev => prev ? { ...prev, id: res.data.id } : null);
      }
    } catch {
      alert('Đã có lỗi xảy ra khi lưu lên server.');
    }
  };

  const handleDeleteItem = async (index: number, itemId?: string) => {
    if (!plan || !confirm('Bạn có chắc chắn muốn xóa đầu việc này?')) return;
    
    const newItems = [...(plan.items || [])];
    newItems.splice(index, 1);
    const newPlan = { ...plan, items: newItems };
    setPlan(newPlan);
    
    // Save to backend
    try {
      if (plan.id) {
        await workPlanApi.savePlan(newPlan);
      }
    } catch {
      alert('Lỗi xóa trên server');
    }
  };
  const autoGenerateComments = () => {
    if (!plan) return;
    const newPlan = { ...plan };
    const rows = [
      { t: 'targetNew', a: 'actualNew', e: 'evalNew', label: 'Tiếp cận mới' },
      { t: 'targetContacted', a: 'actualContacted', e: 'evalContacted', label: 'Kết nối thành công' },
      { t: 'targetConsulting', a: 'actualConsulting', e: 'evalConsulting', label: 'Tiềm năng cao' },
      { t: 'targetMeeting', a: 'actualMeeting', e: 'evalMeeting', label: 'Hẹn gặp' },
      { t: 'targetSigned', a: 'actualSigned', e: 'evalSigned', label: 'Chốt Hợp đồng' },
    ];
    
    rows.forEach(r => {
      const target = Number((newPlan as any)[r.t] || 0);
      const actual = Number((newPlan as any)[r.a] || 0);
      if (target === 0) {
        if (actual > 0) {
          (newPlan as any)[r.e] = `🟢 XUẤT SẮC: Đã có kết quả (${actual}) dù không đặt chỉ tiêu đầu tuần. Cần duy trì phong độ và phát huy!`;
        } else {
          (newPlan as any)[r.e] = 'Chưa đặt chỉ tiêu.';
        }
      } else {
        const pct = (actual / target) * 100;
        if (pct >= 80) {
          (newPlan as any)[r.e] = `🟢 ĐẠT / TỐT: Làm rất tốt! Tỷ lệ đạt ${pct.toFixed(1)}%. Tiếp tục duy trì phong độ và đẩy mạnh khai thác sâu tệp khách hàng này để chốt sale.`;
        } else if (pct >= 70) {
          (newPlan as any)[r.e] = `🟡 ĐẠT NHƯNG CHƯA ỔN ĐỊNH: Tương đối tốt (đạt ${pct.toFixed(1)}%). Đã bám sát mục tiêu nhưng cần nỗ lực ép số thêm một chút để hoàn thành 100% KPI. Chú ý theo dõi sát các khách hàng ở khâu này.`;
        } else if (pct >= 60) {
          (newPlan as any)[r.e] = `🟠 KHÔNG ĐẠT KỲ VỌNG: Hiệu suất đang dưới mức kỳ vọng (đạt ${pct.toFixed(1)}%). Khâu này đang bị chững lại và có dấu hiệu rớt khách. Cần tập trung cải thiện kỹ năng xử lý từ chối và nhờ Quản lý kèm cặp thêm.`;
        } else {
          (newPlan as any)[r.e] = `🔴 KHÔNG ĐẠT - BÁO ĐỘNG: Hiệu suất khâu này quá thấp (chỉ đạt ${pct.toFixed(1)}%). Yêu cầu rà soát lại ngay tệp data hoặc kịch bản gọi điện. Cần lên lịch trao đổi trực tiếp với Quản lý để tìm nguyên nhân và có kế hoạch khắc phục (PIP) cho tuần tới.`;
        }
      }
    });

    setPlan(newPlan);
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Kế hoạch Công việc Tuần</h1>
          <p className="page-subtitle">Quản lý mục tiêu và đầu việc</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeek(w => w > 1 ? w - 1 : 52)}><ChevronLeft size={16} /></button>
            <div style={{ fontWeight: 600, fontSize: 16, textAlign: 'center', lineHeight: '1.2' }}>
              Tuần {week} / {year}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 400 }}>{getDateRangeStr()}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setWeek(w => w < 52 ? w + 1 : 1)}><ChevronRight size={16} /></button>
          </div>
          
          {isManagerOrAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nhân viên:</span>
              <select className="form-input" style={{ width: 240 }} value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                {user?.role !== 'Admin' && <option value="">-- Kế hoạch của tôi --</option>}
                {user?.role === 'Admin' && <option value="">-- Chọn nhân viên --</option>}
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
          )}

        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, display: 'inline-block' }} /></div>
      ) : isManagerOrAdmin && !selectedEmployeeId ? (
        <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Báo cáo Tổng hợp KPI Phễu của Nhân viên</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#1e3a8a', color: 'white', fontSize: 13 }}>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Nhân viên</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Tiếp cận mới</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Kết nối</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Tiềm năng</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Hẹn gặp</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Chốt Hợp đồng</th>
                  <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 14 }}>
                {employees.map((emp, i) => {
                  if (emp.role === 'Admin') return null;
                  const p = allPlans.find(x => x.employeeId === emp.id);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', border: '1px solid var(--border)', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                          {emp.fullName.charAt(0)}
                        </div>
                        {emp.fullName}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p?.actualNew || 0}</span> / <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p?.targetNew || 0}</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p?.actualContacted || 0}</span> / <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p?.targetContacted || 0}</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p?.actualConsulting || 0}</span> / <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p?.targetConsulting || 0}</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p?.actualMeeting || 0}</span> / <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p?.targetMeeting || 0}</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p?.actualSigned || 0}</span> / <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p?.targetSigned || 0}</span>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedEmployeeId(emp.id)}>Xem chi tiết</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : plan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>


            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', margin: 0 }}>
                  Bản kế hoạch công việc tuần
                </h3>
                {!isViewingOthers && (
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setItemForm({ date: getLocalDateString(), taskName: '', actionPlan: '', supporterId: '', deadline: '', kpi: '', status: 'Pending', notes: '' });
                    setEditingItemIndex(null);
                    setShowItemForm(true);
                  }}>
                    <Plus size={16} /> Thêm đầu việc
                  </button>
                )}
              </div>

              {/* Bảng Kế hoạch chi tiết */}
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#1e3a8a', color: 'white', fontSize: 13 }}>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '10%' }}>NGÀY</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '5%', textAlign: 'center' }}>STT</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '20%' }}>Mục tiêu & Đầu việc cụ thể</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '15%' }}>Kênh triển khai / Cách làm</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '10%' }}>Nguồn lực / Hỗ trợ</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '10%' }}>Thời hạn</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '10%' }}>KPI mong đợi</th>
                      <th style={{ padding: '12px', border: '1px solid var(--border)', width: '15%' }}>Ghi chú</th>
                      {!isViewingOthers && <th style={{ padding: '12px', border: '1px solid var(--border)', width: '5%', textAlign: 'center' }}>Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: 13 }}>
                    {(() => {
                      const items = plan.items || [];
                      if (items.length === 0) return <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có đầu việc nào.</td></tr>;
                      
                      // Group by Date
                      const groupedByDate: Record<string, typeof items> = {};
                      const sortedItems = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      sortedItems.forEach(item => {
                        const d = item.date || 'Không xác định';
                        if (!groupedByDate[d]) groupedByDate[d] = [];
                        groupedByDate[d].push(item);
                      });

                      const rows: any[] = [];
                      Object.keys(groupedByDate).forEach(dateStr => {
                        const dateItems = groupedByDate[dateStr];
                        const dateObj = new Date(dateStr);
                        const dayOfWeek = isNaN(dateObj.getTime()) ? '' : `Thứ ${dateObj.getDay() === 0 ? 'CN' : dateObj.getDay() + 1}`;
                        const displayDate = isNaN(dateObj.getTime()) ? dateStr : `${dayOfWeek} ngày ${format(dateObj, 'dd/MM')}`;
                        
                        dateItems.forEach((item, idx) => {
                          const globalIdx = items.findIndex(i => i.id === item.id);
                          rows.push(
                            <tr key={item.id || globalIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                              {idx === 0 && (
                                <td rowSpan={dateItems.length} style={{ padding: '12px', border: '1px solid var(--border)', fontWeight: 600, verticalAlign: 'top', background: 'var(--bg-secondary)' }}>
                                  {displayDate.toUpperCase()}
                                </td>
                              )}
                              <td style={{ padding: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>{idx + 1}</td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>{item.taskName}</td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>{item.actionPlan}</td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                                {employees.find(e => e.id === item.supporterId)?.fullName || item.supporterId || '---'}
                              </td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>{item.deadline}</td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>{item.kpi}</td>
                              <td style={{ padding: '12px', border: '1px solid var(--border)' }}>{item.notes}</td>
                              {!isViewingOthers && (
                                <td style={{ padding: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => {
                                      setItemForm({ ...item, date: item.date || dateStr });
                                      setEditingItemIndex(globalIdx);
                                      setShowItemForm(true);
                                    }}>Sửa</button>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', color: 'var(--accent-red)' }} onClick={() => handleDeleteItem(globalIdx, item.id)}>Xóa</button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        });
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Form thêm sửa đầu việc */}
              {showItemForm && !isViewingOthers && (
                <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>{editingItemIndex !== null ? 'Sửa đầu việc' : 'Thêm đầu việc mới'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div><label className="form-label">Ngày thực hiện *</label><input type="date" className="form-input" required value={itemForm.date} onChange={e => setItemForm({...itemForm, date: e.target.value})} /></div>
                    <div><label className="form-label">Mục tiêu & Đầu việc cụ thể *</label><input type="text" className="form-input" required placeholder="Ví dụ: Tìm kiếm data du học sinh..." value={itemForm.taskName} onChange={e => setItemForm({...itemForm, taskName: e.target.value})} /></div>
                    <div><label className="form-label">Kênh triển khai / Cách làm</label><input type="text" className="form-input" placeholder="Ví dụ: Đăng bài group Facebook..." value={itemForm.actionPlan} onChange={e => setItemForm({...itemForm, actionPlan: e.target.value})} /></div>
                    <div>
                      <label className="form-label">Nguồn lực / Người hỗ trợ</label>
                      <select className="form-input" value={itemForm.supporterId || ''} onChange={e => setItemForm({...itemForm, supporterId: e.target.value})}>
                        <option value="">Không có</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                      </select>
                    </div>
                    <div><label className="form-label">Thời hạn hoàn thành</label><input type="text" className="form-input" placeholder="Ví dụ: Trước thứ Năm / 8h-9h30..." value={itemForm.deadline} onChange={e => setItemForm({...itemForm, deadline: e.target.value})} /></div>
                    <div><label className="form-label">KPI con số mong đợi</label><input type="text" className="form-input" placeholder="Ví dụ: 20 data..." value={itemForm.kpi} onChange={e => setItemForm({...itemForm, kpi: e.target.value})} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Ghi chú / Đề xuất bổ sung</label><textarea className="form-input" rows={2} placeholder="..." value={itemForm.notes} onChange={e => setItemForm({...itemForm, notes: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => { setShowItemForm(false); setEditingItemIndex(null); }}>Hủy</button>
                    <button className="btn btn-primary" onClick={handleSaveItem}>Lưu đầu việc</button>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              I. Báo cáo chỉ số phễu khách hàng (Quan trọng)
              {!isViewingOthers && (
                <button type="button" className="btn btn-secondary" onClick={autoGenerateComments} style={{ padding: '6px 12px', fontSize: 13, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'var(--accent-purple)' }}>✨ Tự động nhận xét (AI)</button>
              )}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: 'white', fontSize: 13 }}>
                    <th style={{ padding: '12px', border: '1px solid var(--border)', textAlign: 'left', width: '25%' }}>Mức độ trong Phễu Tuyển sinh</th>
                    <th style={{ padding: '12px', border: '1px solid var(--border)', width: '15%' }}>Chỉ tiêu đặt ra (KPI Tuần)</th>
                    <th style={{ padding: '12px', border: '1px solid var(--border)', width: '15%' }}>Kết quả thực tế đạt</th>
                    <th style={{ padding: '12px', border: '1px solid var(--border)', width: '15%' }}>Tỷ lệ đạt (%)</th>
                    <th style={{ padding: '12px', border: '1px solid var(--border)' }}>Đánh giá hiệu suất khâu này</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14 }}>
                  {[
                    { label: '1. TỔNG DATA TIẾP CẬN MỚI (Số người biết tới/nhận tin)', t: 'targetNew', a: 'actualNew', e: 'evalNew' },
                    { label: '2. DATA KẾT NỐI THÀNH CÔNG (Số người nghe máy/rep tin nhắn)', t: 'targetContacted', a: 'actualContacted', e: 'evalContacted' },
                    { label: '3. KHÁCH HÀNG TIỀM NĂNG CAO (Quan tâm sâu chi phí, lịch học)', t: 'targetConsulting', a: 'actualConsulting', e: 'evalConsulting' },
                    { label: '4. KHÁCH HẸN GẶP / LÊN VĂN PHÒNG (Gặp trực tiếp/gọi video sau)', t: 'targetMeeting', a: 'actualMeeting', e: 'evalMeeting' },
                    { label: '5. HỢP ĐỒNG ĐÃ KÝ KẾT / DOANH THU THỰC TẾ (Chốt cọc thành công)', t: 'targetSigned', a: 'actualSigned', e: 'evalSigned' },
                  ].map((row, i) => {
                    const actual = (plan as any)[row.a] || 0;
                    const target = (plan as any)[row.t] || 0;
                    const percent = target > 0 ? ((actual / target) * 100).toFixed(1) : '0.0';
                    const isTargetInputDisabled = isViewingOthers || row.t === 'targetNew';
                    const isActualInputDisabled = isViewingOthers;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', border: '1px solid var(--border)', textAlign: 'left', fontWeight: 600 }}>{row.label}</td>
                        <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                          <input type="number" className="form-input" style={{ textAlign: 'center', background: isTargetInputDisabled ? 'transparent' : '', border: isTargetInputDisabled ? 'none' : '' }} value={target} onChange={e => setPlan({ ...plan, [row.t]: parseInt(e.target.value) || 0 })} disabled={isTargetInputDisabled} min={0} />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                          <input type="number" className="form-input" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-blue)', background: isActualInputDisabled ? 'transparent' : '', border: isActualInputDisabled ? 'none' : '' }} value={actual} onChange={e => setPlan({ ...plan, [row.a]: parseInt(e.target.value) || 0 })} disabled={isActualInputDisabled} min={0} />
                        </td>
                        <td style={{ padding: '12px', border: '1px solid var(--border)', fontWeight: 600, color: Number(percent) >= 100 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                          {percent}%
                        </td>
                        <td style={{ padding: '12px', border: '1px solid var(--border)' }}>
                          <textarea className="form-input" rows={2} style={{ width: '100%', resize: 'vertical', background: isViewingOthers ? 'transparent' : 'var(--bg-secondary)', border: isViewingOthers ? 'none' : '', color: 'var(--text-primary)', opacity: 1, fontWeight: 500 }} value={(plan as any)[row.e] || ''} onChange={e => setPlan({ ...plan, [row.e]: e.target.value })} disabled={true} placeholder="Nhấn nút ✨ Tự động nhận xét (AI) ở trên..." />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 32, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              II. Phân tích thực tế & Kế hoạch hành động sửa sai (Bắt buộc)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '30% 70%', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: 12, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                1. Lý do không đạt chỉ tiêu (Nếu có gãy khâu nào):
              </div>
              <div>
                <textarea className="form-input" rows={4} style={{ width: '100%', resize: 'vertical', border: 'none', borderRadius: 0, background: isViewingOthers ? 'transparent' : '' }} value={plan.failureReasonAnalysis || ''} onChange={e => setPlan({ ...plan, failureReasonAnalysis: e.target.value })} disabled={isViewingOthers} placeholder="Nhập chi tiết phân tích của bạn (không viết chung chung)..." />
              </div>
            </div>

            {(isViewingOthers || plan.adminFeedback) && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 32, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  III. Nhận xét của Quản lý / Admin
                </h3>
                {plan.adminFeedback && (
                  <div style={{ padding: 16, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, fontSize: 15, whiteSpace: 'pre-wrap', marginBottom: 16, color: 'var(--text-primary)' }}>
                    {plan.adminFeedback}
                  </div>
                )}
                
                {isManagerOrAdmin && isViewingOthers && (
                  <div style={{ marginTop: 16, padding: 20, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>{plan.adminFeedback ? 'Cập nhật nhận xét' : 'Thêm nhận xét / Đánh giá'}</div>
                    <textarea 
                      className="form-input" 
                      style={{ width: '100%', minHeight: 100, marginBottom: 16 }} 
                      placeholder="Nhập nhận xét, đánh giá của bạn về kế hoạch và kết quả tuần này..."
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary" onClick={submitFeedback} disabled={submittingFeedback}>
                        {submittingFeedback ? 'Đang gửi...' : 'Gửi nhận xét'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {!isViewingOthers && (
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', fontSize: 16 }}>
                {saving ? 'Đang gửi...' : 'Gửi Báo cáo Kế hoạch cho Quản lý'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
