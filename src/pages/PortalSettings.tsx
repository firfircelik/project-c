import React, { useEffect, useState } from 'react';
import { Plug, CheckCircle2, XCircle, Save, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const portals = [
  { id: 'sahibinden', name: 'Sahibinden' },
  { id: 'hepsiemlak', name: 'Hepsiemlak' },
  { id: 'zingat', name: 'Zingat' },
  { id: 'emlakjet', name: 'Emlakjet' },
];

type IntegrationType = 'api' | 'feed' | 'ftp';

interface PortalCredential {
  portal: string;
  integration_type: IntegrationType;
  api_key: string;
  api_secret: string;
  endpoint_url: string;
  headers: string;
  username: string;
  password: string;
  feed_url: string;
  is_active: boolean;
  status: 'configured' | 'verified' | 'disabled';
}

export default function PortalSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Record<string, PortalCredential>>({});
  const [notice, setNotice] = useState('');
  const [feedToken, setFeedToken] = useState('');
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, [user]);

  async function fetchSettings() {
    if (!user?.tenant_id) return;
    const { data } = await supabase
      .from('portal_credentials')
      .select('*')
      .eq('tenant_id', user.tenant_id);

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single();

    setFeedToken(tenantData?.settings?.feed_token || '');

    const map: Record<string, PortalCredential> = {};
    portals.forEach((p) => {
      const found = data?.find((d: any) => d.portal === p.id);
      map[p.id] = {
        portal: p.id,
        integration_type: (found?.integration_type || 'api') as IntegrationType,
        api_key: found?.api_key || '',
        api_secret: found?.api_secret || '',
        endpoint_url: found?.endpoint_url || '',
        headers: found?.headers ? JSON.stringify(found.headers) : '',
        username: found?.username || '',
        password: found?.password || '',
        feed_url: found?.feed_url || '',
        is_active: !!found?.is_active,
        status: (found?.status || 'configured') as PortalCredential['status']
      };
    });

    setCredentials(map);
  }

  function updateField(portalId: string, field: keyof PortalCredential, value: any) {
    setCredentials((prev) => ({
      ...prev,
      [portalId]: { ...prev[portalId], [field]: value }
    }));
  }

  function parseHeaders(value: string) {
    if (!value.trim()) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async function savePortal(portalId: string) {
    if (!user?.tenant_id) return;
    const payload = credentials[portalId];
    if (!payload) return;

    const valid = payload.integration_type === 'api'
      ? !!payload.endpoint_url
      : payload.integration_type === 'feed'
      ? !!payload.feed_url
      : !!payload.username && !!payload.password && !!payload.feed_url;

    if (!valid) {
      setNotice('Seçilen entegrasyon tipine göre gerekli alanları doldurun.');
      return;
    }

    const headers = parseHeaders(payload.headers);
    if (payload.headers && !headers) {
      setNotice('Headers alanı JSON formatında olmalı.');
      return;
    }

    setSaving((prev) => ({ ...prev, [portalId]: true }));
    await supabase
      .from('portal_credentials')
      .upsert({
        tenant_id: user.tenant_id,
        portal: payload.portal,
        integration_type: payload.integration_type,
        api_key: payload.api_key || null,
        api_secret: payload.api_secret || null,
        endpoint_url: payload.endpoint_url || null,
        headers: headers || null,
        username: payload.username || null,
        password: payload.password || null,
        feed_url: payload.feed_url || null,
        is_active: payload.is_active,
        status: 'configured',
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,portal' });

    setSaving((prev) => ({ ...prev, [portalId]: false }));
    setNotice('Portal ayarları kaydedildi.');
  }

  async function generateToken() {
    if (!user?.tenant_id) return;
    const token = crypto.randomUUID();
    await supabase
      .from('tenants')
      .update({
        settings: {
          feed_token: token
        }
      })
      .eq('id', user.tenant_id);
    setFeedToken(token);
    setNotice('Feed token üretildi.');
  }

  async function verifyPortal(portalId: string) {
    if (!user?.tenant_id) return;
    setVerifying((prev) => ({ ...prev, [portalId]: true }));
    const { data, error } = await supabase.functions.invoke('verify-portal-credential', {
      body: { portal: portalId }
    });
    setVerifying((prev) => ({ ...prev, [portalId]: false }));
    if (error) {
      setNotice('Doğrulama başarısız.');
      return;
    }
    setNotice(data?.message || 'Doğrulama tamamlandı.');
    fetchSettings();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Entegrasyonları</h1>
        <p className="text-slate-500 text-sm mt-1">Portal API/Feed/FTP bilgilerini kaydedin ve aktif edin.</p>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Feed Token</h3>
        <p className="text-xs text-slate-500 mb-3">Feed endpointleri için güvenli token.</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={feedToken}
            readOnly
            className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
          />
          <button onClick={generateToken} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Üret</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portals.map((p) => {
          const item = credentials[p.id];
          const isConnected = item?.is_active;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <Plug className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">Entegrasyon Ayarları</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {isConnected ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Bağlı</span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1"><XCircle className="w-4 h-4" /> Kapalı</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-600">Entegrasyon Tipi</label>
                  <select
                    value={item?.integration_type || 'api'}
                    onChange={(e) => updateField(p.id, 'integration_type', e.target.value as IntegrationType)}
                    className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="api">API</option>
                    <option value="feed">Feed (XML/JSON)</option>
                    <option value="ftp">FTP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Endpoint URL</label>
                  <input
                    type="text"
                    value={item?.endpoint_url || ''}
                    onChange={(e) => updateField(p.id, 'endpoint_url', e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder="https://api.portal.com/endpoint"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600">API Key</label>
                    <input
                      type="text"
                      value={item?.api_key || ''}
                      onChange={(e) => updateField(p.id, 'api_key', e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">API Secret</label>
                    <input
                      type="text"
                      value={item?.api_secret || ''}
                      onChange={(e) => updateField(p.id, 'api_secret', e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Headers (JSON)</label>
                  <textarea
                    value={item?.headers || ''}
                    onChange={(e) => updateField(p.id, 'headers', e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    placeholder='{"Authorization":"Bearer ..."}'
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={item?.username || ''}
                      onChange={(e) => updateField(p.id, 'username', e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Şifre</label>
                    <input
                      type="password"
                      value={item?.password || ''}
                      onChange={(e) => updateField(p.id, 'password', e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Feed / FTP URL</label>
                  <input
                    type="text"
                    value={item?.feed_url || ''}
                    onChange={(e) => updateField(p.id, 'feed_url', e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateField(p.id, 'is_active', !isConnected)}
                  disabled={!!saving[p.id]}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${isConnected ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white'}`}
                >
                  {isConnected ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button
                  onClick={() => savePortal(p.id)}
                  disabled={!!saving[p.id]}
                  className="w-full py-2 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Kaydet
                </button>
                <button
                  onClick={() => verifyPortal(p.id)}
                  disabled={!!verifying[p.id]}
                  className="w-full py-2 rounded-xl text-sm font-bold border border-emerald-200 text-emerald-700 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> {verifying[p.id] ? 'Doğrulanıyor...' : 'Doğrula'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
