import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['S','M','T','W','T','F','S'];

const TIMEZONES = [
  { label: 'Pacific Time - US & Canada', value: 'America/Los_Angeles' },
  { label: 'Mountain Time - US & Canada', value: 'America/Denver' },
  { label: 'Central Time - US & Canada', value: 'America/Chicago' },
  { label: 'Eastern Time - US & Canada', value: 'America/New_York' },
  { label: 'Atlantic Time - Canada', value: 'America/Halifax' },
  { label: 'Newfoundland Time', value: 'America/St_Johns' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'Paris (CET)', value: 'Europe/Paris' },
  { label: 'Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'India Standard Time', value: 'Asia/Kolkata' },
  { label: 'China Standard Time', value: 'Asia/Shanghai' },
  { label: 'Japan Standard Time', value: 'Asia/Tokyo' },
  { label: 'Singapore Time', value: 'Asia/Singapore' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Auckland (NZST)', value: 'Pacific/Auckland' },
  { label: 'São Paulo (BRT)', value: 'America/Sao_Paulo' },
  { label: 'Buenos Aires (ART)', value: 'America/Argentina/Buenos_Aires' },
  { label: 'UTC', value: 'UTC' },
];

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':');
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
};

const TIME_OPTIONS = Array.from({length:48}, (_, k) => {
  const h = String(Math.floor(k/2)).padStart(2,'0');
  const m = k%2===0 ? '00' : '30';
  return { value:`${h}:${m}`, label:fmt12(`${h}:${m}`) };
});

// ── Icons ──────────────────────────────────────────────────────────────────────
const IcoPlus     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoX        = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoCopy     = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoDots     = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const IcoRepeat   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoCal      = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChevDown = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoGlobe    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

