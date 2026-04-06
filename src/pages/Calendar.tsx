import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react';

const mockEvents = [
  { id: 1, title: 'Kadıköy Daire Gösterimi', time: '10:00 - 11:30', client: 'Ayşe Yılmaz', location: 'Moda, Kadıköy', type: 'showing' },
  { id: 2, title: 'Sözleşme İmzası', time: '14:00 - 15:00', client: 'Tech Corp', location: 'Merkez Ofis', type: 'meeting' },
  { id: 3, title: 'Yeni Portföy Çekimi', time: '16:00 - 17:30', client: 'Mehmet Demir', location: 'Bodrum', type: 'task' },
];

const typeColors = {
  showing: 'bg-blue-100 text-blue-700 border-blue-200',
  meeting: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  task: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function Calendar() {
  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Takvim & Randevular</h1>
          <p className="text-gray-500 text-sm mt-1">Gösterim ve toplantılarınızı planlayın.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-900">Gün</button>
            <button className="px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50">Hafta</button>
            <button className="px-3 py-1 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50">Ay</button>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Randevu
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar / Mini Calendar & Upcoming */}
        <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Ocak 2026</h2>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
              <div>Pt</div><div>Sa</div><div>Ça</div><div>Pe</div><div>Cu</div><div>Ct</div><div>Pz</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {/* Dummy calendar days */}
              {Array.from({ length: 31 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`p-1.5 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 ${
                    i + 1 === 27 ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold' : 'text-gray-700'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Yaklaşanlar</h3>
            <div className="space-y-3">
              {mockEvents.map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${typeColors[event.type as keyof typeof typeColors]}`}>
                  <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <Clock className="w-3 h-3" /> {event.time}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <User className="w-3 h-3" /> {event.client}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Calendar Area (Daily View Mockup) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-gray-900">27 Ocak 2026, Salı</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Gösterim</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Toplantı</span>
              <span className="flex items-center gap-1 text-xs text-gray-500"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Görev</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto relative bg-white">
            {/* Time slots */}
            <div className="absolute inset-0">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex h-20 border-b border-gray-100">
                  <div className="w-16 flex-shrink-0 text-right pr-4 py-2 text-xs text-gray-400 font-medium border-r border-gray-100">
                    {i + 8}:00
                  </div>
                  <div className="flex-1 relative"></div>
                </div>
              ))}
            </div>

            {/* Events Overlay */}
            <div className="absolute inset-0 ml-16">
              {/* Event 1: 10:00 - 11:30 */}
              <div className="absolute top-[160px] left-4 right-4 h-[120px] bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-blue-900 text-sm">Kadıköy Daire Gösterimi</h4>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">10:00 - 11:30</span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-blue-800">
                    <User className="w-3.5 h-3.5" /> Ayşe Yılmaz
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-800">
                    <MapPin className="w-3.5 h-3.5" /> Moda, Kadıköy
                  </div>
                </div>
              </div>

              {/* Event 2: 14:00 - 15:00 */}
              <div className="absolute top-[480px] left-4 right-4 h-[80px] bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-emerald-900 text-sm">Sözleşme İmzası</h4>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">14:00 - 15:00</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-800">
                  <User className="w-3.5 h-3.5" /> Tech Corp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
