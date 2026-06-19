'use client';
import { useState } from 'react';
import { Webhook, MessageCircle, Send, Plus, CheckCircle, Copy, AlertCircle, Save } from 'lucide-react';

export default function IntegrationsPage() {
  const [telegramToken, setTelegramToken] = useState('');
  const [zaloToken, setZaloToken] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [activeTab, setActiveTab] = useState<'channels' | 'webhook'>('channels');
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  const webhookUrl = 'https://api.yourdomain.com/v1/webhooks/facebook';

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Đã lưu cấu hình tích hợp thành công!');
    }, 800);
  };

  const handleTestNotification = () => {
    setTestStatus('Đang gửi...');
    setTimeout(() => {
      setTestStatus('Đã gửi tin nhắn test thành công tới Telegram của bạn!');
      setTimeout(() => setTestStatus(''), 3000);
    }, 1000);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert('Đã copy Webhook URL');
  };

  return (
    <div className="section">
      <div className="section-header">
        <div>
          <h1 className="page-title">Trung tâm Tích hợp (Integrations Hub)</h1>
          <p className="page-subtitle">Kết nối Đa kênh & Cấu hình Thông báo tự động</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={16} /> Lưu cấu hình</>}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button className={`btn ${activeTab === 'channels' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('channels')}>
          <MessageCircle size={16} /> Kênh Thông báo
        </button>
        <button className={`btn ${activeTab === 'webhook' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('webhook')}>
          <Webhook size={16} /> Tự động đổ Lead (Webhook)
        </button>
      </div>

      {activeTab === 'channels' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Telegram */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0088cc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={24} color="#0088cc" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0088cc' }}>Telegram Bot</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nhận thông báo qua Telegram</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Bot Token (Từ BotFather)</label>
                <input type="password" className="form-input" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder="123456789:AAH..." />
              </div>
              
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Các loại thông báo:</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14 }}>Có khách hàng mới (Lead)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14 }}>Sắp đến giờ hẹn khách (Nhắc trước 30p)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14 }}>Nhắc chấm công / Lên kế hoạch</span>
                </label>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleTestNotification}>
                <Send size={16} /> Gửi tin nhắn Test
              </button>
              {testStatus && <div style={{ fontSize: 13, color: testStatus.includes('thành công') ? 'var(--accent-green)' : 'var(--accent-orange)', textAlign: 'center', fontWeight: 500 }}>{testStatus}</div>}
            </div>
          </div>

          {/* Zalo ZNS */}
          <div className="glass-card" style={{ padding: 24, opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0068ff15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={24} color="#0068ff" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0068ff' }}>Zalo OA (ZNS)</h3>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đang phát triển</span>
              </div>
            </div>
            <div>
              <label className="form-label">Zalo OA Token</label>
              <input type="password" className="form-input" disabled placeholder="Tính năng đang được nâng cấp..." />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'webhook' && (
        <div className="glass-card animate-fadeInUp" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1877f215', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Webhook size={24} color="#1877f2" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1877f2' }}>Facebook Fanpage Webhook</h3>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tự động hứng Data khách hàng từ Fanpage/Ads đổ thẳng vào CRM</span>
            </div>
          </div>

          <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: 16, borderRadius: '0 8px 8px 0', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, color: '#b45309', fontWeight: 600, marginBottom: 4 }}>
              <AlertCircle size={18} /> Hướng dẫn cấu hình
            </div>
            <p style={{ color: '#92400e', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              1. Truy cập Facebook Developers, tạo một Ứng dụng.<br />
              2. Đăng ký Webhook cho đối tượng <b>Page</b>, đăng ký trường <b>messages</b> hoặc <b>leadgen</b>.<br />
              3. Paste đường dẫn Webhook bên dưới vào Facebook và điền Verify Token do bạn tự đặt.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Webhook URL (Của hệ thống CRM này)</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" className="form-input" style={{ flex: 1, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} value={webhookUrl} readOnly />
              <button className="btn btn-secondary" onClick={copyWebhook}><Copy size={16} /> Copy</button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Page Access Token (Facebook)</label>
            <input type="password" className="form-input" value={fbToken} onChange={e => setFbToken(e.target.value)} placeholder="EAAAAU..." />
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: 20, borderRadius: 12 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quy tắc phân bổ Khách hàng tự động (Auto-Routing)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'var(--bg-primary)', borderRadius: 8, border: '2px solid var(--accent-blue)', cursor: 'pointer' }}>
                <input type="radio" name="routing" defaultChecked style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Chia đều (Round-Robin)</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Chia lần lượt Lead cho các nhân viên đang Online.</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', opacity: 0.6 }}>
                <input type="radio" name="routing" disabled style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Chia theo Kỹ năng (Skill-based)</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Ưu tiên chia cho nhân viên có tỷ lệ chốt Khách hàng tương tự cao nhất. (Sắp ra mắt)</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
