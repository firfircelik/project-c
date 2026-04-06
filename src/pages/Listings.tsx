import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  MapPin,
  Home,
  Tag,
  Edit,
  Trash2,
  Eye,
  Map as MapIcon,
  List,
  Sparkles
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

const mockListings = [
  { id: '1', code: 'ILN-1001', title: 'Kadıköy Moda 3+1 Deniz Manzaralı', type: 'Satılık', category: 'Daire', price: '12.500.000 ₺', location: 'Kadıköy, İstanbul', status: 'Aktif', date: '2026-01-25', coords: [40.9833, 29.0250] as [number, number], agent: 'Batuhan Y.', aiScore: 95 },
  { id: '2', code: 'ILN-1002', title: 'Beşiktaş Merkez 2+1 Eşyalı', type: 'Kiralık', category: 'Daire', price: '45.000 ₺', location: 'Beşiktaş, İstanbul', status: 'Onay Bekliyor', date: '2026-01-26', coords: [41.0422, 29.0083] as [number, number], agent: 'Ayşe K.', aiScore: 82 },
  { id: '3', code: 'ILN-1003', title: 'Ataşehir Finans Merkezi Yakını Ofis', type: 'Kiralık', category: 'Ticari', price: '85.000 ₺', location: 'Ataşehir, İstanbul', status: 'Aktif', date: '2026-01-20', coords: [40.9975, 29.1166] as [number, number], agent: 'Batuhan Y.', aiScore: 88 },
  { id: '4', code: 'ILN-1004', title: 'Bodrum Yalıkavak Özel Havuzlu Villa', type: 'Satılık', category: 'Villa', price: '45.000.000 ₺', location: 'Bodrum, Muğla', status: 'Satıldı', date: '2026-01-15', coords: [37.1064, 27.2917] as [number, number], agent: 'Mehmet S.', aiScore: 98 },
  { id: '5', code: 'ILN-1005', title: 'Şişli Bomonti Residence 1+1', type: 'Satılık', category: 'Daire', price: '8.200.000 ₺', location: 'Şişli, İstanbul', status: 'Taslak', date: '2026-01-27', coords: [41.0600, 28.9875] as [number, number], agent: 'Ayşe K.', aiScore: 75 },
];

const statusColors: Record<string, string> = {
  'Aktif': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Onay Bekliyor': 'bg-amber-100 text-amber-700 border-amber-200',
  'Satıldı': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Taslak': 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <div className="space-y-6">
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
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni İlan Ekle
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="İlan no, başlık veya konum ara..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow">
            <option value="">Tüm Durumlar</option>
            <option value="Aktif">Aktif</option>
            <option value="Onay Bekliyor">Onay Bekliyor</option>
            <option value="Satıldı">Satıldı</option>
            <option value="Taslak">Taslak</option>
          </select>
          <button className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 bg-white transition-colors">
            <Filter className="w-4 h-4" />
            Filtrele
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold">İlan Kodu</th>
                  <th className="px-6 py-4 font-bold">Başlık & Konum</th>
                  <th className="px-6 py-4 font-bold">Kategori</th>
                  <th className="px-6 py-4 font-bold">Fiyat</th>
                  <th className="px-6 py-4 font-bold">Danışman</th>
                  <th className="px-6 py-4 font-bold">AI Skoru</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold">Tarih</th>
                  <th className="px-6 py-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockListings.filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.code.toLowerCase().includes(searchTerm.toLowerCase())).map((listing) => (
                  <tr key={listing.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/listings/${listing.id}`} className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">{listing.code}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link to={`/listings/${listing.id}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">{listing.title}</Link>
                        <span className="text-slate-500 flex items-center gap-1 mt-0.5 text-xs font-medium">
                          <MapPin className="w-3 h-3" /> {listing.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium">{listing.type}</span>
                        <span className="text-slate-500 text-xs">{listing.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {listing.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {listing.agent.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{listing.agent}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                        %{listing.aiScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[listing.status]}`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                      {listing.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="AI Eşleştir">
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <Link to={`/listings/${listing.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Görüntüle">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Düzenle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
            <span className="font-medium">Toplam {mockListings.length} ilan gösteriliyor</span>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white font-medium disabled:opacity-50 transition-colors">Önceki</button>
              <button className="px-3 py-1.5 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-700 font-bold">1</button>
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white font-medium disabled:opacity-50 transition-colors">Sonraki</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-[600px] relative overflow-hidden z-0">
          <MapContainer center={[41.0082, 28.9784]} zoom={11} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mockListings.map((listing) => (
              <Marker key={listing.id} position={listing.coords}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm text-slate-900 mb-1">{listing.price}</p>
                    <p className="text-xs text-slate-600 mb-2">{listing.title}</p>
                    <Link to={`/listings/${listing.id}`} className="text-indigo-600 text-xs font-bold hover:underline">
                      Detayları Gör
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200 z-[400] flex flex-col gap-1">
            <button className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors" title="Yakınımda Ara">
              <MapPin className="w-5 h-5" />
            </button>
            <button className="p-2.5 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors" title="AI Isı Haritası">
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
