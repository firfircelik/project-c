import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Home, Tag, Calendar, CheckCircle2,
  Share2, Edit, Trash2, BedDouble, Bath, Maximize,
  Sparkles, Phone, Mail, X, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
  description?: string | null;
  type: 'satılık' | 'kiralık';
  category?: string | null;
  price?: number | null;
  currency?: string | null;
  location?: { il?: string; ilçe?: string; mahalle?: string; lat?: number; lng?: number };
  features?: { oda?: string; m2?: number; binaYasi?: number };
  media?: { url?: string; path?: string; title?: string }[];
  status: 'taslak' | 'onay_bekliyor' | 'aktif' | 'satıldı';
  created_at: string;
  agent_id?: string | null;
}

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
  reasons: string[];
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [matching, setMatching] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    price: '',
    status: 'taslak' as Listing['status'],
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id, user]);

  useEffect(() => {
    resolveMediaUrls();
  }, [listing]);

  useEffect(() => {
    if (!listing) return;
    setEditData({
      title: listing.title || '',
      price: listing.price ? String(listing.price) : '',
      status: listing.status,
      description: listing.description || ''
    });
  }, [listing]);

  useEffect(() => {
    if (!listing || !user?.tenant_id) return;
    fetchMatches();
  }, [listing, user]);

  useEffect(() => {
    if (!listing) return;
    setEditData({
      title: listing.title || '',
      price: listing.price ? String(listing.price) : '',
      status: listing.status,
      description: listing.description || ''
    });
  }, [listing]);

  async function fetchListing() {
    if (!id || !user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (!error && data) {
      setListing(data as Listing);
    }
    setLoading(false);
  }

  function parseRoomCount(value?: string | null) {
    if (!value) return null;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  function computeMatchScore(customer: any): MatchCandidate {
    const reasons: string[] = [];
    let score = 0;

    const prefs = customer.preferences || {};
    const listingCity = (listing?.location?.il || '').toLowerCase();
    const listingDistrict = (listing?.location?.ilçe || '').toLowerCase();
    const listingNeighborhood = (listing?.location?.mahalle || '').toLowerCase();
    const listingType = (listing?.category || '').toLowerCase();
    const listingRooms = parseRoomCount(listing?.features?.oda);
    const listingArea = listing?.features?.m2 || 0;

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

    const minBudget = customer.budget_min ? Number(customer.budget_min) : null;
    const maxBudget = customer.budget_max ? Number(customer.budget_max) : null;
    const price = listing?.price ? Number(listing.price) : null;
    if (price && (minBudget || maxBudget)) {
      if ((minBudget === null || price >= minBudget) && (maxBudget === null || price <= maxBudget)) {
        score += 20;
        reasons.push('Bütçe uyumu');
      }
    }

    return {
      id: customer.id,
      name: customer.name,
      score: Math.min(score, 100),
      reasons: reasons.length ? reasons : ['Genel uyum'],
    };
  }

  async function fetchMatches() {
    if (!user?.tenant_id || !listing) return;
    setMatching(true);
    const { data } = await supabase
      .from('customers')
      .select('id, name, budget_min, budget_max, preferences')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .limit(30);

    const candidates = (data || []).map(computeMatchScore);
    const sorted = candidates.sort((a, b) => b.score - a.score).slice(0, 5);
    setMatches(sorted);

    if (sorted.length > 0) {
      await supabase.from('match_scores').upsert(
        sorted.map((match) => ({
          tenant_id: user.tenant_id,
          listing_id: listing.id,
          customer_id: match.id,
          score: match.score,
          reasons: match.reasons
        }))
      );
    }
    setMatching(false);
  }

  const formattedPrice = useMemo(() => {
    if (!listing?.price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(listing.price);
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">İlan bulunamadı.</p>
      </div>
    );
  }

  const coords: [number, number] = [
    listing.location?.lat || 41.0082,
    listing.location?.lng || 28.9784
  ];

  const images = imageUrls;

  async function resolveMediaUrls() {
    if (!listing?.media) {
      setImageUrls([]);
      return;
    }

    const urls: string[] = [];
    for (const item of listing.media) {
      if (item.url) {
        urls.push(item.url);
        continue;
      }
      if (item.path) {
        const { data } = await supabase.storage
          .from('listing-media')
          .createSignedUrl(item.path, 60 * 60);
        if (data?.signedUrl) urls.push(data.signedUrl);
      }
    }
    setImageUrls(urls);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !user?.tenant_id || !listing) return;
    setUploading(true);

    const uploaded: { path: string; title?: string }[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.tenant_id}/${listing.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listing-media').upload(path, file, { upsert: true });
      if (!error) {
        uploaded.push({ path, title: file.name });
      }
    }

    const merged = [...(listing.media || []), ...uploaded];
    await supabase.from('listings').update({ media: merged }).eq('id', listing.id);
    await fetchListing();
    setUploading(false);
  }

  async function publishToPortals() {
    if (!listing || !user?.tenant_id) return;
    setPublishing(true);
    const { data } = await supabase
      .from('portal_credentials')
      .select('portal, integration_type, api_key, api_secret, username, password, feed_url, is_active')
      .eq('tenant_id', user.tenant_id)
      .eq('is_active', true);

    const credentials = data || [];
    const enabled = credentials.filter((c: any) => {
      if (c.integration_type === 'api') return !!c.api_key;
      if (c.integration_type === 'feed') return !!c.feed_url;
      if (c.integration_type === 'ftp') return !!c.username && !!c.password && !!c.feed_url;
      return false;
    });

    if (enabled.length === 0) {
      setPublishing(false);
      setNotice('Portal bağlantısı bulunamadı. Portal Ayarları sayfasından API/Feed bilgilerini girin.');
      return;
    }

    const rows = enabled.map((c: any) => ({
      tenant_id: user.tenant_id,
      listing_id: listing.id,
      portal: c.portal,
      status: 'queued'
    }));
    await supabase.from('portal_publish_jobs').insert(rows);
    setPublishing(false);
    setNotice('İlan portallara gönderim kuyruğuna alındı.');
  }

  async function handleEditSave() {
    if (!listing) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from('listings')
      .update({
        title: editData.title,
        price: editData.price ? parseFloat(editData.price) : null,
        status: editData.status,
        description: editData.description
      })
      .eq('id', listing.id);
    setSavingEdit(false);
    if (!error) {
      setIsEditModalOpen(false);
      setNotice('İlan güncellendi.');
      fetchListing();
    }
  }

  async function removeMedia(index: number) {
    if (!listing) return;
    const updated = (listing.media || []).filter((_, i) => i !== index);
    await supabase.from('listings').update({ media: updated }).eq('id', listing.id);
    await fetchListing();
  }

  async function moveMedia(from: number, to: number) {
    if (!listing) return;
    const arr = [...(listing.media || [])];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    await supabase.from('listings').update({ media: arr }).eq('id', listing.id);
    await fetchListing();
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/listings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">{listing.code}</span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {listing.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{listing.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm" title="Paylaş">
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Düzenle"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button className="p-2 bg-white border border-red-200 rounded-xl hover:bg-red-50 text-red-600 transition-colors shadow-sm" title="Sil">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-[400px] rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-slate-50 flex items-center justify-center">
          {images[0] ? (
            <img src={images[0]} alt="Ana Görsel" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-400 text-sm">Fotoğraf yüklenmedi</div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 h-[400px]">
          <div className="h-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-slate-50 flex items-center justify-center">
            {images[1] ? (
              <img src={images[1]} alt="Görsel 2" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-sm">Görsel</div>
            )}
          </div>
          <div className="h-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-slate-50 flex items-center justify-center relative group">
            {images[2] ? (
              <img src={images[2]} alt="Görsel 3" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 text-sm">Görsel</div>
            )}
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center cursor-pointer group-hover:bg-slate-900/50 transition-colors backdrop-blur-[2px]">
              <span className="text-white font-bold flex items-center gap-2">
                <Maximize className="w-5 h-5" /> Tüm Fotoğraflar ({images.length})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold cursor-pointer">
            {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
            <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>
          <span className="text-xs text-slate-500">JPG/PNG</span>
        </div>
        <button
          onClick={publishToPortals}
          disabled={publishing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {publishing ? 'Gönderiliyor...' : 'Portallara Gönder'}
        </button>
      </div>

      {listing.media && listing.media.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Medya Sıralaması</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {listing.media.map((m, idx) => (
              <div key={`${m.path || m.url}-${idx}`} className="flex items-center justify-between border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-600 truncate">{m.title || m.path || m.url || 'Medya'}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => moveMedia(idx, Math.max(idx - 1, 0))} className="text-xs px-2 py-1 rounded bg-slate-100">Yukarı</button>
                  <button onClick={() => moveMedia(idx, Math.min(idx + 1, (listing.media?.length || 1) - 1))} className="text-xs px-2 py-1 rounded bg-slate-100">Aşağı</button>
                  <button onClick={() => removeMedia(idx)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI İlan Özeti</h3>
            </div>
            <p className="text-sm text-indigo-900/80 leading-relaxed relative z-10 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/50">
              AI modülü hazır. Özet ve öneriler müşteri detayında kullanılabilir.
            </p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">{formattedPrice}</p>
                <p className="text-slate-500 flex items-center gap-1.5 mt-3 font-medium">
                  <MapPin className="w-4 h-4" /> {listing.location?.ilçe || '-'}, {listing.location?.il || '-'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl font-bold text-sm mb-2 border border-indigo-100">
                  {listing.type === 'satılık' ? 'Satılık' : 'Kiralık'}
                </span>
                <p className="text-sm text-slate-500 font-medium">İlan Tarihi: {new Date(listing.created_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-slate-100">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <BedDouble className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features?.oda || '-'}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Oda Sayısı</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Bath className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">-</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Banyo</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Maximize className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features?.m2 || '-'}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Brüt Alan</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Home className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features?.binaYasi || '-'}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Bina Yaşı</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Açıklama</h3>
              <p className="text-slate-600 leading-relaxed">
                {listing.description || 'Açıklama girilmemiş.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Konum</h3>
            <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative z-0">
              <MapContainer center={coords} zoom={14} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coords}>
                  <Popup>
                    <div className="text-sm font-bold">{listing.title}</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Eşleştirme</h3>
            </div>
            <p className="text-sm text-indigo-800 mb-6 relative z-10 font-medium">
              {matching ? 'Eşleşmeler hazırlanıyor...' : 'Eşleşmeler bu ilanın kriterlerine göre listelenir.'}
            </p>
            {matches.length === 0 ? (
              <div className="text-xs text-indigo-900/70 bg-white/60 border border-indigo-100/50 rounded-xl px-3 py-2">
                Uygun müşteri bulunamadı.
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.id} className="bg-white/70 border border-indigo-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-indigo-900">{match.name}</span>
                      <span className="text-xs font-bold text-indigo-700">%{match.score}</span>
                    </div>
                    <div className="text-[11px] text-indigo-800/80">
                      {match.reasons.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Sorumlu Danışman</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200 shadow-sm">
                {user?.initials || 'D'}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg tracking-tight">{user?.full_name || 'Danışman'}</p>
                <p className="text-sm text-slate-500 font-medium">{user?.title || 'Danışman'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors border border-slate-200">
                <Phone className="w-4 h-4" /> Ara
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors border border-slate-200">
                <Mail className="w-4 h-4" /> E-posta Gönder
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">İlanı Düzenle</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">İlan Başlığı</label>
                <input type="text" value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat</label>
                  <input type="number" value={editData.price} onChange={(e) => setEditData({ ...editData, price: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durum</label>
                  <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as Listing['status'] })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="aktif">Aktif</option>
                    <option value="onay_bekliyor">Onay Bekliyor</option>
                    <option value="satıldı">Satıldı</option>
                    <option value="taslak">Taslak</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                <textarea rows={4} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                İptal
              </button>
              <button onClick={handleEditSave} disabled={savingEdit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50">
                {savingEdit ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
