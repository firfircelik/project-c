import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const salesData = [
  { name: 'Oca', sales: 4000, target: 2400 },
  { name: 'Şub', sales: 3000, target: 1398 },
  { name: 'Mar', sales: 2000, target: 9800 },
  { name: 'Nis', sales: 2780, target: 3908 },
  { name: 'May', sales: 1890, target: 4800 },
  { name: 'Haz', sales: 2390, target: 3800 },
  { name: 'Tem', sales: 3490, target: 4300 },
];

const stats = [
  { 
    title: 'Toplam Satış', 
    value: '₺12.4M', 
    change: '+14%', 
    isPositive: true,
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100'
  },
  { 
    title: 'Aktif İlanlar', 
    value: '142', 
    change: '+5%', 
    isPositive: true,
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100'
  },
  { 
    title: 'Yeni Müşteriler', 
    value: '28', 
    change: '-2%', 
    isPositive: false,
    icon: Users,
    color: 'text-amber-600',
    bg: 'bg-amber-100'
  },
  { 
    title: 'Kapanan İşlemler', 
    value: '12', 
    change: '+24%', 
    isPositive: true,
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Hoş geldin Batuhan, işte bugünkü özetin.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            Rapor İndir
          </button>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
            Yeni İlan
          </button>
        </div>
      </div>

      {/* Stats Grid */}
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
              <span className="text-slate-400 text-xs ml-1">geçen aya göre</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Satış Performansı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">İlan Dağılımı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Satılık', value: 85 },
                { name: 'Kiralık', value: 45 },
                { name: 'Ticari', value: 12 }
              ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Son Aktiviteler</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { action: 'Yeni İlan Eklendi', desc: 'Kadıköy Moda 3+1 Deniz Manzaralı', time: '2 saat önce', type: 'listing' },
              { action: 'Müşteri Görüşmesi', desc: 'Ayşe Yılmaz ile fiyat teklifi görüşüldü', time: '4 saat önce', type: 'customer' },
              { action: 'Satış Kapatıldı', desc: 'Beşiktaş 2+1 Daire satışı tamamlandı', time: '1 gün önce', type: 'sale' },
            ].map((activity, i) => (
              <div key={i} className="p-4 sm:px-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-2.5 h-2.5 mt-1.5 rounded-full shadow-sm ${
                  activity.type === 'listing' ? 'bg-indigo-500 shadow-indigo-200' : 
                  activity.type === 'customer' ? 'bg-amber-500 shadow-amber-200' : 'bg-emerald-500 shadow-emerald-200'
                }`} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{activity.action}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{activity.desc}</p>
                </div>
                <span className="ml-auto text-xs font-medium text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="p-6 border-b border-indigo-100/50 flex items-center gap-2 relative z-10">
            <div className="bg-indigo-100 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Önerileri</h3>
          </div>
          <div className="p-6 space-y-4 relative z-10">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-slate-800 font-bold mb-2 flex items-center gap-1.5">
                <span className="text-emerald-500">🎯</span> Yüksek Eşleşme Bulundu
              </p>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                <span className="font-bold text-slate-900">Ahmet Yılmaz</span> için <span className="font-bold text-slate-900">ILN-1001</span> (%95 uyum).
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-colors shadow-sm shadow-indigo-200">
                WhatsApp ile Öner
              </button>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-slate-800 font-bold mb-2 flex items-center gap-1.5">
                <span className="text-amber-500">⚠️</span> İlan Süresi Doluyor
              </p>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                <span className="font-bold text-slate-900">ILN-1003</span> ilanının süresi 3 gün içinde dolacak.
              </p>
              <button className="w-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-2 rounded-lg text-xs font-bold transition-colors">
                Süreyi Uzat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
