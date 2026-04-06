import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Home, Tag, Calendar, CheckCircle2, 
  Share2, Edit, Trash2, BedDouble, Bath, Maximize, 
  Sparkles, Phone, Mail, X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default function ListingDetail() {
  const { id } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Mock data for the specific listing
  const listing = {
    id: id || '1',
    code: 'ILN-1001',
    title: 'Kadıköy Moda 3+1 Deniz Manzaralı Lüks Daire',
    type: 'Satılık',
    category: 'Daire',
    price: '12.500.000 ₺',
    location: 'Caferağa Mah. Moda Cad. No:12, Kadıköy, İstanbul',
    coords: [40.9833, 29.0250] as [number, number],
    status: 'Aktif',
    date: '2026-01-25',
    features: {
      rooms: '3+1',
      bathrooms: '2',
      area: '145 m²',
      age: '5',
      floor: '4/5',
      heating: 'Doğalgaz (Kombi)'
    },
    description: 'Moda sahilinin hemen arkasında, kapanmaz deniz manzaralı, ebeveyn banyolu, kapalı otoparklı lüks daire. Toplu taşımaya ve sosyal alanlara yürüme mesafesinde.',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687931-cebf0746e424?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=800&q=80'
    ]
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/listings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
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

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 h-[400px] rounded-3xl overflow-hidden shadow-sm border border-slate-200/50">
          <img src={listing.images[0]} alt="Ana Görsel" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 h-[400px]">
          <div className="h-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/50">
            <img src={listing.images[1]} alt="Görsel 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="h-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 relative group">
            <img src={listing.images[2]} alt="Görsel 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center cursor-pointer group-hover:bg-slate-900/50 transition-colors backdrop-blur-[2px]">
              <span className="text-white font-bold flex items-center gap-2">
                <Maximize className="w-5 h-5" /> Tüm Fotoğraflar (12)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI İlan Özeti</h3>
            </div>
            <p className="text-sm text-indigo-900/80 leading-relaxed relative z-10 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/50">
              Bu ilan, Moda sahilinde yüksek talep gören bir lokasyonda yer almaktadır. Kapanmaz deniz manzarası ve ebeveyn banyosu gibi premium özellikleri sayesinde benzer ilanlara göre %15 daha hızlı satılma potansiyeline sahiptir. Hedef kitle olarak yüksek bütçeli aileler ve yatırımcılar öne çıkmaktadır.
            </p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-4xl font-bold text-slate-900 tracking-tight">{listing.price}</p>
                <p className="text-slate-500 flex items-center gap-1.5 mt-3 font-medium">
                  <MapPin className="w-4 h-4" /> {listing.location}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl font-bold text-sm mb-2 border border-indigo-100">
                  {listing.type}
                </span>
                <p className="text-sm text-slate-500 font-medium">İlan Tarihi: {listing.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y border-slate-100">
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <BedDouble className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features.rooms}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Oda Sayısı</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Bath className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features.bathrooms}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Banyo</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Maximize className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features.area}</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Brüt Alan</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Home className="w-6 h-6 text-slate-400 mb-3" />
                <span className="text-base font-bold text-slate-900">{listing.features.age} Yaşında</span>
                <span className="text-xs text-slate-500 font-medium mt-1">Bina Yaşı</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Açıklama</h3>
              <p className="text-slate-600 leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Map Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Konum</h3>
            <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 relative z-0">
              <MapContainer center={listing.coords} zoom={14} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={listing.coords}>
                  <Popup>
                    <div className="text-sm font-bold">{listing.title}</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Matching Box */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Eşleştirme</h3>
            </div>
            <p className="text-sm text-indigo-800 mb-6 relative z-10 font-medium">
              Bu ilan için portföyünüzde <strong className="text-indigo-900">3 yüksek uyumlu</strong> müşteri bulundu.
            </p>
            <div className="space-y-3 mb-6 relative z-10">
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sm font-bold text-slate-900">Ahmet Yılmaz</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Bütçe: 10M - 15M ₺</p>
                </div>
                <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">%95</span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <p className="text-sm font-bold text-slate-900">Zeynep Kaya</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Bütçe: 12M - 14M ₺</p>
                </div>
                <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">%88</span>
              </div>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-200 relative z-10">
              Tüm Eşleşmeleri Gör
            </button>
          </div>

          {/* Agent Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Sorumlu Danışman</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200 shadow-sm">
                BY
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg tracking-tight">Batuhan Yağlu</p>
                <p className="text-sm text-slate-500 font-medium">Şube Müdürü</p>
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

      {/* Edit Modal */}
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
                <input type="text" defaultValue={listing.title} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fiyat</label>
                  <input type="text" defaultValue={listing.price} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durum</label>
                  <select defaultValue={listing.status} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>Aktif</option>
                    <option>Pasif</option>
                    <option>Satıldı</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                <textarea rows={4} defaultValue={listing.description} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
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
