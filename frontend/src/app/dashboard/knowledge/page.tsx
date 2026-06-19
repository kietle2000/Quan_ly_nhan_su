'use client';
import { useState } from 'react';
import { BookOpen, Search, FileText, ChevronRight, Download, Video, Folder } from 'lucide-react';

const CATEGORIES = [
  { id: 'sales', name: 'Kịch bản Sales & Tư vấn', icon: FileText, count: 12 },
  { id: 'product', name: 'Tài liệu Sản phẩm/Dịch vụ', icon: Folder, count: 8 },
  { id: 'training', name: 'Đào tạo nhân sự mới', icon: Video, count: 5 },
  { id: 'policy', name: 'Quy định & Chính sách', icon: BookOpen, count: 3 },
];

const ARTICLES = [
  { id: 1, categoryId: 'sales', title: 'Kịch bản xử lý từ chối về Giá', author: 'Nguyễn Văn Admin', date: '2026-06-15', readTime: '5 phút', views: 142 },
  { id: 2, categoryId: 'sales', title: 'Mẫu kịch bản gọi Telesale chốt Hẹn gặp', author: 'Nguyễn Văn Admin', date: '2026-06-10', readTime: '8 phút', views: 98 },
  { id: 3, categoryId: 'product', title: 'Bảng giá Dịch vụ cập nhật Quý 3/2026', author: 'Phòng Kế toán', date: '2026-06-01', readTime: '2 phút', views: 256 },
  { id: 4, categoryId: 'training', title: 'Video: Hướng dẫn sử dụng CRM cho người mới', author: 'Phòng Đào tạo', date: '2026-05-20', readTime: '15 phút', views: 65 },
  { id: 5, categoryId: 'policy', title: 'Quy chế Thưởng KPI và Hoa hồng 2026', author: 'Phòng Nhân sự', date: '2026-01-05', readTime: '10 phút', views: 412 },
];

export default function KnowledgeBasePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = ARTICLES.filter(a => {
    const matchCat = activeCategory === 'all' || a.categoryId === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Kho tài liệu (Knowledge Base)</h1>
          <p className="page-subtitle">Trung tâm lưu trữ tri thức, kịch bản và quy định nội bộ</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar Categories */}
        <div className="glass-card" style={{ width: 280, padding: 20, flexShrink: 0 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tìm kiếm tài liệu..." 
              style={{ paddingLeft: 40, width: '100%' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Danh mục tài liệu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: activeCategory === 'all' ? 'var(--bg-hover)' : 'transparent', color: activeCategory === 'all' ? 'var(--accent-blue)' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: activeCategory === 'all' ? 600 : 500 }}
              onClick={() => setActiveCategory('all')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={18} />
                <span>Tất cả tài liệu</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ARTICLES.length}</span>
            </button>

            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button 
                  key={cat.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: isActive ? 'var(--bg-hover)' : 'transparent', color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: isActive ? 600 : 500 }}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={18} />
                    <span>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredArticles.length === 0 ? (
            <div className="glass-card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p>Không tìm thấy tài liệu nào phù hợp.</p>
            </div>
          ) : (
            filteredArticles.map(article => (
              <div key={article.id} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {article.categoryId === 'sales' ? <FileText size={24} /> : article.categoryId === 'training' ? <Video size={24} /> : <BookOpen size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{article.title}</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>Đăng bởi: {article.author}</span>
                    <span>•</span>
                    <span>Cập nhật: {new Date(article.date).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>Đọc: {article.readTime}</span>
                    <span>•</span>
                    <span>{article.views} lượt xem</span>
                  </div>
                </div>
                <div>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
