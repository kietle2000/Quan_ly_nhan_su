'use client';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { classApi } from '@/lib/api';
import { ArrowLeft, Check, X, Clock, Calendar, Save, Plus, BarChart2, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [scoresData, setScoresData] = useState<Record<string, {score: string, feedback: string}>>({});

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const res = await classApi.getById(classId).catch(() => ({ data: null }));
      let cData = res?.data;
      
      if (!cData || typeof cData !== 'object' || !cData.id || cData.error) {
        const allRes = await classApi.getAll().catch(() => ({ data: [] }));
        let allClasses = Array.isArray(allRes?.data) ? allRes.data : (allRes?.data?.data || []);
        cData = allClasses.find((c: any) => String(c.id).trim() === String(decodeURIComponent(classId)).trim());
        
        if (!cData) {
          setLoading(false);
          return;
        }
      }
      
      setClassData(cData);
      
      const studentsList = cData.students ? cData.students.map((s: any) => ({
        id: s.id,
        name: s.fullName
      })) : [];
      setStudents(studentsList);

      const testRes = await classApi.getTests(classId).catch(() => ({ data: [] }));
      let testData = testRes?.data || [];
      setTests(testData);
      
      if (testData.length > 0) {
        setSelectedTestId(testData[0].id);
        loadScoresFromTest(testData[0].id, testData, studentsList);
      } else {
        const emptyScores: Record<string, any> = {};
        studentsList.forEach((s: any) => { emptyScores[s.id] = { score: '', feedback: '' }; });
        setScoresData(emptyScores);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadScoresFromTest = (testId: string, testList: any[], currentStudents: any[]) => {
    const test = testList.find(t => t.id === testId);
    const scoreList = test?.scores || [];
    
    const scoreMap: Record<string, any> = {};
    currentStudents.forEach(s => {
      scoreMap[s.id] = { score: '', feedback: '' }; 
    });
    
    scoreList.forEach((s: any) => {
      scoreMap[s.studentId] = { score: s.score, feedback: s.feedback };
    });
    
    setScoresData(scoreMap);
  };

  const handleTestChange = (testId: string) => {
    setSelectedTestId(testId);
    loadScoresFromTest(testId, tests, students);
  };

  const createNewTest = async () => {
    const title = prompt("Nhập Tên Bài kiểm tra (Ví dụ: Kiểm tra giữa kỳ):");
    if (!title) return;
    
    const date = new Date().toISOString().split('T')[0];
    const newTest = {
      classId,
      date,
      title
    };
    
    setSaving(true);
    try {
      await classApi.createTest(classId, newTest);
      await fetchClassData();
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo bài kiểm tra!");
      console.error(err);
    }
    setSaving(false);
  };
  
  const deleteTest = async (testId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này? Toàn bộ điểm số của bài này sẽ bị mất!')) return;
    setSaving(true);
    try {
      await classApi.deleteTest(testId);
      alert('Đã xóa bài kiểm tra thành công!');
      await fetchClassData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa bài kiểm tra!');
    }
    setSaving(false);
  };

  const handleScoreChange = (studentId: string, field: 'score' | 'feedback', value: string) => {
    setScoresData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveScores = async () => {
    if (!selectedTestId) return;
    setSaving(true);
    try {
      const payload = students.map(s => ({
        studentId: s.id,
        score: scoresData[s.id]?.score || '',
        feedback: scoresData[s.id]?.feedback || ''
      }));
      
      await classApi.saveTestScores(selectedTestId, payload);
      alert('Lưu bảng điểm thành công!');
      await fetchClassData();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu vào Database!');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center"><span className="spinner"></span> Đang tải dữ liệu...</div>;
  if (!classData) return <div className="p-8 text-center text-red-500">Lỗi: Không tìm thấy lớp học.</div>;

  const currentTest = tests.find(t => t.id === selectedTestId);

  return (
    <div className="p-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          className="btn btn-secondary" 
          style={{ padding: 8 }}
          onClick={() => router.push('/dashboard/classes')}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={24} color="var(--accent-blue)" />
            Quản lý Điểm số
          </h1>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Lớp học: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{classData.className}</span> 
            <span style={{ margin: '0 8px' }}>|</span> 
            Sĩ số: {students.length} học viên
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        {/* Left Panel: Tests List */}
        <div className="glass-card" style={{ padding: 20, alignSelf: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Danh sách Bài kiểm tra</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            {tests.map(t => (
              <div 
                key={t.id}
                onClick={() => handleTestChange(t.id)}
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  border: selectedTestId === t.id ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: selectedTestId === t.id ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: selectedTestId === t.id ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Calendar size={12} /> {new Date(t.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
            
            {tests.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                Chưa có bài kiểm tra nào.
              </div>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: 8, justifyContent: 'center', borderStyle: 'dashed' }}
              onClick={createNewTest}
              disabled={saving}
            >
              <Plus size={16} /> Tạo bài kiểm tra
            </button>
          </div>
        </div>

        {/* Right Panel: Scoring Table */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {currentTest ? currentTest.title : 'Bảng điểm'}
              </h2>
              {currentTest && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Ngày kiểm tra: {new Date(currentTest.date).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              {currentTest && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => deleteTest(currentTest.id)}
                  disabled={saving}
                >
                  <Trash2 size={16} /> Xóa bài KT
                </button>
              )}
              <button 
                className="btn btn-primary" 
                onClick={saveScores}
                disabled={saving || !currentTest}
              >
                {saving ? 'Đang lưu...' : <><Save size={16} /> Lưu bảng điểm</>}
              </button>
            </div>
          </div>

          {!currentTest ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 12, minHeight: 300 }}>
              <BarChart2 size={48} style={{ opacity: 0.2 }} />
              <p>Chọn hoặc tạo một Bài kiểm tra để bắt đầu nhập điểm</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                    <th style={{ width: 250 }}>Họ và tên</th>
                    <th style={{ width: 120 }}>Điểm số</th>
                    <th>Nhận xét của giáo viên</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600 }}
                          value={scoresData[s.id]?.score || ''}
                          onChange={e => handleScoreChange(s.id, 'score', e.target.value)}
                          placeholder="0-10"
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '6px 10px' }}
                          value={scoresData[s.id]?.feedback || ''}
                          onChange={e => handleScoreChange(s.id, 'feedback', e.target.value)}
                          placeholder="Ghi chú điểm mạnh, điểm yếu..."
                        />
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                        Lớp chưa có học viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
