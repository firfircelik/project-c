import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, Calendar, MapPin, 
  Sparkles, Edit, Trash2, MessageSquare, Clock,
  FileText, X, Loader2, Wand2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type InteractionType = 'telefon' | 'whatsapp' | 'email' | 'gösterim';

interface Interaction {
  id: string;
  customer_id: string;
  type: InteractionType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  users?: { full_name: string | null }[] | null;
}

interface ListingMatch {
  id: string;
  title: string;
  score: number;
  reasons: string[];
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  type?: 'alıcı' | 'satıcı' | 'kiracı' | null;
  temperature: 'hot' | 'warm' | 'cold';
  budget_min?: number | null;
  budget_max?: number | null;
  notes?: string | null;
  created_at: string;
}

const tempConfig = {
  hot: { color: 'text-red-600', bg: 'bg-red-50 border-red-100', label: 'Sıcak', dot: 'bg-red-500' },
  warm: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', label: 'Ilık', dot: 'bg-amber-500' },
  cold: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', label: 'Soğuk', dot: 'bg-blue-500' },
};

const typeLabels: Record<'alıcı' | 'satıcı' | 'kiracı', string> = {
  'alıcı': 'Alıcı',
  'satıcı': 'Satıcı',
  'kiracı': 'Kiracı'
};

