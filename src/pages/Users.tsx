import React, { useEffect, useState } from 'react';
import { Plus, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Role = 'agent' | 'senior_agent' | 'branch_manager' | 'admin' | 'owner';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  branch_id: string | null;
  is_active: boolean;
}

export default function Users() {
  const { user, hasAnyPermission } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'agent' as Role,
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [user]);

  async function fetchUsers() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, role, branch_id, is_active')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });
    setRows((data as UserRow[]) || []);
    setLoading(false);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        password: formData.password
      }
    });

    if (error) {
      setNotice('Kullanıcı oluşturulamadı.');
    } else {
      setNotice(data?.message || 'Kullanıcı oluşturuldu.');
      setIsModalOpen(false);
      setFormData({ full_name: '', email: '', role: 'agent', password: '' });
      fetchUsers();
    }
    setSaving(false);
  }

  if (!hasAnyPermission(['user:manage:branch'])) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
          <p className="text-slate-500 text-sm mt-1">Çalışanları ekleyin, rollerini yönetin.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Kullanıcı
        </button>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="text-sm text-slate-500">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Ad Soyad</th>
                  <th className="py-2">E-posta</th>
                  <th className="py-2">Rol</th>
                  <th className="py-2">Durum</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="py-3 font-medium">{row.full_name}</td>
                    <td className="py-3">{row.email}</td>
                    <td className="py-3">{row.role}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <UserCheck className="w-3 h-3" /> {row.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Yeni Kullanıcı</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                ✕
              </button>
            </div>
            <form onSubmit={createUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Şifre</label>
                <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })} className="w-full border border-slate-300 rounded-xl px-4 py-2">
                  <option value="agent">Danışman</option>
                  <option value="senior_agent">Kıdemli Danışman</option>
                  <option value="branch_manager">Şube Müdürü</option>
                  <option value="admin">Genel Müdür</option>
                  <option value="owner">Sahip</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">İptal</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
