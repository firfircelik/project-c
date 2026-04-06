import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  CheckCircle2,
  Clock,
  FileSignature
} from 'lucide-react';
import jsPDF from 'jspdf';

const mockContracts = [
  { id: '1', title: 'Kadıköy Moda Satış Sözleşmesi', client: 'Ayşe Yılmaz', type: 'Satış', status: 'İmzalandı', date: '2026-01-25', amount: '12.500.000 ₺' },
  { id: '2', title: 'Beşiktaş Ofis Kiralama', client: 'Tech Corp A.Ş.', type: 'Kiralama', status: 'İmza Bekliyor', date: '2026-01-27', amount: '85.000 ₺ / Ay' },
  { id: '3', title: 'Ataşehir Dükkan Yetki Belgesi', client: 'Ali Veli', type: 'Yetki Belgesi', status: 'Taslak', date: '2026-01-28', amount: '-' },
];

const statusColors: Record<string, string> = {
  'İmzalandı': 'bg-emerald-100 text-emerald-700',
  'İmza Bekliyor': 'bg-amber-100 text-amber-700',
  'Taslak': 'bg-gray-100 text-gray-700',
};

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDownloadPDF = (contract: any) => {
    const doc = new jsPDF();
    
    // Add a simple header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text('Sozlesme Detayi', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    
    // Replace Turkish characters for basic jsPDF font compatibility
    const sanitize = (text: string) => {
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    doc.text(`Sozlesme Adi: ${sanitize(contract.title)}`, 20, 40);
    doc.text(`Musteri: ${sanitize(contract.client)}`, 20, 50);
    doc.text(`Tip: ${sanitize(contract.type)}`, 20, 60);
    doc.text(`Durum: ${sanitize(contract.status)}`, 20, 70);
    doc.text(`Tarih: ${contract.date}`, 20, 80);
    doc.text(`Tutar: ${sanitize(contract.amount)}`, 20, 90);
    
    doc.setLineWidth(0.5);
    doc.line(20, 100, 190, 100);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Bu belge EmlakCRM Pro tarafindan otomatik olarak olusturulmustur.', 20, 110);
    
    doc.save(`${sanitize(contract.title).replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dijital Sözleşmeler</h1>
          <p className="text-gray-500 text-sm mt-1">Sözleşme ve yetki belgelerinizi dijital olarak yönetin.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Sözleşme Oluştur
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Sözleşme adı veya müşteri ara..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Tüm Tipler</option>
            <option value="Satış">Satış</option>
            <option value="Kiralama">Kiralama</option>
            <option value="Yetki Belgesi">Yetki Belgesi</option>
          </select>
          <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-white">
            <Filter className="w-4 h-4" />
            Filtrele
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockContracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    contract.type === 'Satış' ? 'bg-blue-100 text-blue-600' : 
                    contract.type === 'Kiralama' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">{contract.type}</span>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{contract.title}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Müşteri:</span>
                  <span className="font-medium text-gray-900">{contract.client}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tutar:</span>
                  <span className="font-medium text-gray-900">{contract.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tarih:</span>
                  <span className="font-medium text-gray-900">{contract.date}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors[contract.status]}`}>
                  {contract.status === 'İmzalandı' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   contract.status === 'İmza Bekliyor' ? <Clock className="w-3.5 h-3.5" /> : <FileSignature className="w-3.5 h-3.5" />}
                  {contract.status}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <button 
                onClick={() => handleDownloadPDF(contract)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF İndir
              </button>
              {contract.status === 'İmza Bekliyor' && (
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  Hatırlat
                </button>
              )}
              {contract.status === 'Taslak' && (
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  İmzaya Gönder
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
