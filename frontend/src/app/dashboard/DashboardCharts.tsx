'use client';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#4f8ef7', '#a855f7', '#22c55e', '#f97316', '#06b6d4'];

export function DeptPieChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Chưa có dữ liệu phòng ban
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Pie
          data={data.map(d => ({ name: d.name.replace('Phòng ', ''), value: d.count }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }: any) => (percent || 0) > 0 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ''}
          labelLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          itemStyle={{ fontWeight: 600 }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 13 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AttendanceBarChart({ data }: { data: { name: string; checkins: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          cursor={{ fill: 'var(--bg-hover)' }}
        />
        <Bar dataKey="checkins" name="Lượt Check-in" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
