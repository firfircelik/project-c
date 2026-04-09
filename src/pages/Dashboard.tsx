import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Users, Building2, CheckCircle2, ArrowUpRight, ArrowDownRight, Sparkles, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Summary {
  listings: number;
  customers: number;
  tasks: number;
  closed: number;
}

interface MonthlyStat {
  name: string;
  listings: number;
  customers: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ listings: 0, customers: 0, tasks: 0, closed: 0 });
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);

  useEffect(() => {
    fetchSummary();
  }, [user]);

  async function fetchSummary() {
    if (!user?.tenant_id) return;
    setLoading(true);

    const [{ count: listingCount }, { count: customerCount }, { count: taskCount }] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id),
    ]);

    const { count: closedCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('stage', 'closed');

    setSummary({
      listings: listingCount || 0,
      customers: customerCount || 0,
      tasks: taskCount || 0,
      closed: closedCount || 0
    });

    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: d.toLocaleDateString('tr-TR', { month: 'short' })
      };
    });

    const monthlyData: MonthlyStat[] = [];
    for (const month of months) {
      const [l, c] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id)
          .gte('created_at', `${month.key}-01`)
          .lt('created_at', `${month.key}-31`),
        supabase.from('customers').select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id)
          .gte('created_at', `${month.key}-01`)
          .lt('created_at', `${month.key}-31`),
      ]);

      monthlyData.push({ name: month.name, listings: l.count || 0, customers: c.count || 0 });
    }

    setMonthly(monthlyData);
    setLoading(false);
  }

  const stats = useMemo(() => ([
    { title: 'Toplam İlan', value: summary.listings, change: '+0%', isPositive: true, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Toplam Müşteri', value: summary.customers, change: '+0%', isPositive: true, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Aktif Görevler', value: summary.tasks, change: '+0%', isPositive: true, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Kapanan İşlemler', value: summary.closed, change: '+0%', isPositive: true, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
  ]), [summary]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Hoş geldin, işte güncel özet.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              {stat.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stat.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-slate-400 text-xs ml-1">son 30 gün</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Aylık İlan / Müşteri</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="listings" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorListings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Müşteri Artışı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Operasyonel Özet</h3>
          <p className="text-xs text-slate-500 mt-1">Bugün ve son 30 gün hareketleri.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">Bugün Eklenen İlan</p>
            <p className="text-2xl font-bold text-slate-900">{summary.listings}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">Bugün Eklenen Müşteri</p>
            <p className="text-2xl font-bold text-slate-900">{summary.customers}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">Açık Görev</p>
            <p className="text-2xl font-bold text-slate-900">{summary.tasks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
