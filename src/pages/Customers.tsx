import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
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
  Trash2,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  type?: 'alıcı' | 'satıcı' | 'kiracı';
  temperature: 'hot' | 'warm' | 'cold';
  budget_min?: number;
  budget_max?: number;
  preferences?: Record<string, any>;
  notes?: string;
  created_at: string;
}

const tempConfig = {
  hot: { icon: ThermometerSun, color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'Sıcak' },
  warm: { icon: Thermometer, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Ilık' },
  cold: { icon: ThermometerSnowflake, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', label: 'Soğuk' },
};

const typeLabels: Record<'alıcı' | 'satıcı' | 'kiracı', string> = {
  'alıcı': 'Alıcı',
  'satıcı': 'Satıcı',
  'kiracı': 'Kiracı'
};

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const { user, hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'alıcı' as 'alıcı' | 'satıcı' | 'kiracı',
    temperature: 'warm' as 'hot' | 'warm' | 'cold',
    budget_min: '',
    budget_max: '',
    notes: '',
    move_timeframe: '',
    location_city: '',
    location_district: '',
    location_neighborhood: '',
    property_type: '',
    room_count: '',
    min_area: '',
    financing: '',
    source: '',
    contact_preference: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  async function fetchCustomers() {
    if (!user?.tenant_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch customers error:', error);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }

  function openCreateModal() {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      type: 'alıcı',
      temperature: 'warm',
      budget_min: '',
      budget_max: '',
      notes: '',
      move_timeframe: '',
      location_city: '',
      location_district: '',
      location_neighborhood: '',
      property_type: '',
      room_count: '',
      min_area: '',
      financing: '',
      source: '',
      contact_preference: ''
    });
    setIsEditModalOpen(true);
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      type: customer.type || 'alıcı',
      temperature: customer.temperature || 'warm',
      budget_min: customer.budget_min?.toString() || '',
      budget_max: customer.budget_max?.toString() || '',
      notes: customer.notes || '',
      move_timeframe: (customer as any)?.preferences?.move_timeframe || '',
      location_city: (customer as any)?.preferences?.location_city || '',
      location_district: (customer as any)?.preferences?.location_district || '',
      location_neighborhood: (customer as any)?.preferences?.location_neighborhood || '',
      property_type: (customer as any)?.preferences?.property_type || '',
      room_count: (customer as any)?.preferences?.room_count || '',
      min_area: (customer as any)?.preferences?.min_area || '',
      financing: (customer as any)?.preferences?.financing || '',
      source: (customer as any)?.preferences?.source || '',
      contact_preference: (customer as any)?.preferences?.contact_preference || ''
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    setSaving(true);

    const payload = {
      tenant_id: user.tenant_id,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      type: formData.type,
      temperature: formData.temperature,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      notes: formData.notes,
      preferences: {
        move_timeframe: formData.move_timeframe,
        location_city: formData.location_city,
        location_district: formData.location_district,
        location_neighborhood: formData.location_neighborhood,
        property_type: formData.property_type,
        room_count: formData.room_count,
        min_area: formData.min_area,
        financing: formData.financing,
        source: formData.source,
        contact_preference: formData.contact_preference
      },
      assigned_agent_id: user.id
    };

    let error;
    if (selectedCustomer) {
      const { error: err } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', selectedCustomer.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('customers')
        .insert(payload);
      error = err;
    }

    setSaving(false);

    if (error) {
      setNotice(getCustomerErrorMessage(error.message));
      return;
    }

    setIsEditModalOpen(false);
    setSelectedCustomer(null);
    await fetchCustomers();
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchCustomers();
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || '').includes(searchTerm) ||
      (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || (customer.type || '') === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Belirtilmemiş';
    const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `${formatter.format(min)}+`;
    return `${formatter.format(max || 0)}'a kadar`;
  };

  const getCustomerErrorMessage = (message: string) => {
    if (message.includes('customers_type_check')) {
      return 'Müşteri tipi hatalı. Lütfen Alıcı, Satıcı veya Kiracı seçin.';
    }
    if (message.toLowerCase().includes('row-level security')) {
      return 'Yetkiniz yok. Lütfen tekrar giriş yapın.';
    }
    return 'Kayıt sırasında bir hata oluştu. Lütfen bilgileri kontrol edin.';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteri CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Müşteri portföyünüzü ve iletişim geçmişini yönetin.</p>
        </div>
        <button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Yeni Müşteri
        </button>
        <button
          onClick={() => window.location.assign('/app/portal-settings')}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Portal Ayarları
        </button>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

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
          <select 
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tüm Tipler</option>
            <option value="alıcı">Alıcı</option>
            <option value="satıcı">Satıcı</option>
            <option value="kiracı">Kiracı</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const TempIcon = tempConfig[customer.temperature as keyof typeof tempConfig].icon;
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
                        {customer.type ? typeLabels[customer.type] : 'Belirtilmedi'}
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
                        {(hasPermission('musteri:delete:any') || (hasPermission('musteri:delete:own') && customer.id)) && (
                          <button onClick={() => handleDelete(customer.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Sil
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-medium">{customer.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-medium">{customer.email || '-'}</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Bütçe</span>
                    <span className="text-sm font-bold text-slate-900">{formatBudget(customer.budget_min, customer.budget_max)}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${tempConfig[customer.temperature as keyof typeof tempConfig].bg} ${tempConfig[customer.temperature as keyof typeof tempConfig].color}`}>
                    <TempIcon className="w-3.5 h-3.5" />
                    {tempConfig[customer.temperature as keyof typeof tempConfig].label}
                  </div>
                </div>
                
                {/* AI Match Section */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-700">AI Eşleşme Skoru</span>
                    </div>
                    <span className="text-sm font-bold text-slate-400">
                      Henüz hesaplanmadı
                    </span>
                  </div>
                  <button className="w-full mt-4 bg-white text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200">
                    AI modülü hazır
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4" />
                  Oluşturulma: {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                </div>
                <Link to={`/customers/${customer.id}`} className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">Detaylar →</Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form id="customer-form" onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri Tipi</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="alıcı">Alıcı</option>
                    <option value="satıcı">Satıcı</option>
                    <option value="kiracı">Kiracı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sıcaklık</label>
                  <select value={formData.temperature} onChange={(e) => setFormData({...formData, temperature: e.target.value as any})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="hot">Sıcak</option>
                    <option value="warm">Ilık</option>
                    <option value="cold">Soğuk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bütçe Aralığı</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={formData.budget_min} onChange={(e) => setFormData({...formData, budget_min: e.target.value})} placeholder="Min (₺)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" value={formData.budget_max} onChange={(e) => setFormData({...formData, budget_max: e.target.value})} placeholder="Max (₺)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Özel Notlar</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Müşteri hakkında özel notlar..." className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Müşteri İhtiyaç Bilgileri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Taşınma Zamanı</label>
                    <select value={formData.move_timeframe} onChange={(e) => setFormData({ ...formData, move_timeframe: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Seçiniz</option>
                      <option value="hemen">Hemen</option>
                      <option value="1-3ay">1-3 Ay</option>
                      <option value="3-6ay">3-6 Ay</option>
                      <option value="6ay+">6+ Ay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kredi/Kaynak</label>
                    <select value={formData.financing} onChange={(e) => setFormData({ ...formData, financing: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Seçiniz</option>
                      <option value="nakit">Nakit</option>
                      <option value="kredi">Kredi</option>
                      <option value="karma">Karma</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">İl</label>
                    <input type="text" value={formData.location_city} onChange={(e) => setFormData({ ...formData, location_city: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">İlçe</label>
                    <input type="text" value={formData.location_district} onChange={(e) => setFormData({ ...formData, location_district: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mahalle</label>
                    <input type="text" value={formData.location_neighborhood} onChange={(e) => setFormData({ ...formData, location_neighborhood: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Emlak Tipi</label>
                    <input type="text" value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })} placeholder="Daire, Villa" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Oda Sayısı</label>
                    <input type="text" value={formData.room_count} onChange={(e) => setFormData({ ...formData, room_count: e.target.value })} placeholder="2+1" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Min m²</label>
                    <input type="number" value={formData.min_area} onChange={(e) => setFormData({ ...formData, min_area: e.target.value })} placeholder="100" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Kaynak</label>
                    <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Telefon, ilan, referans" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">İletişim Tercihi</label>
                    <select value={formData.contact_preference} onChange={(e) => setFormData({ ...formData, contact_preference: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="">Seçiniz</option>
                      <option value="telefon">Telefon</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">E-posta</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                İptal
              </button>
              <button type="submit" form="customer-form" disabled={saving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
