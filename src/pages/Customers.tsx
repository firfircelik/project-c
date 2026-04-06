import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone,
  Mail,
  Calendar,
  ThermometerSun,
  Thermometer,
  ThermometerSnowflake,
  MoreVertical,
  Sparkles,
  X,
  Edit,
  Trash2
} from 'lucide-react';

const mockCustomers = [
  { id: '1', name: 'Ayşe Yılmaz', phone: '+90 532 123 4567', email: 'ayse@example.com', budget: '10M - 15M ₺', type: 'Alıcı', temp: 'hot', lastContact: 'Bugün', aiScore: 92, aiMatches: 3 },
  { id: '2', name: 'Mehmet Demir', phone: '+90 555 987 6543', email: 'mehmet.d@example.com', budget: '40M - 50M ₺', type: 'Satıcı', temp: 'warm', lastContact: 'Dün', aiScore: 78, aiMatches: 1 },
  { id: '3', name: 'Tech Corp A.Ş.', phone: '+90 212 345 6789', email: 'info@techcorp.com', budget: '80K - 100K ₺ (Kira)', type: 'Kiracı', temp: 'hot', lastContact: '2 gün önce', aiScore: 95, aiMatches: 5 },
  { id: '4', name: 'Zeynep Kaya', phone: '+90 533 444 5566', email: 'zeynepk@example.com', budget: '7M - 9M ₺', type: 'Alıcı', temp: 'cold', lastContact: '1 hafta önce', aiScore: 45, aiMatches: 0 },
  { id: '5', name: 'Ali Veli', phone: '+90 544 222 3344', email: 'ali.veli@example.com', budget: '12M - 16M ₺', type: 'Alıcı', temp: 'warm', lastContact: '3 gün önce', aiScore: 85, aiMatches: 2 },
];

const tempConfig = {
  hot: { icon: ThermometerSun, color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'Sıcak' },
  warm: { icon: Thermometer, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Ilık' },
  cold: { icon: ThermometerSnowflake, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', label: 'Soğuk' },
};

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const openEditModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteri CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Müşteri portföyünüzü ve iletişim geçmişini yönetin.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Yeni Müşteri
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="İsim, telefon veya e-posta ara..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow">
            <option value="">Tüm Tipler</option>
            <option value="Alıcı">Alıcı</option>
            <option value="Satıcı">Satıcı</option>
            <option value="Kiracı">Kiracı</option>
          </select>
          <button className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 bg-white transition-colors">
            <Filter className="w-4 h-4" />
            Filtrele
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCustomers.map((customer) => {
          const TempIcon = tempConfig[customer.temp as keyof typeof tempConfig].icon;
          return (
            <div key={customer.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg border border-slate-200">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <Link to={`/customers/${customer.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">{customer.name}</Link>
                      <br />
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg mt-1 inline-block border border-slate-200">
                        {customer.type}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === customer.id ? null : customer.id)}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeDropdown === customer.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                        <button 
                          onClick={() => openEditModal(customer)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> Düzenle
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-medium">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-medium">{customer.email}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Bütçe</span>
                    <span className="text-sm font-bold text-slate-900">{customer.budget}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${tempConfig[customer.temp as keyof typeof tempConfig].bg} ${tempConfig[customer.temp as keyof typeof tempConfig].color}`}>
                    <TempIcon className="w-3.5 h-3.5" />
                    {tempConfig[customer.temp as keyof typeof tempConfig].label}
                  </div>
                </div>
                
                {/* AI Match Section */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-700">AI Eşleşme Skoru</span>
                    </div>
                    <span className={`text-sm font-bold ${customer.aiScore >= 90 ? 'text-emerald-600' : customer.aiScore >= 70 ? 'text-amber-600' : 'text-slate-500'}`}>
                      %{customer.aiScore}
                    </span>
                  </div>
                  {customer.aiMatches > 0 ? (
                    <button className="w-full mt-4 bg-purple-50 hover:bg-purple-100 text-purple-700 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-purple-100">
                      <Sparkles className="w-3.5 h-3.5" />
                      {customer.aiMatches} İlan Önerisi Var
                    </button>
                  ) : (
                    <button className="w-full mt-4 bg-slate-50 text-slate-400 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-100">
                      Uygun İlan Bulunamadı
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4" />
                  Son iletişim: {customer.lastContact}
                </div>
                <Link to={`/customers/${customer.id}`} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Detaylar →</Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Müşteriyi Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input type="text" defaultValue={selectedCustomer.name} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label>
                  <input type="text" defaultValue={selectedCustomer.phone} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                  <input type="email" defaultValue={selectedCustomer.email} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri Tipi</label>
                  <select defaultValue={selectedCustomer.type} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>Alıcı</option>
                    <option>Satıcı</option>
                    <option>Kiracı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sıcaklık</label>
                  <select defaultValue={selectedCustomer.temp} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="hot">Sıcak</option>
                    <option value="warm">Ilık</option>
                    <option value="cold">Soğuk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bütçe Aralığı</label>
                <input type="text" defaultValue={selectedCustomer.budget} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Özel Notlar</label>
                <textarea rows={3} defaultValue={selectedCustomer.notes || ''} placeholder="Müşteri hakkında özel notlar..." className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                İptal
              </button>
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
