import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Video, 
  FileCheck, 
  Presentation, 
  FileText, 
  X,
  AlertCircle
} from 'lucide-react';
import { User, CalendarEvent, EventType } from '../types';
import { storage } from '../services/storage';

interface CalendarPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser, onNavigate }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(storage.getEvents(currentUser.id));
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-15');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form states for new event
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('meeting');
  const [newDate, setNewDate] = useState('2026-10-20');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newReminder, setNewReminder] = useState('1 day before');
  const [newDesc, setNewDesc] = useState('');

  // Fixed October 2026 calendar view matching Screenshot 17
  const year = 2026;
  const month = 9; // October (0-indexed)
  const monthName = 'October 2026';

  // Days in month
  const daysInMonth = 31;
  const firstDayIndex = 4; // Oct 1, 2026 is Thursday (0=Sun, 1=Mon, ..., 4=Thu)

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    storage.addEvent({
      userId: currentUser.id,
      title: newTitle.trim(),
      type: newType,
      eventDate: newDate,
      eventTime: newTime,
      reminder: newReminder,
      description: newDesc
    });

    setEvents(storage.getEvents(currentUser.id));
    setAddModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'meeting':
        return { icon: Video, color: '#E53935', bg: '#FDE3E3' };
      case 'submission':
        return { icon: FileCheck, color: '#F05A28', bg: '#FFE9DC' };
      case 'report':
        return { icon: FileText, color: '#0E9F6E', bg: '#DDF5EA' };
      case 'presentation':
        return { icon: Presentation, color: '#0B6BE6', bg: '#DEEBFB' };
      default:
        return { icon: CalendarIcon, color: '#5C54E5', bg: '#E9E9FB' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Calendar & Deadlines</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Research sprints, lab sync meetings, paper submission windows, and faculty reviews
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B6BE6] hover:bg-[#0956b8] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Event
        </button>
      </div>

      {/* Main Grid: Left Calendar Month View, Right Events List matching Screenshot 17 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Month Calendar (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#0B2A55]">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Sun..Sat) */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid matching rounded square shapes in Screenshot 17 */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-12 sm:h-16 rounded-2xl bg-gray-50/50 flex items-center justify-center text-gray-300 text-xs">
                {27 + idx}
              </div>
            ))}

            {/* Days 1 to 31 */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `2026-10-${day < 10 ? '0' + day : day}`;
              const dayEvents = events.filter(e => e.eventDate === dateStr);
              const isToday = day === 8;
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-12 sm:h-16 rounded-2xl p-1 sm:p-1.5 flex flex-col justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-[#FFC83D] bg-[#FFFBEB] ring-2 ring-[#FFC83D]/40 font-bold'
                      : isToday
                      ? 'border-[#0B6BE6] bg-[#DEEBFB]/40 font-bold'
                      : 'border-transparent bg-[#F5F8FC] hover:bg-gray-100 text-[#0B2A55]'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'text-[#0B6BE6]' : isSelected ? 'text-[#B45309]' : 'text-gray-700'}`}>
                    {day}
                  </span>

                  {/* Event indicators dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex items-center gap-1 self-center">
                      {dayEvents.map(evt => {
                        const { color } = getEventIcon(evt.type);
                        return (
                          <span
                            key={evt.id}
                            style={{ backgroundColor: color }}
                            className="w-1.5 h-1.5 rounded-full"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Upcoming Events List matching Screenshot 17 (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E3EAF3] p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-[#0B2A55]">Upcoming Events & Deadlines</h3>
              <span className="text-xs font-bold text-[#0B6BE6]">{events.length} Scheduled</span>
            </div>

            <div className="space-y-3">
              {events.map((evt) => {
                const { icon: Icon, color, bg } = getEventIcon(evt.type);

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-[#E3EAF3] hover:border-[#0B6BE6] transition-all flex items-start gap-3.5 group bg-[#F5F8FC]/50 hover:bg-white"
                  >
                    {/* Colored circular icon matching Screenshot 17 */}
                    <div
                      style={{ backgroundColor: bg, color }}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-[#0B2A55] group-hover:text-[#0B6BE6] transition-colors truncate">
                          {evt.title}
                        </h4>
                        <span className="text-[11px] font-bold text-gray-500 shrink-0">
                          {evt.eventDate}
                        </span>
                      </div>

                      {evt.projectName && (
                        <p className="text-[11px] font-semibold text-[#0B6BE6] truncate">
                          {evt.projectName}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 line-clamp-1">{evt.description}</p>

                      <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{evt.eventTime}</span>
                        <span>•</span>
                        <span>Reminder: {evt.reminder}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Syncs with Google Calendar</span>
            <span className="font-semibold text-[#0E9F6E]">All times in BST (UTC+6)</span>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E3EAF3] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-[#0B2A55]">Schedule Research Event</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lab Progress Sync with Supervisor"
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Event Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="meeting">Lab Meeting</option>
                    <option value="submission">Milestone Submission</option>
                    <option value="report">Progress Report</option>
                    <option value="presentation">Presentation / Defense</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM - 11:30 AM"
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 block">Notification Reminder</label>
                  <select
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                    className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl px-3 py-2 text-[#0B2A55]"
                  >
                    <option value="1 hour before">1 hour before</option>
                    <option value="1 day before">1 day before</option>
                    <option value="2 days before">2 days before</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 block">Description & Agenda</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Reviewing ROC curves and thesis outline..."
                  className="w-full bg-[#F5F8FC] border border-[#E3EAF3] rounded-xl p-2.5 text-[#0B2A55]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B6BE6] text-white rounded-xl font-bold"
                >
                  Add to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
