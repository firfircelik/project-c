import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, Calendar, MapPin, 
  Sparkles, Edit, Trash2, MessageSquare, Clock,
  CheckCircle2, FileText, X
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function CustomerDetail() {
  const { id } = useParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notes, setNotes] = useState('<p>Deniz manzaralı, en az 3+1, yüksek katlı daire arıyor. Krediye uygun olması şart.</p>');

  // Mock data
  const customer = {
    id: id || '1',
    name: 'Ayşe Yılmaz',
    phone: '+90 532 123 4567',
    email: 'ayse@example.com',
    budget: '10M - 15M ₺',
    type: 'Alıcı',
    temp: 'hot',
    location: 'Kadıköy, İstanbul',
    notes: 'Deniz manzaralı, en az 3+1, yüksek katlı daire arıyor. Krediye uygun olması şart.',
    aiScore: 92,
    createdAt: '15.01.2026',
    lastContact: 'Bugün, 14:30'
  };

  const timeline = [
    { id: 1, type: 'call', title: 'Telefon Görüşmesi', desc: 'Fiyat esnekliği soruldu, bütçe 15M\'ye kadar çıkabilir.', date: 'Bugün, 14:30', user: 'Batuhan Y.' },
    { id: 2, type: 'showing', title: 'Ev Gösterimi', desc: 'ILN-1001 gösterildi. Çok beğendi, eşine de gösterecek.', date: '22.01.2026', user: 'Batuhan Y.' },
    { id: 3, type: 'ai', title: 'AI Önerisi', desc: 'ILN-1001 (%95 uyum) otomatik WhatsApp\'tan gönderildi.', date: '20.01.2026', user: 'Sistem' },
    { id: 4, type: 'note', title: 'Müşteri Kaydı', desc: 'Sistem üzerinden yeni kayıt oluşturuldu.', date: '15.01.2026', user: 'Batuhan Y.' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/customers" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sıcak Müşteri
              </span>
              <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                {customer.type}
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
          <button className="p-2 bg-white border border-red-200 rounded-xl hover:bg-red-50 text-red-600 transition-colors shadow-sm" title="Sil">
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
                <span className="font-bold">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-bold">{customer.email}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-bold">{customer.location}</span>
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
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{customer.budget}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">Özel Notlar</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {customer.notes}
              </p>
            </div>
          </div>

          {/* AI Matches & Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 md:p-8 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            {/* AI Summary */}
            <div className="mb-8 relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900 tracking-tight">AI Müşteri Özeti</h3>
              </div>
              <p className="text-sm text-indigo-900/80 leading-relaxed bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/50">
                Müşteri yüksek bütçeli (15M ₺'ye kadar) ve deniz manzaralı geniş daire arayışında. Kredi kullanımına uygun seçenekler öncelikli. Son görüşmede fiyat esnekliği sinyali alındı, hızlı kapanma potansiyeli yüksek.
              </p>
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-indigo-900 tracking-tight">Önerilen İlanlar</h3>
              </div>
              <span className="bg-indigo-200/50 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-200">3 İlan</span>
            </div>
            <div className="space-y-3 relative z-10">
              <Link to="/listings/1" className="block bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-all hover:border-indigo-300">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">Kadıköy Moda 3+1</p>
                  <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-lg">%95</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">12.500.000 ₺</p>
              </Link>
              <Link to="/listings/5" className="block bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-indigo-100 hover:shadow-md transition-all hover:border-indigo-300">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">Şişli Bomonti 1+1</p>
                  <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-lg">%82</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">8.200.000 ₺</p>
              </Link>
            </div>
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
              <ReactQuill theme="snow" value={notes} onChange={setNotes} className="h-48 mb-12" />
            </div>
            <div className="flex justify-end">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-indigo-200">
                Notu Kaydet
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Etkileşim Geçmişi</h3>
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                    item.type === 'call' ? 'bg-indigo-500' :
                    item.type === 'showing' ? 'bg-emerald-500' :
                    item.type === 'ai' ? 'bg-purple-500' : 'bg-slate-400'
                  }`} />
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100">
                        <Clock className="w-3.5 h-3.5" /> {item.date}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{item.desc}</p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700 border border-slate-300">
                        {item.user.charAt(0)}
                      </div>
                      {item.user}
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
                <input type="text" defaultValue={customer.name} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label>
                  <input type="text" defaultValue={customer.phone} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                  <input type="email" defaultValue={customer.email} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri Tipi</label>
                  <select defaultValue={customer.type} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>Alıcı</option>
                    <option>Satıcı</option>
                    <option>Kiracı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sıcaklık</label>
                  <select defaultValue={customer.temp} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="hot">Sıcak</option>
                    <option value="warm">Ilık</option>
                    <option value="cold">Soğuk</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bütçe Aralığı</label>
                <input type="text" defaultValue={customer.budget} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Özel Notlar</label>
                <textarea rows={3} defaultValue={customer.notes} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
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
