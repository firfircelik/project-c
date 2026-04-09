import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

interface Job {
  id: string;
  portal: string;
  status: 'queued' | 'sent' | 'failed';
  message?: string | null;
  created_at: string;
  listings?: { code?: string | null; title?: string | null }[] | null;
}

const statusLabels: Record<Job['status'], string> = {
  queued: 'Kuyrukta',
  sent: 'Gönderildi',
  failed: 'Hata'
};

const statusColors: Record<Job['status'], string> = {
  queued: 'bg-amber-100 text-amber-700 border-amber-200',
  sent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200'
};

export default function PortalJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [user]);

  async function fetchJobs() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('portal_publish_jobs')
      .select('id, portal, status, message, created_at, listings(code, title)')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });
    if (error) {
      setNotice('Kuyruk verisi alınamadı.');
    }
    setJobs((data as Job[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: Job['status']) {
    const { error } = await supabase
      .from('portal_publish_jobs')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setNotice('Kuyruk durumu güncellendi.');
      fetchJobs();
    }
  }

  async function processNow() {
    const { data, error } = await supabase.functions.invoke('process-portal-jobs', { body: {} });
    if (error) {
      setNotice('İşler çalıştırılamadı.');
      return;
    }
    setNotice(data?.message || 'İşler işlendi.');
    fetchJobs();
  }

  const filtered = jobs.filter((j) => !filter || j.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Yayın Kuyruğu</h1>
          <p className="text-slate-500 text-sm mt-1">Gönderim işlerini buradan takip edebilirsiniz.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={processNow} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Şimdi Gönder</button>
          <button onClick={fetchJobs} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="text-sm text-slate-500">Toplam: {filtered.length}</div>
        <select className="border border-slate-300 rounded-xl px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="queued">Kuyrukta</option>
          <option value="sent">Gönderildi</option>
          <option value="failed">Hata</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">İlan</th>
                <th className="px-6 py-4 font-bold">Portal</th>
                <th className="px-6 py-4 font-bold">Durum</th>
                <th className="px-6 py-4 font-bold">Tarih</th>
                <th className="px-6 py-4 font-bold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Yükleniyor...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">Kuyruk boş.</td></tr>
              ) : filtered.map((j) => (
                <tr key={j.id}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{j.listings?.[0]?.code || '-'}</div>
                    <div className="text-xs text-slate-500">{j.listings?.[0]?.title || '-'}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{j.portal}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColors[j.status]}`}>
                      {statusLabels[j.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{new Date(j.created_at).toLocaleString('tr-TR')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => updateStatus(j.id, 'sent')} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700">Gönderildi</button>
                      <button onClick={() => updateStatus(j.id, 'failed')} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Hata</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
