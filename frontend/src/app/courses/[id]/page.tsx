'use client';
import { useState, useEffect, use } from 'react';
import { classApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { PlayCircle, FileText, CheckCircle, GraduationCap, Clock, MonitorPlay, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function PublicCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await classApi.getById(courseId);
        const sessRes = await classApi.getSessions(courseId);
        if (res?.data && res.data.isOnlineCourse) {
          setCourse(res.data);
          setSessions(sessRes?.data || []);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [courseId]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone) return alert('Vui lòng nhập họ tên và số điện thoại');
    
    setEnrolling(true);
    try {
      const studentId = uuidv4();
      
      const enrollData = {
        studentId,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        tuitionStatus: 1, // Đã đóng (Miễn phí)
        learningGoal: 'Tự học Online'
      };

      await classApi.enrollStudent(courseId, enrollData);
      
      // Auto login logic for student (mocking it by just redirecting since we don't have a real auth token for student here, 
      // but in a real app we'd sign them in or set a cookie).
      // For the scope of this UI mockup, we will just redirect to the student dashboard or learn page directly.
      // We will save student phone in localStorage to mock "login"
      localStorage.setItem('student_phone', form.phone);
      
      alert('Đăng ký khóa học thành công! Bắt đầu học ngay.');
      router.push(`/student/classes/${courseId}/learn`);
      
    } catch (err) {
      console.error(err);
      alert('Lỗi đăng ký khóa học');
    }
    setEnrolling(false);
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" style={{ width: 40, height: 40 }}></span></div>;
  }

  if (!course) {
    return <div style={{ textAlign: 'center', padding: 100 }}><h2>Khóa học không tồn tại hoặc đã bị đóng.</h2></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white', padding: '80px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: 20, fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              Khóa học E-Learning
            </span>
            <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 24px', lineHeight: 1.2 }}>{course.className}</h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
              Tham gia ngay khóa học miễn phí. Hoàn thành {sessions.length} bài học và bài tập đánh giá để nắm vững kiến thức từ cơ bản đến nâng cao.
            </p>
            <div style={{ display: 'flex', gap: 24, fontSize: 15, color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MonitorPlay size={20} color="#38bdf8" /> {sessions.length} Bài học</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={20} color="#38bdf8" /> Truy cập {course.accessDurationDays || 365} ngày</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><GraduationCap size={20} color="#38bdf8" /> Học mọi lúc mọi nơi</span>
            </div>
          </div>
          
          <div style={{ width: 400, background: 'white', borderRadius: 24, padding: 32, color: '#0f172a', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Miễn phí đăng ký</h3>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Điền thông tin để bắt đầu học ngay lập tức.</p>
            
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#334155' }}>Họ và tên *</label>
                <input required className="form-input" style={{ width: '100%', padding: 14, background: '#f8fafc' }} placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#334155' }}>Số điện thoại *</label>
                <input required className="form-input" style={{ width: '100%', padding: 14, background: '#f8fafc' }} placeholder="0901234567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#334155' }}>Email</label>
                <input type="email" className="form-input" style={{ width: '100%', padding: 14, background: '#f8fafc' }} placeholder="nguyenvana@gmail.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <button type="submit" disabled={enrolling} className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, marginTop: 8, borderRadius: 12 }}>
                {enrolling ? <span className="spinner"></span> : <>Đăng ký học ngay <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Curriculum Preview */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Nội dung khóa học</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sessions.map((sess, idx) => (
            <div key={sess.id} style={{ background: 'white', borderRadius: 16, padding: 24, display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: sess.lessonType === 'test' ? '#fce7f3' : '#e0f2fe', color: sess.lessonType === 'test' ? '#db2777' : '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{sess.topic}</h4>
                <div style={{ color: '#64748b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
                  {sess.lessonType === 'test' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={16} /> Bài kiểm tra đánh giá</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PlayCircle size={16} /> Bài giảng Video</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40, border: '2px dashed #cbd5e1', borderRadius: 16 }}>
              Khóa học đang được cập nhật nội dung.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
