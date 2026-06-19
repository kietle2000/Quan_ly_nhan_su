'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { classApi, employeeApi, crmApi } from '@/lib/api';
import {
  Plus, Search, GraduationCap, Users, Calendar, Clock,
  AlertTriangle, Check, BookOpen, UserCheck, Activity,
  Info, CreditCard, UserPlus, X, Trash2, Edit2, ShieldAlert,
  Phone, Mail, ArrowUpRight
} from 'lucide-react';

interface ClassScheduleDto {
  id?: string;
  classId?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "hh:mm" or "hh:mm:ss"
  endTime: string;
}

interface EnrollmentDto {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  tuitionStatus: number; // 1 = Paid, 2 = Partial, 3 = Unpaid
  learningGoal?: string;
  notes?: string;
}

interface ClassDto {
  id: string;
  className: string;
  subjectType: string;
  instructorId: string;
  instructorName: string;
  startDate: string;
  durationInWeeks: number;
  schedules: ClassScheduleDto[];
  enrollments: EnrollmentDto[];
}

interface StudentDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  leadId?: string;
}

interface Employee {
  id: string;
  fullName: string;
  role: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
}

const TUITION_LABELS: Record<number, string> = {
  1: 'Đã đóng đủ',
  2: 'Đóng một phần',
  3: 'Chưa đóng'
};

const TUITION_BADGES: Record<number, string> = {
  1: 'badge-green',
  2: 'badge-orange',
  3: 'badge-red'
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' }
];

