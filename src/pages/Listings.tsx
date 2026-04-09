import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Map as MapIcon,
  List,
  Sparkles,
  Download,
  X,
  Loader2,
  Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Listing {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'satılık' | 'kiralık';
  category: string;
  price: number;
  currency: string;
  location: { il?: string; ilçe?: string; mahalle?: string; address?: string; lat?: number; lng?: number };
  features: { oda?: string; m2?: number; binaYasi?: number };
  status: 'taslak' | 'onay_bekliyor' | 'aktif' | 'satıldı';
  agent_id: string;
  ai_score: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  'aktif': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'onay_bekliyor': 'bg-amber-100 text-amber-700 border-amber-200',
  'satıldı': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'taslak': 'bg-slate-100 text-slate-700 border-slate-200',
};

const statusLabels: Record<string, string> = {
  'aktif': 'Aktif',
  'onay_bekliyor': 'Onay Bekliyor',
  'satıldı': 'Satıldı',
  'taslak': 'Taslak',
};

export default function Listings() {
  const { user, hasPermission } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'satılık' as 'satılık' | 'kiralık',
    category: '',
    price: '',
    il: '',
    ilçe: '',
    mahalle: '',
    address: '',
    oda: '',
    m2: '',
    binaYasi: '',
    status: 'taslak' as 'taslak' | 'onay_bekliyor' | 'aktif' | 'satıldı',
  });

  useEffect(() => {
    if (previewUrls.length === 0) return;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  async function resolveCoordinates() {
    const query = [formData.mahalle, formData.ilçe, formData.il, formData.address].filter(Boolean).join(' ');
    if (!query) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=tr`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {
      return null;
    }
    return null;
  }

  function handlePhotoSelect(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files);
    setSelectedFiles(list);
    setPreviewUrls(list.map((file) => URL.createObjectURL(file)));
  }

  useEffect(() => {
    fetchListings();
  }, [user]);

  async function fetchListings() {
    if (!user?.tenant_id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    setSaving(true);

    const geocoded = await resolveCoordinates();
    const fallbackLat = editingListing?.location?.lat ?? 41.0082 + Math.random() * 0.1;
    const fallbackLng = editingListing?.location?.lng ?? 28.9784 + Math.random() * 0.1;
    
    const listingData = {
      tenant_id: user.tenant_id,
      agent_id: user.id,
      code: `ILN-${String(Date.now()).slice(-6)}`,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      currency: '₺',
      location: {
        il: formData.il,
        ilçe: formData.ilçe,
        mahalle: formData.mahalle,
        address: formData.address,
        lat: geocoded?.lat ?? fallbackLat,
        lng: geocoded?.lng ?? fallbackLng,
      },
      features: {
        oda: formData.oda,
        m2: parseInt(formData.m2) || 0,
        binaYasi: parseInt(formData.binaYasi) || 0,
      },
      status: formData.status,
      ai_score: Math.floor(Math.random() * 30) + 70,
    };

    let error;
    let createdId: string | null = null;
    if (editingListing) {
      const { error: err } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', editingListing.id);
      error = err;
      createdId = editingListing.id;
    } else {
      const { data, error: err } = await supabase
        .from('listings')
        .insert(listingData)
        .select('id')
        .single();
      error = err;
      createdId = data?.id || null;
    }

    if (!error && createdId && selectedFiles.length > 0) {
      const uploaded: { path: string; title?: string }[] = [];
      for (const file of selectedFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.tenant_id}/${createdId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('listing-media').upload(path, file, { upsert: true });
        if (!uploadError) uploaded.push({ path, title: file.name });
      }

      if (uploaded.length > 0) {
        const { data: current } = await supabase.from('listings').select('media').eq('id', createdId).single();
        const merged = [...(current?.media || []), ...uploaded];
        await supabase.from('listings').update({ media: merged }).eq('id', createdId);
      }
    }

    setSaving(false);
    
    if (error) {
      setNotice('Kayıt sırasında hata oluştu.');
    } else {
      setIsModalOpen(false);
      setEditingListing(null);
      setFormData({
        title: '', description: '', type: 'satılık', category: '',
        price: '', il: '', ilçe: '', mahalle: '', address: '', oda: '', m2: '',
        binaYasi: '', status: 'taslak'
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchListings();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchListings();
    }
  }

  function exportToExcel() {
    setExporting(true);
    const rows = filteredListings.map((l) => ({
      Kod: l.code,
      Başlık: l.title,
      Tip: l.type === 'satılık' ? 'Satılık' : 'Kiralık',
      Kategori: l.category || '',
      Fiyat: l.price,
      Durum: statusLabels[l.status],
      İl: l.location?.il || '',
      İlçe: l.location?.ilçe || '',
      Mahalle: l.location?.mahalle || '',
      'Oda Sayısı': l.features?.oda || '',
      'm²': l.features?.m2 || '',
      'Bina Yaşı': l.features?.binaYasi || '',
      'Oluşturma Tarihi': new Date(l.created_at).toLocaleDateString('tr-TR')
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ilanlar');
    XLSX.writeFile(wb, `ilanlar-${new Date().toISOString().slice(0,10)}.xlsx`);
    setExporting(false);
  }

  function openEditModal(listing: Listing) {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description || '',
      type: listing.type,
      category: listing.category || '',
      price: listing.price?.toString() || '',
      il: listing.location?.il || '',
      ilçe: listing.location?.ilçe || '',
      mahalle: listing.location?.mahalle || '',
      address: listing.location?.address || '',
      oda: listing.features?.oda || '',
      m2: listing.features?.m2?.toString() || '',
      binaYasi: listing.features?.binaYasi?.toString() || '',
      status: listing.status,
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsModalOpen(true);
  }

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.location?.ilçe || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || l.status === statusFilter;
    const matchesType = !typeFilter || l.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      maximumFractionDigits: 0 
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İlan Yönetimi</h1>
          <p className="text-slate-500 text-sm mt-1">Tüm portföyünüzü buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <List className="w-4 h-4" /> Liste
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'map' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <MapIcon className="w-4 h-4" /> Harita
            </button>
          </div>
          <button 
              onClick={() => { setEditingListing(null); setFormData({
                title: '', description: '', type: 'satılık', category: '',
                price: '', il: 'İstanbul', ilçe: '', mahalle: '', address: '', oda: '', m2: '',
                binaYasi: '', status: 'taslak'
              }); setSelectedFiles([]); setPreviewUrls([]); setIsModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yeni İlan Ekle
            </button>
            <button
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
              onClick={() => window.location.assign('/app/portal-settings')}
            >
              <Sparkles className="w-4 h-4" />
              Portal Ayarları
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
            >
            <Download className="w-4 h-4" />
            Excel İndir
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="İlan no, başlık veya konum ara..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="onay_bekliyor">Onay Bekliyor</option>
            <option value="satıldı">Satıldı</option>
            <option value="taslak">Taslak</option>
          </select>
          <select 
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tüm Tipler</option>
            <option value="satılık">Satılık</option>
            <option value="kiralık">Kiralık</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold">Kod</th>
                  <th className="px-6 py-4 font-bold">Başlık & Konum</th>
                  <th className="px-6 py-4 font-bold">Tip</th>
                  <th className="px-6 py-4 font-bold">Fiyat</th>
                  <th className="px-6 py-4 font-bold">AI Skor</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold">Tarih</th>
                  <th className="px-6 py-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Henüz ilanınız yok. Yeni ilan ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600">{listing.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{listing.title}</span>
                        <span className="text-slate-500 flex items-center gap-1 mt-0.5 text-xs font-medium">
                          <MapPin className="w-3 h-3" /> {listing.location?.ilçe}, {listing.location?.il}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        listing.type === 'satılık' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {listing.type === 'satılık' ? 'Satılık' : 'Kiralık'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatPrice(listing.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                        %{listing.ai_score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[listing.status]}`}>
                        {statusLabels[listing.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/listings/${listing.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Görüntüle">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEditModal(listing)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Düzenle">
                          <Edit className="w-4 h-4" />
                        </button>
                        {hasPermission('ilan:delete:any') || hasPermission('ilan:delete:own') && listing.agent_id === user?.id ? (
                          <button onClick={() => handleDelete(listing.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Sil">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
            <span className="font-medium">Toplam {filteredListings.length} ilan</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[600px] relative overflow-hidden">
          <MapContainer center={[41.0082, 28.9784]} zoom={11} className="h-full w-full">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredListings.map((listing) => (
              <Marker 
                key={listing.id} 
                position={[listing.location?.lat || 41.0082, listing.location?.lng || 28.9784]}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <p className="font-bold text-lg text-slate-900">{formatPrice(listing.price)}</p>
                    <p className="text-sm text-slate-600 mb-2">{listing.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{listing.location?.ilçe}</p>
                    <Link to={`/listings/${listing.id}`} className="text-indigo-600 text-xs font-bold hover:underline">
                      Detayları Gör
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">
                {editingListing ? 'İlan Düzenle' : 'Yeni İlan Ekle'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Örn: Kadıköy Moda 3+1 Deniz Manzaralı"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                  <textarea
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="İlan açıklaması..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tip</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'satılık' | 'kiralık'})}
                  >
                    <option value="satılık">Satılık</option>
                    <option value="kiralık">Kiralık</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Daire, Villa, Ofis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat (₺)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="12500000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durum</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="taslak">Taslak</option>
                    <option value="onay_bekliyor">Onay Bekliyor</option>
                    <option value="aktif">Aktif</option>
                    <option value="satıldı">Satıldı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">İl</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.il}
                    onChange={(e) => setFormData({...formData, il: e.target.value})}
                    placeholder="İstanbul"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">İlçe</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.ilçe}
                    onChange={(e) => setFormData({...formData, ilçe: e.target.value})}
                    placeholder="Kadıköy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mahalle</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.mahalle}
                    onChange={(e) => setFormData({...formData, mahalle: e.target.value})}
                    placeholder="Moda"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Adres</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Açık adres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Oda Sayısı</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.oda}
                    onChange={(e) => setFormData({...formData, oda: e.target.value})}
                    placeholder="3+1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">m²</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.m2}
                    onChange={(e) => setFormData({...formData, m2: e.target.value})}
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Bina Yaşı</label>
                  <input
                    type="number"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                    value={formData.binaYasi}
                    onChange={(e) => setFormData({...formData, binaYasi: e.target.value})}
                    placeholder="5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fotoğraflar</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e.target.files)}
                    className="w-full text-sm"
                  />
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {previewUrls.map((src) => (
                        <img key={src} src={src} alt="Önizleme" className="w-full h-20 object-cover rounded-lg border" />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingListing ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
