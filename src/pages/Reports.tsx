import React, { useEffect, useMemo, useState } from 'react';
import { PieChart as PieChartIcon, TrendingUp, DollarSign, Download, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const COLORS = ['#4f46e5', '#10b981', '#8b5cf6'];

export default function Reports() {
  const { user, hasAnyPermission, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listingsCount, setListingsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [closedTasks, setClosedTasks] = useState(0);
  const [monthly, setMonthly] = useState<{ name: string; satis: number; kira: number }[]>([]);
  const [agentRows, setAgentRows] = useState<{ name: string; listings: number; customers: number; tasks: number }[]>([]);
  const [commissionRateSale, setCommissionRateSale] = useState(2);
  const [commissionRateRent, setCommissionRateRent] = useState(10);
  const [agentCommissions, setAgentCommissions] = useState<{ name: string; total: number }[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user, monthOffset]);

  async function fetchData() {
    if (!user?.tenant_id) return;
    setLoading(true);

    const [{ count: listingCount }, { count: customerCount }, { count: closedCount }] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id).eq('stage', 'closed'),
    ]);

    setListingsCount(listingCount || 0);
    setCustomersCount(customerCount || 0);
    setClosedTasks(closedCount || 0);

    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      };
    });

    const monthlyData = months.map(m => ({ name: m.name, satis: 0, kira: 0 }));
    setMonthly(monthlyData);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single();
    const tenantSettings = (tenant?.settings || {}) as any;
    setCommissionRateSale(Number(tenantSettings.commission_sale_rate || 2));
    setCommissionRateRent(Number(tenantSettings.commission_rent_rate || 10));

    const { data: agents } = await supabase
      .from('users')
      .select('id, full_name, branch_id')
      .eq('tenant_id', user.tenant_id)
      .order('full_name');

    const agentStats = [] as { name: string; listings: number; customers: number; tasks: number }[];
    const commissionRows = [] as { name: string; total: number }[];
    const canSeeBranch = hasPermission('rapor:view:branch') || user.data_scope === 'branch' || user.data_scope === 'branch_visible';
    const canSeeAll = hasPermission('rapor:view:branch') || hasPermission('*') || user.data_scope === 'global';
    const filteredAgents = canSeeAll
      ? (agents || [])
      : canSeeBranch
        ? (agents || []).filter((agent) => agent.branch_id === user.branch_id)
        : (agents || []).filter((agent) => agent.id === user.id);

    for (const agent of filteredAgents) {
      const [lc, cc, tc] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id).eq('agent_id', agent.id),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id).eq('assigned_agent_id', agent.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenant_id).eq('assigned_to', agent.id)
      ]);
      agentStats.push({
        name: agent.full_name,
        listings: lc.count || 0,
        customers: cc.count || 0,
        tasks: tc.count || 0
      });

      const { data: contracts } = await supabase
        .from('contracts')
        .select('amount, type')
        .eq('tenant_id', user.tenant_id)
        .eq('created_by', agent.id)
        .eq('status', 'imzalandı');

      let total = 0;
      for (const contract of contracts || []) {
        const amount = Number(contract.amount || 0);
        if (!amount) continue;
        if (contract.type === 'kiralama') {
          total += (amount * commissionRateRent) / 100;
        } else {
          total += (amount * commissionRateSale) / 100;
        }
      }
      commissionRows.push({ name: agent.full_name, total });
    }
    setAgentRows(agentStats);
    setAgentCommissions(commissionRows);

    setLoading(false);
  }

  const commissionData = useMemo(() => ([
    { name: 'İlan', value: listingsCount * 1000 },
    { name: 'Müşteri', value: customersCount * 500 },
    { name: 'Kapanan', value: closedTasks * 1500 },
  ]), [listingsCount, customersCount, closedTasks]);

  function exportPdf() {
    setExporting(true);
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229);
    doc.rect(14, 12, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Emlak CRM Pro', 16, 19);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 150, 19);

    doc.setFontSize(12);
    doc.text('Genel Ozet', 14, 34);
    doc.setFontSize(11);
    doc.text(`Toplam Ilan: ${listingsCount}`, 14, 44);
    doc.text(`Toplam Musteri: ${customersCount}`, 14, 52);
    doc.text(`Kapanan Islem: ${closedTasks}`, 14, 60);

    doc.setFontSize(12);
    doc.text('Aylik Tablo', 14, 74);

    const startX = 14;
    const startY = 80;
    const colWidths = [40, 50, 50];
    const rowHeight = 8;

    doc.setFillColor(240, 242, 247);
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
    doc.setTextColor(45, 55, 72);
    doc.setFontSize(10);
    doc.text('Ay', startX + 2, startY + 5.5);
    doc.text('Satis', startX + colWidths[0] + 2, startY + 5.5);
    doc.text('Kiralama', startX + colWidths[0] + colWidths[1] + 2, startY + 5.5);

    let y = startY + rowHeight;
    doc.setTextColor(0, 0, 0);
    monthly.forEach((m) => {
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight);
      doc.text(m.name, startX + 2, y + 5.5);
      doc.text(String(m.satis), startX + colWidths[0] + 2, y + 5.5);
      doc.text(String(m.kira), startX + colWidths[0] + colWidths[1] + 2, y + 5.5);
      y += rowHeight;
    });

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Rapor otomatik uretilmistir.', 14, 285);

    doc.save(`rapor-${new Date().toISOString().slice(0,10)}.pdf`);
    setExporting(false);
  }

  function exportExcel() {
    setExporting(true);
    const rows = monthly.map((m) => ({
      Ay: m.name,
      Satış: m.satis,
      Kiralama: m.kira,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aylik');
    XLSX.writeFile(wb, `rapor-${new Date().toISOString().slice(0,10)}.xlsx`);
    setExporting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raporlar & Prim</h1>
          <p className="text-slate-500 text-sm mt-1">Komisyon gelirleri ve performans özetleri.</p>
        </div>
         <div className="flex gap-2 items-center">
           <button
             onClick={() => setMonthOffset((prev) => prev + 1)}
             className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
           >
             <ChevronLeft className="w-4 h-4" /> Önceki 6 Ay
           </button>
           <button
             onClick={() => setMonthOffset((prev) => Math.max(0, prev - 1))}
             className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
             disabled={monthOffset === 0}
           >
             Sonraki 6 Ay <ChevronRight className="w-4 h-4" />
           </button>
           <button
             onClick={exportPdf}
             disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Toplam İlan</h3>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{listingsCount}</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +0%
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Toplam Müşteri</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{customersCount}</p>
          <p className="text-sm text-slate-500 font-medium mt-2">Güncel müşteri sayısı</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Kapanan İşlem</h3>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{closedTasks}</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +0 işlem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Gelir Dağılımı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={commissionData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {commissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Aylık İşlem Hacmi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="satis" name="Satış" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="kira" name="Kiralama" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Komisyon Oranları</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">Satış Komisyon</p>
            <p className="text-2xl font-bold text-slate-900">%{commissionRateSale}</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-bold mb-2">Kiralama Komisyon</p>
            <p className="text-2xl font-bold text-slate-900">%{commissionRateRent}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Çalışan Performansı</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Çalışan</th>
                <th className="py-2">İlan</th>
                <th className="py-2">Müşteri</th>
                <th className="py-2">Görev</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {agentRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-500">Kayıt yok.</td>
                </tr>
              ) : agentRows.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="py-3 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> {row.name}
                  </td>
                  <td className="py-3">{row.listings}</td>
                  <td className="py-3">{row.customers}</td>
                  <td className="py-3">{row.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Çalışan Komisyon</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Çalışan</th>
                <th className="py-2">Toplam Komisyon</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {agentCommissions.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-3 text-slate-500">Kayıt yok.</td>
                </tr>
              ) : agentCommissions.map((row) => (
                <tr key={row.name} className="border-t border-slate-100">
                  <td className="py-3 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> {row.name}
                  </td>
                  <td className="py-3">{row.total.toLocaleString('tr-TR')} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