export default function ClassesPage() {
  const { user } = useAuth();
  
  // Data State
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tuitionAlerts, setTuitionAlerts] = useState<EnrollmentDto[]>([]);
  
  // Loading & UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classes' | 'students' | 'alerts'>('classes');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Modals state
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showEnrollStudent, setShowEnrollStudent] = useState(false);
  const [showAssignInstructor, setShowAssignInstructor] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<ClassDto | null>(null);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<ClassDto | null>(null);
  
  // Forms State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Create Class Form
  const [classForm, setClassForm] = useState({
    className: '',
    subjectType: '',
    instructorId: '',
    startDate: '',
    durationInWeeks: 8,
    schedules: [] as Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  });
  
  // Create Student Form
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    leadId: ''
  });
  
  // Enroll Student Form
  const [enrollForm, setEnrollForm] = useState({
    studentId: '',
    tuitionStatus: 3, // Default Unpaid
    learningGoal: '',
    notes: ''
  });
  
  // Assign Instructor Form
  const [assignForm, setAssignForm] = useState({
    instructorId: ''
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [classRes, studentRes, empRes, alertsRes] = await Promise.all([
        classApi.getAll(),
        classApi.getStudents(),
        employeeApi.getAll(),
        classApi.getTuitionAlerts()
      ]);
      
      setClasses(classRes.data);
      setStudents(studentRes.data);
      setEmployees(empRes.data);
      setTuitionAlerts(alertsRes.data);
      
      // Load leads if Admin/Manager to link them
      if (user?.role === 'Admin' || user?.role === 'Manager') {
        const leadRes = await crmApi.getLeads();
        setLeads(leadRes.data);
      }
    } catch (err) {
      console.error('Error fetching class module data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  // Calculated Properties
  const instructors = employees.filter(
    emp => emp.role === 'Instructor' || emp.role === 'Admin' || emp.role === 'Manager'
  );
  
  const uniqueSubjects = Array.from(new Set(classes.map(c => c.subjectType))).filter(Boolean);

  const getDayName = (day: number) => {
    const found = DAYS_OF_WEEK.find(d => d.value === day);
    return found ? found.label : `Thứ ${day}`;
  };

  const calculateEndDate = (startDateStr: string, durationWeeks: number) => {
    if (!startDateStr) return '';
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + durationWeeks * 7);
    return date.toLocaleDateString('vi-VN');
  };

  // Add Schedule Row to Form
  const addScheduleRow = () => {
    setClassForm(prev => ({
      ...prev,
      schedules: [...prev.schedules, { dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }]
    }));
  };

  // Remove Schedule Row
  const removeScheduleRow = (index: number) => {
    setClassForm(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  // Update Schedule Row value
  const updateScheduleRow = (index: number, field: string, value: any) => {
    setClassForm(prev => {
      const updated = [...prev.schedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedules: updated };
    });
  };

  // Submit Actions
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        className: classForm.className,
        subjectType: classForm.subjectType,
        instructorId: classForm.instructorId,
        startDate: new Date(classForm.startDate).toISOString(),
        durationInWeeks: Number(classForm.durationInWeeks),
        schedules: classForm.schedules.map(s => ({
          dayOfWeek: Number(s.dayOfWeek),
          startTime: s.startTime + ':00',
          endTime: s.endTime + ':00'
        }))
      };
      
      await classApi.create(payload);
      setShowAddClass(false);
      setClassForm({
        className: '',
        subjectType: '',
        instructorId: '',
        startDate: '',
        durationInWeeks: 8,
        schedules: []
      });
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.title || 'Lỗi khi tạo lớp học');
    }
    setSaving(false);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: studentForm.fullName,
        phone: studentForm.phone,
        email: studentForm.email || null,
        leadId: studentForm.leadId || null
      };
      
      await classApi.createStudent(payload);
      setShowAddStudent(false);
      setStudentForm({ fullName: '', phone: '', email: '', leadId: '' });
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.title || 'Lỗi khi tạo học viên');
    }
    setSaving(false);
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForEnroll) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        studentId: enrollForm.studentId,
        tuitionStatus: Number(enrollForm.tuitionStatus),
        learningGoal: enrollForm.learningGoal || null,
        notes: enrollForm.notes || null
      };
      
      await classApi.enrollStudent(selectedClassForEnroll.id, payload);
      setShowEnrollStudent(false);
      setEnrollForm({ studentId: '', tuitionStatus: 3, learningGoal: '', notes: '' });
      setSelectedClassForEnroll(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.title || 'Lỗi khi thêm học viên vào lớp');
    }
    setSaving(false);
  };

  const handleAssignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForAssign) return;
    setSaving(true);
    setError('');
    try {
      await classApi.assignInstructor(selectedClassForAssign.id, assignForm.instructorId);
      setShowAssignInstructor(false);
      setAssignForm({ instructorId: '' });
      setSelectedClassForAssign(null);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.title || 'Lỗi khi gán giảng viên');
    }
    setSaving(false);
  };

  // Filter Functions
  const filteredClasses = classes.filter(c => {
    const matchesSearch = c.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter ? c.subjectType === subjectFilter : true;
    return matchesSearch && matchesSubject;
  });

  const filteredStudents = students.filter(s => {
    return s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.phone.includes(searchTerm) ||
           (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // KPI calculations
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const activeInstructors = new Set(classes.map(c => c.instructorId).filter(Boolean)).size;
  const totalAlertsCount = tuitionAlerts.length;

  return (
    <div className="section animate-fadeInUp">
      
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap size={28} color="var(--accent-blue)" /> Quản lý Đào tạo
          </h1>
          <p className="page-subtitle">Hệ thống phân cấp quản lý Giảng viên, Lớp học và Học viên</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setStudentForm({ fullName: '', phone: '', email: '', leadId: '' });
                  setError('');
                  setShowAddStudent(true);
                }}
              >
                <UserPlus size={16} /> Thêm Học viên
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setClassForm({
                    className: '',
                    subjectType: '',
                    instructorId: '',
                    startDate: '',
                    durationInWeeks: 8,
                    schedules: []
                  });
                  setError('');
                  setShowAddClass(true);
                }}
              >
                <Plus size={16} /> Tạo Lớp học
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng số Lớp học</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{totalClasses}</span>
            <BookOpen size={24} color="var(--accent-blue)" style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng số Học viên</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{totalStudents}</span>
            <Users size={24} color="var(--accent-green)" style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div className="stat-card">
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Giảng viên đang dạy</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{activeInstructors}</span>
            <UserCheck size={24} color="var(--accent-purple)" style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: totalAlertsCount > 0 ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cảnh báo Học phí</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: totalAlertsCount > 0 ? 'var(--accent-red)' : undefined }}>
            <span>{totalAlertsCount}</span>
            <AlertTriangle size={24} color={totalAlertsCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)'} style={{ opacity: 0.8 }} className={totalAlertsCount > 0 ? "animate-pulse-glow" : ""} />
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20, border: '1px solid var(--border)' }}>
        <button 
          className={`btn ${activeTab === 'classes' ? 'btn-primary' : ''}`}
          style={{ background: activeTab !== 'classes' ? 'transparent' : undefined, border: 'none' }}
          onClick={() => { setActiveTab('classes'); setSearchTerm(''); }}
        >
          Lớp học ({classes.length})
        </button>
        <button 
          className={`btn ${activeTab === 'students' ? 'btn-primary' : ''}`}
          style={{ background: activeTab !== 'students' ? 'transparent' : undefined, border: 'none' }}
          onClick={() => { setActiveTab('students'); setSearchTerm(''); }}
        >
          Học viên ({students.length})
        </button>
        <button 
          className={`btn ${activeTab === 'alerts' ? 'btn-primary' : ''}`}
          style={{ 
            background: activeTab !== 'alerts' ? 'transparent' : undefined, 
            border: 'none', 
            color: tuitionAlerts.length > 0 && activeTab !== 'alerts' ? 'var(--accent-red)' : undefined,
            fontWeight: tuitionAlerts.length > 0 ? '700' : undefined
          }}
          onClick={() => { setActiveTab('alerts'); setSearchTerm(''); }}
        >
          Nợ Học phí ({tuitionAlerts.length})
        </button>
      </div>

      {/* Filters bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '2px 10px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder={activeTab === 'classes' ? "Tìm lớp học, giảng viên..." : activeTab === 'students' ? "Tìm tên học viên, số điện thoại..." : "Tìm học viên, lớp nợ học phí..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', padding: '8px 0', fontSize: 14 }}
          />
        </div>

        {activeTab === 'classes' && (
          <select 
            className="form-input" 
            style={{ width: 200, padding: '8px 12px' }}
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
          >
            <option value="">Tất cả môn học</option>
            {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        )}
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, display: 'inline-block' }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 14 }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Classes Grid */}
          {activeTab === 'classes' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filteredClasses.map(c => {
                const enrolledCount = c.enrollments?.length || 0;
                const paidCount = c.enrollments?.filter(e => e.tuitionStatus === 1).length || 0;
                const partialCount = c.enrollments?.filter(e => e.tuitionStatus === 2).length || 0;
                const unpaidCount = c.enrollments?.filter(e => e.tuitionStatus === 3).length || 0;
                
                return (
                  <div key={c.id} className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradient-main)' }} />
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <span className="badge badge-blue">{c.subjectType || 'Chưa phân loại'}</span>
                        <span className="badge badge-purple" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} /> Sĩ số: {enrolledCount}
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>{c.className}</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserCheck size={14} color="var(--accent-blue)" />
                          <span>Giảng viên: <strong>{c.instructorName || 'Chưa phân công'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={14} color="var(--accent-green)" />
                          <span>Khai giảng: {new Date(c.startDate).toLocaleDateString('vi-VN')} ({c.durationInWeeks} tuần)</span>
                        </div>
                        {c.schedules && c.schedules.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <Clock size={14} color="var(--accent-orange)" style={{ marginTop: 2 }} />
                            <div>
                              <span>Lịch học:</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {c.schedules.map((s, idx) => (
                                  <span key={idx}>
                                    • {getDayName(s.dayOfWeek)}: {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tuition Status summary for class */}
                      {enrolledCount > 0 && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, marginBottom: 20, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <span>Tình trạng học phí:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {paidCount}/{enrolledCount} đã hoàn tất
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--border)' }}>
                            <div style={{ width: `${(paidCount/enrolledCount)*100}%`, background: 'var(--accent-green)' }} />
                            <div style={{ width: `${(partialCount/enrolledCount)*100}%`, background: 'var(--accent-orange)' }} />
                            <div style={{ width: `${(unpaidCount/enrolledCount)*100}%`, background: 'var(--accent-red)' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 6, color: 'var(--text-muted)', fontSize: 10 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🟢 Đủ ({paidCount})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🟡 Một phần ({partialCount})</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🔴 Chưa đóng ({unpaidCount})</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 'auto' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ flex: 1, justifyContent: 'center' }} 
                        onClick={() => setSelectedClass(c)}
                      >
                        <Info size={13} /> Chi tiết
                      </button>
                      {(user?.role === 'Admin' || user?.role === 'Manager') && (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ justifyContent: 'center' }}
                          title="Gán Giảng viên"
                          onClick={() => {
                            setSelectedClassForAssign(c);
                            setAssignForm({ instructorId: c.instructorId || '' });
                            setError('');
                            setShowAssignInstructor(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Instructor') && (
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ flex: 1.2, justifyContent: 'center' }}
                          onClick={() => {
                            setSelectedClassForEnroll(c);
                            setEnrollForm({ studentId: '', tuitionStatus: 3, learningGoal: '', notes: '' });
                            setError('');
                            setShowEnrollStudent(true);
                          }}
                        >
                          <UserPlus size={13} /> Thêm Học viên
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredClasses.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <GraduationCap size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Không tìm thấy lớp học nào.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Students List Table */}
          {activeTab === 'students' && (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Số điện thoại</th>
                    <th>Email</th>
                    <th>Cơ hội CRM</th>
                    <th style={{ textAlign: 'center' }}>Số lớp học tham gia</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const linkedLead = leads.find(l => l.id === s.leadId);
                    const enrolledClassesCount = classes.filter(c => c.enrollments?.some(e => e.studentId === s.id)).length;
                    
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                        <td>
                          <a href={`tel:${s.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', textDecoration: 'none' }}>
                            <Phone size={13} color="var(--text-muted)" /> {s.phone}
                          </a>
                        </td>
                        <td>
                          {s.email ? (
                            <a href={`mailto:${s.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                              <Mail size={13} color="var(--text-muted)" /> {s.email}
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                          )}
                        </td>
                        <td>
                          {linkedLead ? (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <UserCheck size={11} /> {linkedLead.name} <ArrowUpRight size={11} />
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          <span className="badge badge-blue">{enrolledClassesCount} lớp</span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        Không tìm thấy học viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Tuition Alerts list */}
          {activeTab === 'alerts' && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, color: 'var(--accent-red)' }}>
                <ShieldAlert size={20} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Danh sách dưới đây liệt kê các học viên chưa hoàn thành đóng học phí (Trạng thái <strong>Chưa đóng</strong> hoặc <strong>Đóng một phần</strong>). Cần liên hệ nhắc nhở đóng học phí đúng hạn.
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học viên</th>
                      <th>Lớp học</th>
                      <th>Tình trạng</th>
                      <th>Mục tiêu học tập</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tuitionAlerts.map(alert => {
                      const student = students.find(s => s.id === alert.studentId);
                      return (
                        <tr key={alert.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{alert.studentName}</div>
                            {student && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 8, marginTop: 2 }}>
                                <span>📞 {student.phone}</span>
                                {student.email && <span>✉️ {student.email}</span>}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>{alert.className}</td>
                          <td>
                            <span className={`badge ${TUITION_BADGES[alert.tuitionStatus]}`}>
                              {TUITION_LABELS[alert.tuitionStatus]}
                            </span>
                          </td>
                          <td style={{ fontSize: 13 }}>{alert.learningGoal || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa ghi nhận</span>}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{alert.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có</span>}</td>
                        </tr>
                      );
                    })}
                    {tuitionAlerts.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                          <Check size={36} color="var(--accent-green)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                          Không có cảnh báo nợ học phí nào! Tất cả học viên đã đóng học phí đầy đủ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODALS INLINE CONDITIONAL RENDERING (To avoid Component Re-mount Focus Bug) */}
      {/* ========================================================================= */}

      {/* 1. Modal: Class Detail */}
      {selectedClass && (
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: 6 }}>{selectedClass.subjectType}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{selectedClass.className}</h2>
              </div>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} 
                onClick={() => setSelectedClass(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
              {/* Left Column: Details & Schedules */}
              <div style={{ borderRight: '1px solid var(--border)', paddingRight: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Thông tin lớp học</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, marginBottom: 24 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Giảng viên phụ trách</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{selectedClass.instructorName || 'Chưa phân công'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Ngày khai giảng</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(selectedClass.startDate).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Thời gian kết thúc (Dự kiến)</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{calculateEndDate(selectedClass.startDate, selectedClass.durationInWeeks)} ({selectedClass.durationInWeeks} tuần)</div>
                  </div>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Lịch học ca học</h3>
                {selectedClass.schedules && selectedClass.schedules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedClass.schedules.map((s, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={15} color="var(--accent-orange)" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{getDayName(s.dayOfWeek)}: {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa thiết lập lịch học cho lớp này.</div>
                )}
              </div>

              {/* Right Column: Enrolled Students List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Danh sách học viên ({selectedClass.enrollments?.length || 0})
                  </h3>
                  {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Instructor') && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedClassForEnroll(selectedClass);
                        setEnrollForm({ studentId: '', tuitionStatus: 3, learningGoal: '', notes: '' });
                        setError('');
                        setShowEnrollStudent(true);
                        setSelectedClass(null); // Close this modal
                      }}
                    >
                      + Thêm vào lớp
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} className="data-table">
                    <thead>
                      <tr style={{ background: 'var(--bg-hover)' }}>
                        <th style={{ padding: '8px 12px' }}>Họ tên</th>
                        <th style={{ padding: '8px 12px' }}>Học phí</th>
                        <th style={{ padding: '8px 12px' }}>Ghi chú / Mục tiêu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.enrollments && selectedClass.enrollments.length > 0 ? (
                        selectedClass.enrollments.map(e => (
                          <tr key={e.id}>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{e.studentName}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className={`badge ${TUITION_BADGES[e.tuitionStatus]}`} style={{ fontSize: 11, padding: '1px 6px' }}>
                                {TUITION_LABELS[e.tuitionStatus]}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                              <div><strong>Mục tiêu:</strong> {e.learningGoal || 'Chưa ghi nhận'}</div>
                              {e.notes && <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-muted)' }}><strong>Ghi chú:</strong> {e.notes}</div>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Chưa có học viên nào tham gia lớp này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Create Class */}
      {showAddClass && (
        <div className="modal-overlay" onClick={() => !saving && setShowAddClass(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Tạo Lớp học mới</h2>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreateClass}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Tên lớp học *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ví dụ: IELTS Advanced K12"
                      value={classForm.className} 
                      onChange={e => setClassForm({ ...classForm, className: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Môn học / Hệ đào tạo *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ví dụ: IELTS, Hàn ngữ, Đức ngữ..."
                      value={classForm.subjectType} 
                      onChange={e => setClassForm({ ...classForm, subjectType: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Ngày khai giảng *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={classForm.startDate} 
                      onChange={e => setClassForm({ ...classForm, startDate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Thời lượng (Số tuần) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min={1} 
                      value={classForm.durationInWeeks} 
                      onChange={e => setClassForm({ ...classForm, durationInWeeks: Number(e.target.value) })} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Giảng viên phụ trách *</label>
                  <select 
                    className="form-input" 
                    value={classForm.instructorId} 
                    onChange={e => setClassForm({ ...classForm, instructorId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {instructors.map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.fullName} ({ins.role})</option>
                    ))}
                  </select>
                </div>

                {/* Schedules Builder */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Thiết lập Lịch học ca học</label>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={addScheduleRow}
                    >
                      + Thêm ca học
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {classForm.schedules.map((sch, index) => (
                      <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-secondary)', padding: 10, borderRadius: 8 }}>
                        <div style={{ flex: 1.5 }}>
                          <select 
                            className="form-input" 
                            style={{ padding: '6px 8px' }}
                            value={sch.dayOfWeek}
                            onChange={e => updateScheduleRow(index, 'dayOfWeek', Number(e.target.value))}
                          >
                            {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="time" 
                            className="form-input" 
                            style={{ padding: '6px 8px' }}
                            value={sch.startTime}
                            onChange={e => updateScheduleRow(index, 'startTime', e.target.value)}
                            required
                          />
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>đến</span>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="time" 
                            className="form-input" 
                            style={{ padding: '6px 8px' }}
                            value={sch.endTime}
                            onChange={e => updateScheduleRow(index, 'endTime', e.target.value)}
                            required
                          />
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-danger btn-sm" 
                          onClick={() => removeScheduleRow(index)}
                          style={{ padding: 6 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {classForm.schedules.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                        Lớp học chưa được gán ca học cụ thể nào. Nhấn nút "Thêm ca học" nếu muốn đặt lịch.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddClass(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Create Student */}
      {showAddStudent && (
        <div className="modal-overlay" onClick={() => !saving && setShowAddStudent(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Thêm Học viên mới</h2>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreateStudent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Họ và tên học viên *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={studentForm.fullName} 
                    onChange={e => setStudentForm({ ...studentForm, fullName: e.target.value })} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Số điện thoại *</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      value={studentForm.phone} 
                      onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Email (Tùy chọn)</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={studentForm.email} 
                      onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Liên kết cơ hội CRM (Tùy chọn)</label>
                  <select 
                    className="form-input"
                    value={studentForm.leadId}
                    onChange={e => setStudentForm({ ...studentForm, leadId: e.target.value })}
                  >
                    <option value="">-- Chọn khách hàng CRM để chuyển đổi --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.phone}) - {l.status}</option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                    Liên kết học viên với cơ hội khách hàng CRM để đồng bộ thông tin và vết giao tiếp.
                  </small>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStudent(false)} disabled={saving}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Thêm Học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Enroll Student to Class */}
      {showEnrollStudent && selectedClassForEnroll && (
        <div className="modal-overlay" onClick={() => !saving && setShowEnrollStudent(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>
              <span className="badge badge-purple">Thêm Học viên</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '6px 0 0 0' }}>Ghi danh vào lớp: {selectedClassForEnroll.className}</h2>
            </div>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleEnrollStudent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Chọn học viên *</label>
                  <select 
                    className="form-input"
                    value={enrollForm.studentId}
                    onChange={e => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn học viên ghi danh --</option>
                    {students
                      // Filter out students already enrolled in this class
                      .filter(s => !selectedClassForEnroll.enrollments?.some(e => e.studentId === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.phone})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Tình trạng Học phí *</label>
                  <select 
                    className="form-input"
                    value={enrollForm.tuitionStatus}
                    onChange={e => setEnrollForm({ ...enrollForm, tuitionStatus: Number(e.target.value) })}
                    required
                  >
                    <option value={1}>Đã đóng đủ (Paid)</option>
                    <option value={2}>Đóng một phần (Partial)</option>
                    <option value={3}>Chưa đóng (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Mục tiêu học tập</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ví dụ: Đạt IELTS 6.5 để du học Hàn Quốc, Phỏng vấn VISA..."
                    value={enrollForm.learningGoal}
                    onChange={e => setEnrollForm({ ...enrollForm, learningGoal: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Ghi chú thêm</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    placeholder="Lịch sử đóng tiền, cam kết đầu ra, thông tin lưu ý..."
                    value={enrollForm.notes}
                    onChange={e => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowEnrollStudent(false);
                    setSelectedClassForEnroll(null);
                  }} 
                  disabled={saving}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Ghi danh Học viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Assign Instructor */}
      {showAssignInstructor && selectedClassForAssign && (
        <div className="modal-overlay" onClick={() => !saving && setShowAssignInstructor(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Phân công Giảng viên phụ trách</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Chọn giảng viên mới phụ trách lớp học <strong>{selectedClassForAssign.className}</strong>.
            </p>
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleAssignInstructor}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Chọn giảng viên giảng dạy *</label>
                  <select 
                    className="form-input"
                    value={assignForm.instructorId}
                    onChange={e => setAssignForm({ instructorId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {instructors.map(ins => (
                      <option key={ins.id} value={ins.id}>{ins.fullName} ({ins.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowAssignInstructor(false);
                    setSelectedClassForAssign(null);
                  }} 
                  disabled={saving}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Cập nhật Giảng viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
