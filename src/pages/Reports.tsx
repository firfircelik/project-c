import React from 'react';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  DollarSign, 
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const commissionData = [
  { name: 'Satış', value: 450000 },
  { name: 'Kiralama', value: 120000 },
  { name: 'Danışmanlık', value: 35000 },
];

const COLORS = ['#4f46e5', '#10b981', '#8b5cf6'];

const monthlyData = [
  { name: 'Oca', satis: 4000, kira: 2400 },
  { name: 'Şub', satis: 3000, kira: 1398 },
  { name: 'Mar', satis: 2000, kira: 9800 },
  { name: 'Nis', satis: 2780, kira: 3908 },
  { name: 'May', satis: 1890, kira: 4800 },
  { name: 'Haz', satis: 2390, kira: 3800 },
];

const detailedCommissions = [
  { id: 'TRX-001', date: '05.04.2026', type: 'Satış', property: 'Kadıköy Moda 3+1', amount: '12.500.000 ₺', commission: '250.000 ₺', status: 'Ödendi' },
  { id: 'TRX-002', date: '02.04.2026', type: 'Kiralama', property: 'Şişli Bomonti 1+1', amount: '45.000 ₺', commission: '45.000 ₺', status: 'Bekliyor' },
  { id: 'TRX-003', date: '28.03.2026', type: 'Satış', property: 'Beşiktaş Merkez 2+1', amount: '8.200.000 ₺', commission: '164.000 ₺', status: 'Ödendi' },
  { id: 'TRX-004', date: '15.03.2026', type: 'Danışmanlık', property: 'Ticari Değerleme', amount: '-', commission: '35.000 ₺', status: 'Ödendi' },
  { id: 'TRX-005', date: '10.03.2026', type: 'Kiralama', property: 'Ataşehir Ofis', amount: '75.000 ₺', commission: '75.000 ₺', status: 'Ödendi' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Raporlar & Prim</h1>
          <p className="text-slate-500 text-sm mt-1">Komisyon gelirleri, prim hakedişleri ve performans analizleri.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Bu Ay
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Toplam Brüt Komisyon</h3>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">605.000 ₺</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +12% geçen aya göre
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Tahmini Net Prim (Danışman)</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">242.000 ₺</p>
          <p className="text-sm text-slate-500 font-medium mt-2">%40 Prim Oranı Üzerinden</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-bold">Kapanan İşlem</h3>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">14</p>
          <p className="text-sm text-emerald-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> +3 işlem geçen aya göre
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Gelir Dağılımı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commissionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {commissionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString('tr-TR')} ₺`}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Aylık İşlem Hacmi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="satis" name="Satış" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="kira" name="Kiralama" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Detaylı Prim & İşlem Dökümü</h3>
          <button className="text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200">
            <Filter className="w-4 h-4" /> Filtrele
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">İşlem ID</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tip</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Mülk</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">İşlem Bedeli</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Brüt Komisyon</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailedCommissions.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">{item.id}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 font-medium">{item.date}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      item.type === 'Satış' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                      item.type === 'Kiralama' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      'bg-purple-50 text-purple-700 border-purple-100'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-700">{item.property}</td>
                  <td className="py-4 px-6 text-sm font-bold text-slate-900">{item.amount}</td>
                  <td className="py-4 px-6 text-sm font-bold text-emerald-600">{item.commission}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      item.status === 'Ödendi' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
