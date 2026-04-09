import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Sparkles, Building2, Users, FileText, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Marketing() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    team_size: '1-3',
    message: '',
    website: ''
  });
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    if (window.grecaptcha) {
      renderRecaptcha();
      return;
    }

    const scriptId = 'recaptcha-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => renderRecaptcha();
    document.body.appendChild(script);
  }, [siteKey]);

  function renderRecaptcha() {
    if (!siteKey || !recaptchaRef.current || recaptchaWidgetId.current !== null || !window.grecaptcha) return;
    recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setRecaptchaToken(token),
      'expired-callback': () => setRecaptchaToken('')
    });
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (formData.website) return;
    if (!siteKey || !recaptchaToken) {
      setNotice('Lütfen doğrulamayı tamamlayın.');
      return;
    }
    setSending(true);
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    try {
      const resp = await fetch(`${baseUrl}/functions/v1/lead-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptcha_token: recaptchaToken
        })
      });
      if (resp.ok) {
        setNotice('Talebiniz alındı. En kısa sürede dönüş yapacağız.');
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          company: '',
          team_size: '1-3',
          message: '',
          website: ''
        });
        if (window.grecaptcha && recaptchaWidgetId.current !== null) {
          window.grecaptcha.reset(recaptchaWidgetId.current);
          setRecaptchaToken('');
        }
      } else {
        setNotice('Talep gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch {
      setNotice('Talep gönderilemedi. Lütfen tekrar deneyin.');
    }
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f2a44,transparent_55%)]"></div>
        <div className="absolute -top-24 -right-24 w-[320px] h-[320px] bg-indigo-500/30 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-[260px] h-[260px] bg-emerald-500/20 blur-[120px] rounded-full"></div>

        <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-xl shadow-md shadow-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight">EmlakCRM Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-200 hover:text-white">
              Giriş Yap
            </Link>
            <a href="#contact" className="bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold">
              Demo Talebi
            </a>
          </div>
        </header>

        <section className="relative z-10 px-6 pt-12 pb-24 md:px-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-200">
                <Sparkles className="w-4 h-4" /> Türkiye emlak ofisleri için uçtan uca CRM
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-5">
                Emlak operasyonunuzu tek panelden yönetin.
              </h1>
              <p className="text-slate-300 text-base md:text-lg mt-5">
                İlan, müşteri, sözleşme, görev, rapor ve portal entegrasyonlarını bir araya getiren profesyonel bir SaaS.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#contact" className="bg-indigo-500 hover:bg-indigo-400 px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2">
                  Demo Talebi <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#pricing" className="border border-white/20 px-6 py-3 rounded-full text-sm font-bold text-slate-200">
                  Fiyatları Gör
                </a>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-300">
                {['Multi-tenant altyapı', 'KVKK uyumlu', 'Türkçe portal akışı', 'Rol bazlı yönetim'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/40">
              <div className="bg-[#111a2b] rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">EmlakCRM Pro · Kontrol Paneli</p>
                    <p className="text-sm font-bold">Satış Panosu</p>
                  </div>
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full">Canlı</div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {['Yeni Müşteri', 'Portal Yayın', 'Sözleşme', 'Rapor'].map((item) => (
                    <div key={item} className="bg-[#0b1220] border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-slate-400">{item}</p>
                      <p className="text-lg font-bold mt-2">{Math.floor(Math.random() * 120) + 12}</p>
                      <p className="text-[11px] text-emerald-300 mt-2">+%{Math.floor(Math.random() * 20) + 6}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-300">Bugün oluşturulan randevu</p>
                    <p className="text-lg font-bold">15 gösterim</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white text-slate-900 px-6 py-16 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { title: 'Satış Panosu', desc: 'Sürükle bırak görev yönetimi ve pipeline kontrolü.' },
            { title: 'Takvim & Randevu', desc: 'Günlük/haftalık ajanda ve etkinlik izleme.' },
            { title: 'Rapor & Prim', desc: 'Çalışan bazlı performans ve komisyon takibi.' }
          ].map((item) => (
            <div key={item.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-slate-50 text-slate-900 px-6 py-16 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600">FİYATLANDIRMA</p>
              <h2 className="text-3xl font-bold mt-2">KOBİ dostu, ölçeklenebilir planlar</h2>
              <p className="text-sm text-slate-600 mt-3">Türkiye emlak ofislerinin bütçelerine uygun, düşük giriş bariyeri.</p>
            </div>
            <div className="text-xs text-slate-500">Üyelikler satış ekibi tarafından açılır. KDV hariçtir.</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {[{
              name: 'Başlangıç',
              price: '₺599',
              desc: 'Yeni başlayan ofisler için',
              features: ['1 şube', '3 kullanıcı', 'İlan & müşteri yönetimi', 'Temel raporlar']
            }, {
              name: 'Büyüme',
              price: '₺1.499',
              desc: 'Büyüyen ekipler için',
              features: ['2 şube', '10 kullanıcı', 'Portal entegrasyonu', 'Komisyon & prim raporu']
            }, {
              name: 'Kurumsal',
              price: 'Teklif',
              desc: 'Çok şubeli organizasyonlar',
              features: ['Sınırsız şube', 'SLA & özel eğitim', 'Özel entegrasyonlar', 'Özel destek']
            }].map((plan, idx) => (
              <div key={plan.name} className={`rounded-3xl border ${idx === 1 ? 'border-indigo-400 bg-white shadow-xl' : 'border-slate-200 bg-white'} p-6`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {idx === 1 && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Önerilen</span>}
                </div>
                <p className="text-sm text-slate-500 mt-2">{plan.desc}</p>
                <p className="text-3xl font-bold mt-4">{plan.price}<span className="text-base font-semibold text-slate-500">/ay</span></p>
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
                <a href="#contact" className="mt-6 inline-flex items-center justify-center w-full px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800">
                  Satış Ekibi ile Görüş
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white text-slate-900 px-6 py-16 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-indigo-600">DEMO TALEBİ</p>
            <h2 className="text-3xl font-bold mt-2">Satış ekibi ile görüşün</h2>
            <p className="text-sm text-slate-600 mt-3">Sorularınızı yanıtlayalım, ihtiyacınıza göre demo planlayalım.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-600" /> +90 212 000 00 00</div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" /> info@emlakcrm.pro</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600" /> İstanbul, Türkiye</div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
            <form onSubmit={submitLead} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ad Soyad</label>
                <input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" placeholder="Ad Soyad" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-posta</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" placeholder="ornek@firma.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Telefon</label>
                <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" placeholder="05xx xxx xx xx" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Şirket Adı</label>
                <input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" placeholder="Şirket Adı" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Şirket Büyüklüğü</label>
                <select value={formData.team_size} onChange={(e) => setFormData({ ...formData, team_size: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2">
                  <option value="1-3">1-3 kişi</option>
                  <option value="4-10">4-10 kişi</option>
                  <option value="10+">10+ kişi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mesaj</label>
                <textarea rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full border border-slate-300 rounded-xl px-4 py-2" placeholder="Kısaca ihtiyacınızı yazın"></textarea>
              </div>
              <div className="hidden">
                <label>Website</label>
                <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              </div>
              {notice && (
                <div className="text-xs font-semibold text-emerald-600">{notice}</div>
              )}
              <div className="mt-2" ref={recaptchaRef}></div>
              <button type="submit" disabled={sending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
                {sending ? 'Gönderiliyor...' : 'Demo Talebi Gönder'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 text-slate-900 px-6 py-16 md:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold">Sık Sorulan Sorular</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'Üyelik nasıl açılır?', a: 'Üyelikler satış ekibi tarafından açılır. Demo talebi ile başvurabilirsiniz.' },
              { q: 'Verilerim güvende mi?', a: 'Her şirketin verisi ayrı tenant’ta izole edilir ve RLS ile korunur.' },
              { q: 'Portal entegrasyonu var mı?', a: 'Evet, portal bağlantıları yönetilir ve ilanlar kuyrukla gönderilir.' },
              { q: 'Sözleşme şablonlarını değiştirebilir miyim?', a: 'Evet, Settings bölümünden satış/kiralama/yetki şablonlarını düzenleyebilirsiniz.' },
              { q: 'Kullanıcı sayısı artırılabilir mi?', a: 'Plan yükseltme ile kullanıcı sayısı artırılır, satış ekibi destek sağlar.' },
              { q: 'Kurulum ne kadar sürer?', a: 'Ortalama 1 iş günü içinde aktif edilir ve eğitim verilir.' }
            ].map((item) => (
              <div key={item.q} className="bg-white border border-slate-200 rounded-2xl p-4">
                <h3 className="font-bold text-sm">{item.q}</h3>
                <p className="text-sm text-slate-600 mt-2">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0b0f17] text-slate-400 px-6 py-8 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm">© 2026 EmlakCRM Pro</span>
          <div className="text-sm">info@emlakcrm.pro · +90 212 000 00 00</div>
        </div>
      </footer>
    </div>
  );
}