// ── Timezone Dropdown ──────────────────────────────────────────────────────────
const TimezoneDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = TIMEZONES.find(t => t.value === value) || TIMEZONES[10];
  const filtered = TIMEZONES.filter(t => t.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <button onClick={() => setOpen(!open)} style={{
        display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none',
        cursor:'pointer', color:'#006bff', fontSize:'14px', fontWeight:'500', padding:0
      }}>
        <IcoGlobe/> {selected.label} <IcoChevDown/>
      </button>
      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={() => setOpen(false)}/>
          <div style={{
            position:'absolute', top:'calc(100% + 8px)', left:0, background:'white',
            border:'1px solid #e5e7eb', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
            width:'280px', zIndex:999, overflow:'hidden'
          }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
              <input
                autoFocus
                placeholder="Search timezones..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'13px', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ maxHeight:'220px', overflowY:'auto' }}>
              {filtered.map(tz => (
                <div key={tz.value} onClick={() => { onChange(tz.value); setOpen(false); setSearch(''); }}
                  style={{
                    padding:'10px 14px', cursor:'pointer', fontSize:'13px',
                    color: tz.value===value ? '#006bff' : '#374151',
                    background: tz.value===value ? '#eff6ff' : 'white',
                    fontWeight: tz.value===value ? '600' : '400',
                    display:'flex', justifyContent:'space-between', alignItems:'center'
                  }}
                  onMouseEnter={e => { if(tz.value!==value) e.currentTarget.style.background='#f9fafb'; }}
                  onMouseLeave={e => { if(tz.value!==value) e.currentTarget.style.background='white'; }}>
                  {tz.label}
                  {tz.value===value && <span style={{color:'#006bff'}}>✓</span>}
                </div>
              ))}
              {filtered.length===0 && <p style={{padding:'16px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>No timezones found</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── Date Picker Modal ──────────────────────────────────────────────────────────
const DatePickerModal = ({ onClose, onApply }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const today = new Date(); today.setHours(0,0,0,0);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const formatDate = (day) => {
    const m = String(month+1).padStart(2,'0');
    const d = String(day).padStart(2,'0');
    return `${year}-${m}-${d}`;
  };

  const toggleDate = (day) => {
    const date = formatDate(day);
    const d = new Date(year, month, day);
    if (d < today) return;
    setSelectedDates(prev => prev.includes(date) ? prev.filter(x=>x!==date) : [...prev, date]);
  };

  const isSelected = (day) => selectedDates.includes(formatDate(day));
  const isToday = (day) => new Date(year, month, day).toDateString() === today.toDateString();
  const isPast = (day) => new Date(year, month, day) < today;

  const handleApply = () => {
    if (selectedDates.length === 0) return;
    onApply(selectedDates, startTime, endTime);
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
      <div style={{ background:'white', borderRadius:'16px', width:'440px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>

        <div style={{ padding:'28px 28px 20px' }}>
          <h3 style={{ fontSize:'18px', fontWeight:'700', color:'#111827', marginBottom:'4px' }}>
            Select the date(s) you want to assign specific hours
          </h3>
        </div>

        <div style={{ padding:'0 28px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <span style={{ fontSize:'15px', fontWeight:'600', color:'#111827' }}>{MONTH_NAMES[month]} {year}</span>
            <div style={{ display:'flex', gap:'4px' }}>
              <button onClick={() => setCurrentMonth(new Date(year, month-1, 1))} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:'16px', color:'#374151' }}>‹</button>
              <button onClick={() => setCurrentMonth(new Date(year, month+1, 1))} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'none', background:'#006bff', cursor:'pointer', fontSize:'16px', color:'white' }}>›</button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'8px' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:'11px', fontWeight:'700', color:'#9ca3af', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth}).map((_,i) => {
              const day = i+1;
              const sel = isSelected(day);
              const tod = isToday(day);
              const past = isPast(day);
              return (
                <div key={day} onClick={() => toggleDate(day)} style={{
                  height:'40px', display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'50%', cursor:past?'default':'pointer', fontSize:'14px',
                  fontWeight: tod||sel ? '700' : '400',
                  background: sel ? '#2563eb' : 'transparent',
                  color: sel ? 'white' : past ? '#d1d5db' : tod ? '#2563eb' : '#111827',
                  position:'relative', transition:'background 0.15s'
                }}
                  onMouseEnter={e=>{ if(!past&&!sel) e.currentTarget.style.background='#f3f4f6'; }}
                  onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background='transparent'; }}>
                  {day}
                  {tod && <span style={{ position:'absolute', bottom:'4px', left:'50%', transform:'translateX(-50%)', width:'4px', height:'4px', borderRadius:'50%', background:sel?'white':'#2563eb' }}/>}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDates.length > 0 && (
          <div style={{ padding:'20px 28px', borderTop:'1px solid #e5e7eb', background:'#f9fafb' }}>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#111827', marginBottom:'12px' }}>What hours are you available?</p>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ position:'relative', flex:1 }}>
                <select value={startTime} onChange={e=>setStartTime(e.target.value)}
                  style={{ width:'100%', padding:'10px 28px 10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', appearance:'none', cursor:'pointer' }}>
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
              </div>
              <span style={{ color:'#9ca3af', fontWeight:'500' }}>-</span>
              <div style={{ position:'relative', flex:1 }}>
                <select value={endTime} onChange={e=>setEndTime(e.target.value)}
                  style={{ width:'100%', padding:'10px 28px 10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', appearance:'none', cursor:'pointer' }}>
                  {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding:'16px 28px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', gap:'12px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', border:'2px solid #d1d5db', borderRadius:'24px', background:'white', fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'#374151' }}>Cancel</button>
          <button onClick={handleApply} disabled={selectedDates.length===0}
            style={{ flex:1, padding:'12px', border:'none', borderRadius:'24px', background:selectedDates.length>0?'#2563eb':'#e5e7eb', color:selectedDates.length>0?'white':'#9ca3af', fontSize:'14px', fontWeight:'600', cursor:selectedDates.length>0?'pointer':'default' }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Availability Page ─────────────────────────────────────────────────────
const Availability = () => {
  const [schedule, setSchedule] = useState(
    DAYS.map((_, i) => ({ day_of_week:i, start_time:'09:00', end_time:'17:00', is_active: i>=1&&i<=5 }))
  );
  const [dateOverrides, setDateOverrides] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  useEffect(() => { fetchAvailability(); }, []);

  // ── FIX 1: fetch BOTH weekly schedule AND date overrides ───────────────────
  const fetchAvailability = async () => {
    try {
      const res = await API.get('/api/availability');

      // Weekly schedule
      if (res.data.availability && res.data.availability.length > 0) {
        const updated = DAYS.map((_, i) => {
          const found = res.data.availability.find(a => a.day_of_week === i);
          return found
            ? { day_of_week:i, start_time:found.start_time.slice(0,5), end_time:found.end_time.slice(0,5), is_active:found.is_active }
            : { day_of_week:i, start_time:'09:00', end_time:'17:00', is_active:false };
        });
        setSchedule(updated);
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        // fallback: old API shape returning plain array
        const updated = DAYS.map((_, i) => {
          const found = res.data.find(a => a.day_of_week === i);
          return found
            ? { day_of_week:i, start_time:found.start_time.slice(0,5), end_time:found.end_time.slice(0,5), is_active:found.is_active }
            : { day_of_week:i, start_time:'09:00', end_time:'17:00', is_active:false };
        });
        setSchedule(updated);
      }

      // FIX 1: also restore date overrides
      if (res.data.date_overrides && res.data.date_overrides.length > 0) {
        setDateOverrides(res.data.date_overrides.map(o => ({
          date: o.date,
          start_time: o.start_time.slice(0,5),
          end_time: o.end_time.slice(0,5),
        })));
      }

    } catch(e){ console.error('Failed to fetch availability:', e); }
  };

  const toggle = (i) => {
    const s = [...schedule];
    s[i] = { ...s[i], is_active: !s[i].is_active };
    setSchedule(s);
  };

  const setTime = (i, field, val) => {
    const s = [...schedule];
    s[i] = { ...s[i], [field]: val };
    setSchedule(s);
  };

  // ── FIX 2: send BOTH weekly schedule AND date overrides on save ────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await API.put('/api/availability', {
        availability: schedule,
        date_overrides: dateOverrides,   // ← was missing before!
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) {
      console.error('Save error:', e);
      alert('Error saving: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  // ── FIX 3: Discard also resets date overrides ─────────────────────────────
  const handleDiscard = () => {
    setDateOverrides([]);   // ← was missing before
    fetchAvailability();
  };

  const handleApplyDates = (dates, startTime, endTime) => {
    const newOverrides = dates
      .filter(d => !dateOverrides.find(o => o.date === d))
      .map(d => ({ date:d, start_time:startTime, end_time:endTime }));
    setDateOverrides(prev => [...prev, ...newOverrides]);
  };

  const removeOverride = (date) => setDateOverrides(prev => prev.filter(o => o.date !== date));

  const updateOverrideTime = (date, field, val) => {
    setDateOverrides(prev => prev.map(o => o.date===date ? {...o,[field]:val} : o));
  };

  return (
    <div style={{ background:'#f9fafb', minHeight:'100vh' }}>

      {showModal && <DatePickerModal onClose={()=>setShowModal(false)} onApply={handleApplyDates}/>}

      {/* Page header */}
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'0 40px' }}>
        <div style={{ maxWidth:'860px', margin:'auto' }}>
          <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#111827', padding:'32px 0 20px' }}>Availability</h1>
          <div style={{ display:'flex', gap:'0' }}>
            {[
              { key:'schedules', label:'Schedules' },
              { key:'calendar', label:'Calendar settings' },
              { key:'advanced', label:'Advanced settings' },
            ].map(tab => (
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                padding:'12px 20px', border:'none', background:'none', fontSize:'14px', fontWeight:'500',
                cursor:'pointer', color:activeTab===tab.key?'#006bff':'#6b7280',
                borderBottom:activeTab===tab.key?'2px solid #006bff':'2px solid transparent',
                marginBottom:'-1px'
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'860px', margin:'32px auto', padding:'0 40px' }}>

        {activeTab==='schedules' && (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>

            {/* Schedule header */}
            <div style={{ padding:'20px 28px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'12px', fontWeight:'600', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>Schedule</p>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontSize:'16px', fontWeight:'700', color:'#006bff', cursor:'pointer' }}>Working hours (default)</span>
                  <IcoChevDown/>
                </div>
                <p style={{ fontSize:'13px', color:'#6b7280', marginTop:'4px' }}>
                  Active on: <span style={{ color:'#006bff', cursor:'pointer' }}>{schedule.filter(s=>s.is_active).length} event types</span>
                </p>
              </div>
              <button style={{ width:'36px', height:'36px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
                <IcoDots/>
              </button>
            </div>

            {/* Weekly hours */}
            <div style={{ padding:'28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                <IcoRepeat/>
                <p style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>Weekly hours</p>
              </div>
              <p style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'24px' }}>Set when you are typically available for meetings</p>

              {schedule.map((row, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', minHeight:'44px' }}>
                  {/* Day circle */}
                  <div onClick={()=>toggle(i)} style={{
                    width:'36px', height:'36px', borderRadius:'50%', flexShrink:0, cursor:'pointer',
                    background: row.is_active ? '#1e3a5f' : 'transparent',
                    border: row.is_active ? 'none' : '2px solid #d1d5db',
                    color: row.is_active ? 'white' : '#9ca3af',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'12px', fontWeight:'700', userSelect:'none', transition:'all 0.15s'
                  }}>
                    {DAYS_SHORT[i]}
                  </div>

                  {row.is_active ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
                      <div style={{ position:'relative', flex:1 }}>
                        <select value={row.start_time} onChange={e=>setTime(i,'start_time',e.target.value)}
                          style={{ width:'100%', padding:'10px 28px 10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', fontWeight:'500', appearance:'none', cursor:'pointer', background:'white' }}>
                          {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
                      </div>

                      <span style={{ color:'#9ca3af', fontWeight:'500', fontSize:'14px' }}>-</span>

                      <div style={{ position:'relative', flex:1 }}>
                        <select value={row.end_time} onChange={e=>setTime(i,'end_time',e.target.value)}
                          style={{ width:'100%', padding:'10px 28px 10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', fontWeight:'500', appearance:'none', cursor:'pointer', background:'white' }}>
                          {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
                      </div>

                      <button onClick={()=>toggle(i)} title="Remove" style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.color='#ef4444';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#9ca3af';}}>
                        <IcoX/>
                      </button>

                      <button title="Add time slot" style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#eff6ff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#9ca3af';}}>
                        <IcoPlus/>
                      </button>

                      <button title="Copy to other days" style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#eff6ff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#9ca3af';}}>
                        <IcoCopy/>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                      <span style={{ fontSize:'14px', color:'#9ca3af', flex:1 }}>Unavailable</span>
                      <button onClick={()=>toggle(i)} title="Add availability" style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#eff6ff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#9ca3af';}}>
                        <IcoPlus/>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Timezone dropdown */}
              <div style={{ marginTop:'8px' }}>
                <TimezoneDropdown value={timezone} onChange={setTimezone}/>
              </div>
            </div>

            {/* Date-specific hours */}
            <div style={{ padding:'0 28px 28px' }}>
              <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <IcoCal/>
                    <p style={{ fontSize:'15px', fontWeight:'700', color:'#111827' }}>Date-specific hours</p>
                  </div>
                  <button onClick={()=>setShowModal(true)} style={{
                    display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px',
                    border:'1px solid #d1d5db', borderRadius:'24px', background:'white',
                    fontSize:'13px', fontWeight:'600', color:'#374151', cursor:'pointer'
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <IcoPlus/> Hours
                  </button>
                </div>
                <p style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'20px' }}>Adjust hours for specific days</p>

                {dateOverrides.length === 0 ? (
                  <p style={{ fontSize:'13px', color:'#9ca3af', fontStyle:'italic' }}>No date-specific hours set</p>
                ) : (
                  dateOverrides
                    .sort((a,b) => a.date.localeCompare(b.date))
                    .map(ov => (
                      <div key={ov.date} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px', padding:'12px 16px', background:'#f9fafb', borderRadius:'10px' }}>
                        <span style={{ fontSize:'14px', fontWeight:'600', color:'#111827', minWidth:'110px' }}>
                          {new Date(ov.date+'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}
                        </span>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
                          <div style={{ position:'relative', flex:1 }}>
                            <select value={ov.start_time} onChange={e=>updateOverrideTime(ov.date,'start_time',e.target.value)}
                              style={{ width:'100%', padding:'9px 28px 9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', appearance:'none', cursor:'pointer', background:'white' }}>
                              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <span style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
                          </div>
                          <span style={{ color:'#9ca3af' }}>-</span>
                          <div style={{ position:'relative', flex:1 }}>
                            <select value={ov.end_time} onChange={e=>updateOverrideTime(ov.date,'end_time',e.target.value)}
                              style={{ width:'100%', padding:'9px 28px 9px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', appearance:'none', cursor:'pointer', background:'white' }}>
                              {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <span style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#9ca3af' }}><IcoChevDown/></span>
                          </div>
                        </div>
                        <button onClick={()=>removeOverride(ov.date)} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}>
                          <IcoX/>
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Save footer */}
            <div style={{ padding:'16px 28px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'flex-end', gap:'12px' }}>
              {/* FIX 3: Discard now resets date overrides too */}
              <button onClick={handleDiscard} style={{ padding:'10px 24px', border:'1px solid #d1d5db', borderRadius:'24px', background:'white', fontSize:'14px', cursor:'pointer', fontWeight:'500', color:'#374151' }}>
                Discard
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding:'10px 28px', background: saved ? '#16a34a' : '#006bff', color:'white', border:'none',
                borderRadius:'24px', fontSize:'14px', fontWeight:'600', cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1, transition:'background 0.2s'
              }}>
                {saving ? 'Saving…' : saved ? '✅ Saved!' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {activeTab==='calendar' && (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'32px' }}>
            <p style={{ fontSize:'16px', fontWeight:'600', color:'#111827', marginBottom:'8px' }}>Calendar settings</p>
            <p style={{ fontSize:'14px', color:'#9ca3af' }}>Connect your calendar to check for conflicts and add new events automatically.</p>
            <button style={{ marginTop:'20px', padding:'10px 24px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>
              Connect a calendar
            </button>
          </div>
        )}

        {activeTab==='advanced' && (
          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'32px' }}>
            <p style={{ fontSize:'16px', fontWeight:'600', color:'#111827', marginBottom:'8px' }}>Advanced settings</p>
            <p style={{ fontSize:'14px', color:'#9ca3af' }}>Configure minimum scheduling notice, buffer time, and other advanced options.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Availability;