import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type EventType = 'showing' | 'meeting' | 'task';

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  event_start: string;
  event_end: string | null;
  location?: string | null;
  customer_name?: string | null;
}

const typeColors: Record<EventType, string> = {
  showing: 'bg-blue-100 text-blue-700 border-blue-200',
  meeting: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  task: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [formData, setFormData] = useState({
    title: '',
    type: 'showing' as EventType,
    date: '',
    start_time: '',
    end_time: '',
    location: ''
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dayEvents = useMemo(() => {
    return events.filter((e) => {
      const dt = new Date(e.event_start);
      return dt.toDateString() === selectedDate.toDateString();
    });
  }, [events, selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [user]);

  async function fetchEvents() {
    if (!user?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, type, event_start, event_end, location, customers(name)')
      .eq('tenant_id', user.tenant_id)
      .not('event_start', 'is', null)
      .order('event_start', { ascending: true });

    if (!error) {
      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        type: (e.type === 'gösterim' ? 'showing' : e.type === 'sözleşme' ? 'meeting' : 'task') as EventType,
        event_start: e.event_start,
        event_end: e.event_end,
        location: e.location,
        customer_name: e.customers?.[0]?.name || null
      }));
      setEvents(mapped);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenant_id) return;

    setSaving(true);

    const start = new Date(`${formData.date}T${formData.start_time}:00`);
    const end = formData.end_time ? new Date(`${formData.date}T${formData.end_time}:00`) : null;

    const { error } = await supabase
      .from('tasks')
      .insert({
        tenant_id: user.tenant_id,
        title: formData.title,
        type: formData.type === 'showing' ? 'gösterim' : formData.type === 'meeting' ? 'sözleşme' : 'iletişim',
        status: 'todo',
        stage: 'contact',
        assigned_to: user.id,
        event_start: start.toISOString(),
        event_end: end ? end.toISOString() : null,
        location: formData.location || null,
      });

    setSaving(false);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ title: '', type: 'showing', date: '', start_time: '', end_time: '', location: '' });
      fetchEvents();
    }
  }

  const today = new Date();
  const currentMonth = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const upcomingEvents = useMemo(() => {
    return events.slice(0, 8);
  }, [events]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEvents = useMemo(() => {
    return weekDays.map((day) => {
      const start = new Date(day);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      return events.filter((e) => {
        const dt = new Date(e.event_start);
        return dt >= start && dt <= end;
      });
    });
  }, [events, weekDays]);

  async function updateEventTime(id: string, newStart: Date) {
    const newEnd = new Date(newStart);
    newEnd.setMinutes(newEnd.getMinutes() + 60);
    await supabase
      .from('tasks')
      .update({ event_start: newStart.toISOString(), event_end: newEnd.toISOString() })
      .eq('id', id);
    fetchEvents();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }


  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Takvim & Randevular</h1>
          <p className="text-gray-500 text-sm mt-1">Gösterim ve toplantılarınızı planlayın.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button onClick={() => setViewMode('day')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'day' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              Gün
            </button>
            <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              Hafta
            </button>
          </div>
          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                date: prev.date || selectedDate.toISOString().slice(0, 10)
              }));
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Yeni Randevu
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{currentMonth}</h2>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
              <div>Pt</div><div>Sa</div><div>Ça</div><div>Pe</div><div>Cu</div><div>Ct</div><div>Pz</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {Array.from({ length: 31 }).map((_, i) => {
                const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`p-1.5 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 ${
                      isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold' : isToday ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Yaklaşanlar</h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-sm text-gray-500">Kayıtlı etkinlik yok.</div>
              ) : upcomingEvents.map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${typeColors[event.type]}`}>
                  <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <Clock className="w-3 h-3" /> {new Date(event.event_start).toLocaleString('tr-TR')}
                    </div>
                    {event.customer_name && (
                      <div className="flex items-center gap-1.5 text-xs opacity-80">
                        <User className="w-3 h-3" /> {event.customer_name}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs opacity-80">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'day' ? (
            <div className="flex-1 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedLabel}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 border border-gray-200 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-gray-500 mb-2">Etkinlikler</h3>
                  {dayEvents.length === 0 ? (
                    <div className="text-sm text-gray-500">Bugün için etkinlik yok.</div>
                  ) : dayEvents.map((event) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={() => setDraggingId(event.id)}
                      className={`p-2 rounded border text-xs mb-2 cursor-grab ${typeColors[event.type]}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
                <div className="md:col-span-3 border border-gray-200 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-gray-500 mb-2">Zaman Cizelgesi</h3>
                  <div className="space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const hour = i + 8;
                      const hourEvents = dayEvents.filter((event) => new Date(event.event_start).getHours() === hour);
                      return (
                        <div
                          key={hour}
                          className="flex items-center justify-between border border-dashed border-gray-200 rounded p-2"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (!draggingId) return;
                            const newStart = new Date(selectedDate);
                            newStart.setHours(hour, 0, 0, 0);
                            updateEventTime(draggingId, newStart);
                            setDraggingId(null);
                          }}
                        >
                          <div className="text-xs text-gray-500">{hour}:00</div>
                          {hourEvents.length === 0 ? (
                            <div className="text-[11px] text-gray-400">Buraya bir etkinlik bırak</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {hourEvents.map((event) => (
                                <div key={event.id} className={`px-2 py-1 rounded text-[11px] border ${typeColors[event.type]}`}>
                                  {event.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Haftalik Gorunum</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Önceki Hafta
                  </button>
                  <button
                    onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000))}
                    className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Sonraki Hafta
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {weekDays.map((day, idx) => (
                  <div key={day.toISOString()} className="border border-gray-200 rounded-lg p-2 min-h-[140px]">
                    <div className="text-xs font-bold text-gray-500 mb-2">
                      {day.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </div>
                    {weekEvents[idx].length === 0 ? (
                      <div className="text-[11px] text-gray-400">Etkinlik yok</div>
                    ) : weekEvents[idx].map((event) => (
                      <div key={event.id} className={`p-2 rounded border text-xs mb-2 ${typeColors[event.type]}`}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Yeni Randevu</h2>
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
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Kadıköy Daire Gösterimi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tür</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="showing">Gösterim</option>
                    <option value="meeting">Toplantı</option>
                    <option value="task">Görev</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Başlangıç</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Bitiş</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Konum</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Moda, Kadıköy"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
