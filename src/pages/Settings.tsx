import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { contractTemplates } from '../lib/contractTemplates';

interface TenantSettings {
  logo_url?: string;
  logo_path?: string;
  company_phone?: string;
  company_email?: string;
  company_name?: string;
  company_address?: string;
  company_tax_office?: string;
  company_tax_number?: string;
  contract_city?: string;
  contract_authorized_name?: string;
  contract_authorized_title?: string;
  contract_bank_iban?: string;
  contract_bank_name?: string;
  contract_footer_note?: string;
  contract_template_sale?: string;
  contract_template_rent?: string;
  contract_template_authority?: string;
  commission_sale_rate?: string;
  commission_rent_rate?: string;
}

export default function Settings() {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [formData, setFormData] = useState<TenantSettings>({
    logo_url: '',
    logo_path: '',
    company_name: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    company_tax_office: '',
    company_tax_number: '',
    contract_city: 'İstanbul',
    contract_authorized_name: '',
    contract_authorized_title: '',
    contract_bank_iban: '',
    contract_bank_name: '',
    contract_footer_note: 'Bu sözleşme EmlakCRM Pro tarafından hazırlanmıştır.',
    contract_template_sale: contractTemplates.satış,
    contract_template_rent: contractTemplates.kiralama,
    contract_template_authority: contractTemplates.yetki,
    commission_sale_rate: '2',
    commission_rent_rate: '10'
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  async function fetchSettings() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single();
    const settings = (data?.settings || {}) as TenantSettings;
    setFormData({
      logo_url: settings.logo_url || '',
      logo_path: settings.logo_path || '',
      company_name: settings.company_name || '',
      company_phone: settings.company_phone || '',
      company_email: settings.company_email || '',
      company_address: settings.company_address || '',
      company_tax_office: settings.company_tax_office || '',
      company_tax_number: settings.company_tax_number || '',
      contract_city: settings.contract_city || 'İstanbul',
      contract_authorized_name: settings.contract_authorized_name || '',
      contract_authorized_title: settings.contract_authorized_title || '',
      contract_bank_iban: settings.contract_bank_iban || '',
      contract_bank_name: settings.contract_bank_name || '',
      contract_footer_note: settings.contract_footer_note || 'Bu sözleşme EmlakCRM Pro tarafından hazırlanmıştır.',
      contract_template_sale: settings.contract_template_sale || contractTemplates.satış,
      contract_template_rent: settings.contract_template_rent || contractTemplates.kiralama,
      contract_template_authority: settings.contract_template_authority || contractTemplates.yetki,
      commission_sale_rate: settings.commission_sale_rate || '2',
      commission_rent_rate: settings.commission_rent_rate || '10'
    });
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;
    setSaving(true);
    const { data: current } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single();

    const mergedSettings = {
      ...(current?.settings || {}),
      ...formData
    };

    const { error } = await supabase
      .from('tenants')
      .update({ settings: mergedSettings })
      .eq('id', user.tenant_id);
    setSaving(false);
    if (!error) setNotice('Ayarlar kaydedildi.');
  }

  if (!hasPermission('settings:manage')) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Ayarları</h1>
        <p className="text-slate-500 text-sm mt-1">Firma profili, komisyon ve AI ayarları.</p>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Firma Adı</label>
            <input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Firma Adresi</label>
            <input value={formData.company_address} onChange={(e) => setFormData({ ...formData, company_address: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Logo Yükle</label>
            <input type="file" accept="image/*" onChange={async (e) => {
              if (!user?.tenant_id) return;
              const file = e.target.files?.[0];
              if (!file) return;
              const ext = file.name.split('.').pop();
              const path = `${user.tenant_id}/brand/logo-${Date.now()}.${ext}`;
              const { error } = await supabase.storage.from('tenant-logos').upload(path, file, { upsert: true });
              if (!error) {
                const { data } = supabase.storage.from('tenant-logos').getPublicUrl(path);
                setFormData({ ...formData, logo_path: path, logo_url: data.publicUrl || '' });
              }
            }} className="w-full text-sm" />
            {formData.logo_url && (
              <img src={formData.logo_url} alt="Logo" className="mt-2 h-12 object-contain" />
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Firma Telefonu</label>
            <input value={formData.company_phone} onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Firma E-posta</label>
            <input value={formData.company_email} onChange={(e) => setFormData({ ...formData, company_email: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Vergi Dairesi</label>
            <input value={formData.company_tax_office} onChange={(e) => setFormData({ ...formData, company_tax_office: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Vergi No</label>
            <input value={formData.company_tax_number} onChange={(e) => setFormData({ ...formData, company_tax_number: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Satış Komisyon (%)</label>
            <input value={formData.commission_sale_rate} onChange={(e) => setFormData({ ...formData, commission_sale_rate: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Kiralama Komisyon (%)</label>
            <input value={formData.commission_rent_rate} onChange={(e) => setFormData({ ...formData, commission_rent_rate: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Sözleşme Ayarları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Sözleşme Şehri</label>
              <input value={formData.contract_city} onChange={(e) => setFormData({ ...formData, contract_city: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Yetkili Ad Soyad</label>
              <input value={formData.contract_authorized_name} onChange={(e) => setFormData({ ...formData, contract_authorized_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Yetkili Ünvan</label>
              <input value={formData.contract_authorized_title} onChange={(e) => setFormData({ ...formData, contract_authorized_title: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Banka Adı</label>
              <input value={formData.contract_bank_name} onChange={(e) => setFormData({ ...formData, contract_bank_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">IBAN</label>
              <input value={formData.contract_bank_iban} onChange={(e) => setFormData({ ...formData, contract_bank_iban: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Dipnot</label>
              <textarea value={formData.contract_footer_note} onChange={(e) => setFormData({ ...formData, contract_footer_note: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Satış Sözleşmesi Şablonu</label>
              <textarea value={formData.contract_template_sale} onChange={(e) => setFormData({ ...formData, contract_template_sale: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" rows={6} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Kiralama Sözleşmesi Şablonu</label>
              <textarea value={formData.contract_template_rent} onChange={(e) => setFormData({ ...formData, contract_template_rent: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" rows={6} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Yetki Sözleşmesi Şablonu</label>
              <textarea value={formData.contract_template_authority} onChange={(e) => setFormData({ ...formData, contract_template_authority: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" rows={6} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
