import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  CheckCircle2,
  Clock,
  FileSignature,
  X
} from 'lucide-react';
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';
import { contractTemplates } from '../lib/contractTemplates';
import { useAuth } from '../context/AuthContext';

interface Contract {
  id: string;
  title: string;
  client_name?: string | null;
  type?: 'satış' | 'kiralama' | 'yetki' | null;
  status?: 'taslak' | 'imza_bekliyor' | 'imzalandı' | null;
  contract_date?: string | null;
  amount?: number | null;
  currency?: string | null;
}

const statusColors: Record<string, string> = {
  'İmzalandı': 'bg-emerald-100 text-emerald-700',
  'İmza Bekliyor': 'bg-amber-100 text-amber-700',
  'Taslak': 'bg-gray-100 text-gray-700',
};

export default function Contracts() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [tenantSettings, setTenantSettings] = useState<any>({});
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    type: 'satış' as 'satış' | 'kiralama' | 'yetki',
    status: 'taslak' as 'taslak' | 'imza_bekliyor' | 'imzalandı',
    contract_date: '',
    amount: '',
  });

  const templates: Record<string, string> = {
    satış: tenantSettings.contract_template_sale || contractTemplates.satış,
    kiralama: tenantSettings.contract_template_rent || contractTemplates.kiralama,
    yetki: tenantSettings.contract_template_authority || contractTemplates.yetki
  };

  useEffect(() => {
    fetchContracts();
    fetchTenantSettings();
  }, [user]);

  async function fetchTenantSettings() {
    if (!user?.tenant_id) return;
    const { data } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single();
    setTenantSettings(data?.settings || {});
  }

  useEffect(() => {
    setTemplateText(templates[formData.type] || templates.satış);
  }, [formData.type, tenantSettings]);

  async function fetchContracts() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });
    if (!error) setContracts(data || []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    setSaving(true);
    const { error } = await supabase
      .from('contracts')
      .insert({
        tenant_id: user.tenant_id,
        title: formData.title,
        client_name: formData.client_name,
        type: formData.type,
        status: formData.status,
        contract_date: formData.contract_date || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        notes: templateText,
        created_by: user.id
      });

    setSaving(false);
    if (error) {
      setNotice('Sözleşme kaydedilemedi. Alanları kontrol edin.');
      return;
    }
    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', client_name: '', type: 'satış', status: 'taslak', contract_date: '', amount: '' });
      setTemplateText(templates.satış);
      fetchContracts();
    }
  }

  async function sendToSign(id: string) {
    await supabase.from('contracts').update({ status: 'imza_bekliyor' }).eq('id', id);
    fetchContracts();
  }

  async function remind(id: string) {
    await supabase.from('contracts').update({ status: 'imza_bekliyor' }).eq('id', id);
    setNotice('Hatırlatma gönderildi.');
  }

  const handleDownloadPDF = (contract: any) => {
    const doc = new jsPDF();
    const companyName = tenantSettings.company_name || user?.tenant_name || 'EmlakCRM Pro';
    const companyAddress = tenantSettings.company_address || '';
    const companyPhone = tenantSettings.company_phone || '';
    const companyEmail = tenantSettings.company_email || '';
    const companyTaxOffice = tenantSettings.company_tax_office || '';
    const companyTaxNumber = tenantSettings.company_tax_number || '';
    const footerNote = tenantSettings.contract_footer_note || 'Bu sözleşme EmlakCRM Pro tarafından hazırlanmıştır.';
    const logoUrl = tenantSettings.logo_url || '';
    
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text('Sözleşme', 20, 18);
    
    if (logoUrl) {
      try {
        const img = new Image();
        img.src = logoUrl;
        doc.addImage(img, 'PNG', 150, 12, 40, 20);
      } catch {
        // ignore logo errors
      }
    }

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(companyName, 20, 28);
    if (companyAddress) doc.text(companyAddress, 20, 34);
    if (companyPhone) doc.text(`Tel: ${companyPhone}`, 20, 40);
    if (companyEmail) doc.text(`E-posta: ${companyEmail}`, 20, 46);
    if (companyTaxOffice || companyTaxNumber) {
      doc.text(`Vergi: ${companyTaxOffice} ${companyTaxNumber}`.trim(), 20, 52);
    }
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    
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

    doc.text(`Sözleşme Adı: ${sanitize(contract.title)}`, 20, 64);
    doc.text(`Müşteri: ${sanitize(contract.client_name || '-')}`, 20, 74);
    doc.text(`Tip: ${sanitize(contract.type || '-')}`, 20, 84);
    doc.text(`Durum: ${sanitize(contract.status || '-')}`, 20, 94);
    doc.text(`Tarih: ${contract.contract_date || '-'}`, 20, 104);
    doc.text(`Tutar: ${contract.amount ? contract.amount.toLocaleString('tr-TR') : '-'} ${contract.currency || ''}`, 20, 114);
    if (contract.notes) {
      doc.setFontSize(10);
      const body = sanitize(contract.notes);
      const lines = doc.splitTextToSize(body, 170);
      doc.text(lines, 20, 132);
    }
    
    doc.setLineWidth(0.4);
    doc.line(20, 122, 190, 122);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitize(footerNote), 20, 285);
    
    doc.save(`${sanitize(contract.title).replace(/\s+/g, '_')}.pdf`);
  };

  const statusLabels: Record<string, string> = {
    taslak: 'Taslak',
    imza_bekliyor: 'İmza Bekliyor',
    imzalandı: 'İmzalandı'
  };

  const typeLabels: Record<string, string> = {
    satış: 'Satış',
    kiralama: 'Kiralama',
    yetki: 'Yetki Belgesi'
  };

  const filtered = contracts.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.client_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dijital Sözleşmeler</h1>
          <p className="text-gray-500 text-sm mt-1">Sözleşme ve yetki belgelerinizi dijital olarak yönetin.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Sözleşme Oluştur
        </button>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

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
        {loading ? (
          <div className="text-sm text-gray-500">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">Henüz sözleşme yok.</div>
        ) : filtered.map((contract) => (
          <div key={contract.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    contract.type === 'satış' ? 'bg-blue-100 text-blue-600' : 
                    contract.type === 'kiralama' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">{contract.type ? typeLabels[contract.type] : '-'}</span>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{contract.title}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Müşteri:</span>
                    <span className="font-medium text-gray-900">{contract.client_name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tutar:</span>
                    <span className="font-medium text-gray-900">{contract.amount ? contract.amount.toLocaleString('tr-TR') : '-'} {contract.currency || ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tarih:</span>
                    <span className="font-medium text-gray-900">{contract.contract_date || '-'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors[statusLabels[contract.status || 'taslak']] || statusColors['Taslak']}`}>
                  {contract.status === 'imzalandı' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   contract.status === 'imza_bekliyor' ? <Clock className="w-3.5 h-3.5" /> : <FileSignature className="w-3.5 h-3.5" />}
                  {statusLabels[contract.status || 'taslak']}
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
              {contract.status === 'imza_bekliyor' && (
                <button onClick={() => remind(contract.id)} className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  Hatırlat
                </button>
              )}
              {contract.status === 'taslak' && (
                <button onClick={() => sendToSign(contract.id)} className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                  İmzaya Gönder
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Yeni Sözleşme</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Müşteri</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tip</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500">
                    <option value="satış">Satış</option>
                    <option value="kiralama">Kiralama</option>
                    <option value="yetki">Yetki Belgesi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Durum</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500">
                    <option value="taslak">Taslak</option>
                    <option value="imza_bekliyor">İmza Bekliyor</option>
                    <option value="imzalandı">İmzalandı</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sözleşme Metni (Düzenlenebilir)</label>
                <textarea
                  rows={8}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tutar (₺)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">İptal</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