const interactionLabels: Record<InteractionType, string> = {
  telefon: 'Telefon Görüşmesi',
  whatsapp: 'WhatsApp',
  email: 'E-posta',
  gösterim: 'Ev Gösterimi'
};

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [notice, setNotice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listingMatches, setListingMatches] = useState<ListingMatch[]>([]);
  const [matching, setMatching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'alıcı' as 'alıcı' | 'satıcı' | 'kiracı',
    temperature: 'warm' as 'hot' | 'warm' | 'cold',
    budget_min: '',
    budget_max: '',
    notes: ''
  });

  useEffect(() => {
    if (!id || !user?.tenant_id) return;
    fetchCustomer();
    fetchTimeline();
  }, [id, user]);

  useEffect(() => {
    if (!customer) return;
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      type: customer.type || 'alıcı',
      temperature: customer.temperature || 'warm',
      budget_min: customer.budget_min ? String(customer.budget_min) : '',
      budget_max: customer.budget_max ? String(customer.budget_max) : '',
      notes: customer.notes || ''
    });
  }, [customer]);

  useEffect(() => {
    if (!customer || !user?.tenant_id) return;
    fetchListingMatches();
  }, [customer, user]);

  async function fetchCustomer() {
    if (!id || !user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!error && data) {
      setCustomer(data as Customer);
      setNotes(data.notes || '');
    }
    setLoading(false);
  }

  async function fetchTimeline() {
    if (!id || !user?.tenant_id) return;
    const { data } = await supabase
      .from('interactions')
      .select('id, customer_id, type, notes, created_by, created_at, users(full_name)')
      .eq('customer_id', id)
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    setTimeline((data as Interaction[]) || []);
  }

  async function saveNotes() {
    if (!customer) return;
    setSavingNote(true);
    const { error } = await supabase
      .from('customers')
      .update({ notes })
      .eq('id', customer.id);

    setSavingNote(false);
    if (!error) {
      fetchCustomer();
    }
  }

  async function handleUpdateCustomer() {
    if (!customer) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from('customers')
      .update({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        type: formData.type,
        temperature: formData.temperature,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        notes: formData.notes
      })
      .eq('id', customer.id);
    setSavingEdit(false);
    if (!error) {
      setIsEditModalOpen(false);
      setNotice('Müşteri güncellendi.');
      fetchCustomer();
    }
  }

  function parseRoomCount(value?: string | null) {
    if (!value) return null;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  function computeListingScore(listing: any): ListingMatch {
    const reasons: string[] = [];
    let score = 0;

    const prefs = (customer as any)?.preferences || {};
    const listingCity = (listing.location?.il || '').toLowerCase();
    const listingDistrict = (listing.location?.ilçe || '').toLowerCase();
    const listingNeighborhood = (listing.location?.mahalle || '').toLowerCase();
    const listingType = (listing.category || '').toLowerCase();
    const listingRooms = parseRoomCount(listing.features?.oda);
    const listingArea = listing.features?.m2 || 0;

    if (prefs.location_city && listingCity.includes(String(prefs.location_city).toLowerCase())) {
      score += 25;
      reasons.push('İl uyumu');
    }
    if (prefs.location_district && listingDistrict.includes(String(prefs.location_district).toLowerCase())) {
      score += 15;
      reasons.push('İlçe uyumu');
    }
    if (prefs.location_neighborhood && listingNeighborhood.includes(String(prefs.location_neighborhood).toLowerCase())) {
      score += 10;
      reasons.push('Mahalle uyumu');
    }
    if (prefs.property_type && listingType.includes(String(prefs.property_type).toLowerCase())) {
      score += 15;
      reasons.push('Emlak tipi uyumu');
    }
    if (prefs.room_count) {
      const prefRooms = parseRoomCount(String(prefs.room_count));
      if (prefRooms && listingRooms && listingRooms >= prefRooms) {
        score += 15;
        reasons.push('Oda sayısı uyumu');
      }
    }
    if (prefs.min_area) {
      const minArea = parseFloat(prefs.min_area);
      if (!Number.isNaN(minArea) && listingArea >= minArea) {
        score += 10;
        reasons.push('m² uyumu');
      }
    }

    const minBudget = customer?.budget_min ? Number(customer.budget_min) : null;
    const maxBudget = customer?.budget_max ? Number(customer.budget_max) : null;
    const price = listing.price ? Number(listing.price) : null;
    if (price && (minBudget || maxBudget)) {
      if ((minBudget === null || price >= minBudget) && (maxBudget === null || price <= maxBudget)) {
        score += 20;
        reasons.push('Bütçe uyumu');
      }
    }

    return {
      id: listing.id,
      title: listing.title,
      score: Math.min(score, 100),
      reasons: reasons.length ? reasons : ['Genel uyum'],
    };
  }

  async function fetchListingMatches() {
    if (!user?.tenant_id || !customer) return;
    setMatching(true);
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, category, location, features')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .limit(30);

    const candidates = (data || []).map(computeListingScore);
    const sorted = candidates.sort((a, b) => b.score - a.score).slice(0, 5);
    setListingMatches(sorted);

    if (sorted.length > 0) {
      await supabase.from('match_scores').upsert(
        sorted.map((match) => ({
          tenant_id: user.tenant_id,
          listing_id: match.id,
          customer_id: customer.id,
          score: match.score,
          reasons: match.reasons
        }))
      );
    }
    setMatching(false);
  }

  async function handleDelete() {
    if (!customer) return;
    const ok = confirm('Müşteriyi silmek istediğinize emin misiniz?');
    if (!ok) return;
    await supabase.from('customers').delete().eq('id', customer.id);
    navigate('/app/customers');
  }

  const budgetText = useMemo(() => {
    if (!customer) return '';
    const formatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
    if (customer.budget_min && customer.budget_max) {
      return `${formatter.format(customer.budget_min)} - ${formatter.format(customer.budget_max)}`;
    }
    if (customer.budget_min) return `${formatter.format(customer.budget_min)}+`;
    if (customer.budget_max) return `${formatter.format(customer.budget_max)}'a kadar`;
    return 'Belirtilmemiş';
  }, [customer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Müşteri bulunamadı.</p>
      </div>
    );
  }

  async function generateAiSummary() {
    if (!customer) return;
    setAiLoading(true);
    const prompt = `Müşteri özeti çıkar ve ihtiyaçları maddeler halinde özetle.\n\nAd: ${customer.name}\nTip: ${customer.type || '-'}\nBütçe: ${budgetText}\nNotlar: ${customer.notes || '-'}\n`;

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        prompt,
        system: 'Sen bir emlak CRM asistanısın. Kısa, net ve aksiyon odaklı özet üret.'
      }
    });

    if (!error && data?.message) {
      setNotes(data.message);
    } else {
      setNotice('AI özeti alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
    setAiLoading(false);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/customers" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${tempConfig[customer.temperature].bg} ${tempConfig[customer.temperature].color}`}>
                <span className={`w-2 h-2 rounded-full ${tempConfig[customer.temperature].dot} animate-pulse`}></span> {tempConfig[customer.temperature].label} Müşteri
              </span>
              <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {customer.type ? typeLabels[customer.type] : 'Belirtilmedi'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm" 
            title="Düzenle"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 bg-white border border-red-200 rounded-xl hover:bg-red-50 text-red-600 transition-colors shadow-sm" title="Sil">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & AI */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">İletişim Bilgileri</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Phone className="w-5 h-5" />
                </div>
                <span className="font-bold">{customer.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-bold">{customer.email || '-'}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-bold">-</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-200">
                Ara
              </button>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-emerald-200">
                WhatsApp
              </button>
            </div>
          </div>

          {/* Requirements & Budget */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Arama Kriterleri</h3>
            <div className="mb-6">
              <p className="text-xs text-slate-500 font-medium mb-1.5">Bütçe Aralığı</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{budgetText}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Özel Notlar</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {customer.notes || 'Not eklenmemiş.'}
              </p>
            </div>
          </div>

          {/* AI Matches & Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="mb-4 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Müşteri Özeti</h3>
              </div>
              <p className="text-sm text-indigo-900/80 leading-relaxed bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/50">
                AI özetini tek tıkla oluşturabilirsiniz.
              </p>
              <button
                onClick={generateAiSummary}
                disabled={aiLoading}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-200 disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" /> {aiLoading ? 'Özetleniyor...' : 'AI Özeti Oluştur'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Uygun İlanlar</h3>
            <p className="text-sm text-slate-500 mb-4">Bu müşterinin kriterlerine göre öneriler.</p>
            {matching ? (
              <div className="text-sm text-slate-500">Eşleşmeler hazırlanıyor...</div>
            ) : listingMatches.length === 0 ? (
              <div className="text-sm text-slate-500">Uygun ilan bulunamadı.</div>
            ) : (
              <div className="space-y-3">
                {listingMatches.map((match) => (
                  <div key={match.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{match.title}</span>
                      <span className="text-xs font-bold text-indigo-600">%{match.score}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">{match.reasons.join(' • ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-3 overflow-x-auto">
            <button className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors">
              <MessageSquare className="w-4 h-4" /> Not Ekle
            </button>
            <button className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors">
              <Calendar className="w-4 h-4" /> Randevu Oluştur
            </button>
            <button className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors">
              <FileText className="w-4 h-4" /> Sözleşme Hazırla
            </button>
          </div>

          {/* Notes Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Detaylı Notlar</h3>
            <div className="mb-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[180px] border border-slate-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500"
                placeholder="Not ekleyin..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveNotes}
                disabled={savingNote}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
              >
                {savingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                Notu Kaydet
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Etkileşim Geçmişi</h3>
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
              {timeline.length === 0 ? (
                <div className="text-sm text-slate-500 ml-4">Henüz etkileşim kaydı yok.</div>
              ) : timeline.map((item) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                    item.type === 'telefon' ? 'bg-indigo-500' :
                    item.type === 'gösterim' ? 'bg-emerald-500' :
                    item.type === 'whatsapp' ? 'bg-green-500' : 'bg-slate-400'
                  }`} />
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">{interactionLabels[item.type]}</h4>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100">
                        <Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{item.notes || 'Not girilmedi.'}</p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 border border-slate-300">
                        {(item.users?.[0]?.full_name || 'S').charAt(0)}
                      </div>
                      {item.users?.[0]?.full_name || 'Sistem'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
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
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri Tipi</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="alıcı">Alıcı</option>
                    <option value="satıcı">Satıcı</option>
                    <option value="kiracı">Kiracı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sıcaklık</label>
                  <select value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value as any })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="hot">Sıcak</option>
                    <option value="warm">Ilık</option>
                    <option value="cold">Soğuk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bütçe Aralığı</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={formData.budget_min} onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })} placeholder="Min (₺)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" value={formData.budget_max} onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })} placeholder="Max (₺)" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Özel Notlar</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                İptal
              </button>
              <button onClick={handleUpdateCustomer} disabled={savingEdit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50">
                {savingEdit ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
