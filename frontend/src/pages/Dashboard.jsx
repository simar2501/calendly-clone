import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoCal   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoShare = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IcoEmbed = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IcoLink  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoDots  = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const IcoPen   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoX     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPlus  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoCopy  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoCheck = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoGlobe = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

const DAYS_SHORT = ['S','M','T','W','T','F','S'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const fmt12 = (t) => {
  if (!t) return '';
  const [h,m] = t.slice(0,5).split(':');
  const hour = parseInt(h);
  return `${hour%12||12}:${m}${hour>=12?'pm':'am'}`;
};

const defaultSchedule = () => DAYS_FULL.map((_,i) => ({
  day_of_week: i, start_time: '09:00', end_time: '17:00', is_active: i>=1 && i<=5,
}));

// ─── Single-Use Link Modal ────────────────────────────────────────────────────
const SingleUseLinkModal = ({ event, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: event.title || event.name || '',
    duration: event.duration,
    location: event.location || '',
  });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const DURATIONS = [15, 30, 45, 60, 90];

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await API.post('/api/single-use-links/', {
        event_type_id: event.id,
        title: form.title !== (event.title || event.name) ? form.title : null,
        duration: form.duration !== event.duration ? form.duration : null,
        location: form.location !== (event.location || '') ? form.location : null,
      });
      setCreated(res.data);
      onCreated && onCreated();
    } catch (e) {
      alert('Error creating link: ' + (e.response?.data?.detail || e.message));
    } finally { setCreating(false); }
  };

  const bookingUrl = created ? `${window.location.origin}/book/one-time/${created.token}` : '';
  const handleCopy = () => { navigator.clipboard.writeText(bookingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000 }}>
      <div style={{ background:'white', borderRadius:'12px', width:'480px', maxWidth:'95vw', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#1a1a2e' }}>Create a one-time link</h3>
            <p style={{ fontSize:'13px', color:'#6b7280', marginTop:'2px' }}>Expires after one booking</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', padding:'4px', borderRadius:'6px', display:'flex' }}><IcoX/></button>
        </div>
        {!created ? (
          <>
            <div style={{ padding:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', background:'#f8f9ff', borderRadius:'8px', marginBottom:'20px', border:'1px solid #e8eaf6' }}>
                <div style={{ width:'8px', height:'36px', borderRadius:'4px', background:event.color||'#006bff', flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:'11px', fontWeight:'600', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>Based on</p>
                  <p style={{ fontSize:'14px', color:'#1a1a2e', fontWeight:'600' }}>{event.title || event.name}</p>
                </div>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'5px' }}>Link name</label>
                <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', transition:'border 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' }}>Duration</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setForm({...form,duration:d})}
                      style={{ padding:'7px 14px', border:`1.5px solid ${form.duration===d?'#006bff':'#e5e7eb'}`, borderRadius:'20px', background:form.duration===d?'#eff6ff':'white', color:form.duration===d?'#006bff':'#374151', fontSize:'13px', cursor:'pointer', fontWeight:form.duration===d?'600':'400', transition:'all 0.15s' }}>
                      {d < 60 ? `${d} min` : `${d/60} hr`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'5px' }}>Location <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optional)</span></label>
                <input type="text" placeholder={event.location || 'Same as event type'} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#d1d5db'}/>
              </div>
            </div>
            <div style={{ padding:'16px 24px', borderTop:'1px solid #f3f4f6', display:'flex', gap:'12px', justifyContent:'flex-end', background:'#fafafa' }}>
              <button onClick={onClose} style={{ padding:'9px 20px', border:'1px solid #d1d5db', borderRadius:'6px', background:'white', fontSize:'14px', cursor:'pointer', color:'#374151', fontWeight:'500' }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.title}
                style={{ padding:'9px 24px', background:form.title?'#006bff':'#e5e7eb', color:form.title?'white':'#9ca3af', border:'none', borderRadius:'6px', fontSize:'14px', fontWeight:'600', cursor:form.title?'pointer':'default', transition:'background 0.2s' }}>
                {creating ? 'Creating…' : 'Create link'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding:'32px 24px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="26" height="26" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize:'16px', fontWeight:'700', color:'#1a1a2e', marginBottom:'6px' }}>One-time link created!</h3>
            <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'24px' }}>Share this with your invitee. It expires after one use.</p>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
              <input readOnly value={bookingUrl} style={{ flex:1, padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'13px', color:'#374151', background:'#f9fafb' }}/>
              <button onClick={handleCopy} style={{ padding:'10px 18px', background:copied?'#16a34a':'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', minWidth:'90px', justifyContent:'center', transition:'background 0.2s' }}>
                {copied ? <><IcoCheck/> Copied!</> : <><IcoCopy/> Copy</>}
              </button>
            </div>
            <button onClick={onClose} style={{ fontSize:'14px', color:'#006bff', background:'none', border:'none', cursor:'pointer', fontWeight:'500' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Availability Editor ──────────────────────────────────────────────────────
const AvailabilityEditor = ({ onClose }) => {
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addOverrideDate, setAddOverrideDate] = useState('');

  useEffect(() => {
    API.get('/api/availability/').then(res => {
      const data = res.data.availability || res.data;
      if (data.length > 0) {
        const updated = DAYS_FULL.map((_,i) => {
          const found = data.find(a => a.day_of_week === i);
          return found ? { day_of_week:i, start_time:found.start_time.slice(0,5), end_time:found.end_time.slice(0,5), is_active:found.is_active }
            : { day_of_week:i, start_time:'09:00', end_time:'17:00', is_active:false };
        });
        setSchedule(updated);
      }
      if (res.data.date_overrides) setOverrides(res.data.date_overrides);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const toggle = (i) => { const s=[...schedule]; s[i]={...s[i],is_active:!s[i].is_active}; setSchedule(s); };
  const setTime = (i,field,val) => { const s=[...schedule]; s[i]={...s[i],[field]:val}; setSchedule(s); };
  const addOverride = () => {
    if (!addOverrideDate || overrides.find(o=>o.date===addOverrideDate)) return;
    setOverrides([...overrides,{date:addOverrideDate,start_time:'09:00',end_time:'17:00'}]);
    setAddOverrideDate('');
  };
  const removeOverride = (date) => setOverrides(overrides.filter(o=>o.date!==date));
  const setOverrideTime = (date,field,val) => setOverrides(overrides.map(o=>o.date===date?{...o,[field]:val}:o));
  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/api/availability/', { availability: schedule, date_overrides: overrides });
      setSaved(true); setTimeout(()=>setSaved(false),2000);
    } catch(e){ alert('Error saving'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{padding:'20px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Loading…</div>;

  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:'10px',overflow:'hidden',marginTop:'8px'}}>
      <div style={{background:'#f0f7ff',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #dbeafe'}}>
        <span style={{fontSize:'12px',color:'#3b82f6',fontWeight:'500'}}>Changes apply to all event types</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',display:'flex'}}><IcoX/></button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0',minHeight:'200px'}}>
        <div style={{padding:'14px',borderRight:'1px solid #e5e7eb'}}>
          <p style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Weekly hours</p>
          {schedule.map((row,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
              <div onClick={()=>toggle(i)} style={{width:'26px',height:'26px',borderRadius:'6px',flexShrink:0,cursor:'pointer',
                background:row.is_active?'#006bff':'#e5e7eb',color:row.is_active?'white':'#9ca3af',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700',userSelect:'none'}}>
                {DAYS_SHORT[i]}
              </div>
              {row.is_active ? (
                <div style={{display:'flex',alignItems:'center',gap:'4px',flex:1}}>
                  <input type="time" value={row.start_time} onChange={e=>setTime(i,'start_time',e.target.value)}
                    style={{flex:1,padding:'4px 6px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'12px'}}/>
                  <span style={{color:'#9ca3af',fontSize:'11px'}}>–</span>
                  <input type="time" value={row.end_time} onChange={e=>setTime(i,'end_time',e.target.value)}
                    style={{flex:1,padding:'4px 6px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'12px'}}/>
                  <button onClick={()=>toggle(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'2px',display:'flex'}}><IcoX/></button>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:'6px',flex:1}}>
                  <span style={{fontSize:'12px',color:'#9ca3af',flex:1}}>Unavailable</span>
                  <button onClick={()=>toggle(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:'2px',display:'flex'}}><IcoPlus/></button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{padding:'14px'}}>
          <p style={{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Date overrides</p>
          <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
            <input type="date" value={addOverrideDate} onChange={e=>setAddOverrideDate(e.target.value)}
              style={{flex:1,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'12px'}}/>
            <button onClick={addOverride} style={{padding:'5px 10px',background:'#006bff',color:'white',border:'none',borderRadius:'6px',fontSize:'12px',cursor:'pointer'}}>Add</button>
          </div>
          {overrides.length===0 ? <p style={{fontSize:'12px',color:'#9ca3af'}}>No overrides</p> : overrides.map(ov=>(
            <div key={ov.date} style={{marginBottom:'8px',padding:'8px',background:'#f9fafb',borderRadius:'6px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <span style={{fontSize:'12px',fontWeight:'600',color:'#374151'}}>{ov.date}</span>
                <button onClick={()=>removeOverride(ov.date)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',display:'flex'}}><IcoX/></button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <input type="time" value={ov.start_time} onChange={e=>setOverrideTime(ov.date,'start_time',e.target.value)}
                  style={{flex:1,padding:'4px 6px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'11px'}}/>
                <span style={{color:'#9ca3af',fontSize:'10px'}}>–</span>
                <input type="time" value={ov.end_time} onChange={e=>setOverrideTime(ov.date,'end_time',e.target.value)}
                  style={{flex:1,padding:'4px 6px',border:'1px solid #d1d5db',borderRadius:'6px',fontSize:'11px'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:'10px 14px',borderTop:'1px solid #e5e7eb',display:'flex',justifyContent:'flex-end',gap:'8px',background:'#fafafa'}}>
        <button onClick={onClose} style={{padding:'7px 16px',border:'1px solid #d1d5db',borderRadius:'6px',background:'white',fontSize:'13px',cursor:'pointer',color:'#374151'}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{padding:'7px 20px',background:'#006bff',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
          {saving?'Saving…':saved?'✓ Saved':'Save changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Availability Preview ─────────────────────────────────────────────────────
const AvailabilityPreview = ({ onEditClick }) => {
  const [avail, setAvail] = useState([]);
  useEffect(() => {
    API.get('/api/availability/').then(res=>{
      const data = res.data.availability || res.data;
      setAvail(data.length>0?data:defaultSchedule());
    }).catch(()=>setAvail(defaultSchedule()));
  }, []);
  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:'10px',overflow:'hidden'}}>
      <div style={{background:'#f8f9ff',padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #e8eaf6'}}>
        <span style={{fontSize:'12px',color:'#6b7280'}}>Using your default schedule</span>
        <button onClick={onEditClick} style={{background:'none',border:'none',cursor:'pointer',color:'#006bff',display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',fontWeight:'500'}}>
          <IcoPen/> Edit
        </button>
      </div>
      <div style={{padding:'14px'}}>
        {DAYS_FULL.map((_,i)=>{
          const row = avail.find(a => Number(a.day_of_week) === i); const active=row?.is_active;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'7px'}}>
              <div style={{width:'26px',height:'26px',borderRadius:'6px',flexShrink:0,background:active?'#006bff':'#e5e7eb',color:active?'white':'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'700'}}>
                {DAYS_SHORT[i]}
              </div>
              <span style={{fontSize:'12px',color:active?'#374151':'#9ca3af'}}>
                {active?`${fmt12(row.start_time)}  –  ${fmt12(row.end_time)}`:'Unavailable'}
              </span>
            </div>
          );
        })}
        <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'8px'}}>
          <IcoGlobe/>
          <span style={{fontSize:'11px',color:'#9ca3af'}}>India Standard Time</span>
        </div>
      </div>
    </div>
  );
};

// ─── Duration Picker ──────────────────────────────────────────────────────────
const DurationPicker = ({ value, onChange }) => {
  const PRESETS = [15,30,45,60];
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef(null);

  useEffect(()=>{
    const h=(e)=>{if(dropRef.current&&!dropRef.current.contains(e.target))setShowDropdown(false);};
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  const label = PRESETS.includes(value)?(value<60?`${value} min`:'1 hr'):`${value} min`;

  if (showCustom) return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:'8px',padding:'14px'}}>
      <button onClick={()=>setShowCustom(false)} style={{background:'none',border:'none',color:'#006bff',fontSize:'13px',cursor:'pointer',marginBottom:'10px',padding:0}}>← Back</button>
      <p style={{fontSize:'14px',fontWeight:'600',color:'#111827',marginBottom:'10px'}}>Custom duration</p>
      <div style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <input type="number" min="1" max="720" value={customVal} onChange={e=>setCustomVal(e.target.value)}
            style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${!customVal?'#ef4444':'#d1d5db'}`,borderRadius:'8px',fontSize:'14px',boxSizing:'border-box'}}/>
        </div>
        <select style={{padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:'8px',fontSize:'14px'}}><option>min</option></select>
      </div>
      <div style={{display:'flex',gap:'8px',marginTop:'12px',justifyContent:'flex-end'}}>
        <button onClick={()=>setShowCustom(false)} style={{padding:'8px 16px',border:'1px solid #d1d5db',borderRadius:'6px',background:'white',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
        <button onClick={()=>{if(customVal){onChange(parseInt(customVal));setShowCustom(false);}}} disabled={!customVal}
          style={{padding:'8px 16px',background:customVal?'#006bff':'#e5e7eb',color:customVal?'white':'#9ca3af',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:'600',cursor:customVal?'pointer':'default'}}>
          Apply
        </button>
      </div>
    </div>
  );

  return (
    <div style={{position:'relative'}} ref={dropRef}>
      <button onClick={()=>setShowDropdown(!showDropdown)} style={{width:'100%',padding:'10px 14px',border:`1.5px solid ${showDropdown?'#006bff':'#d1d5db'}`,borderRadius:'8px',background:'white',fontSize:'14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',color:'#111827',transition:'border 0.2s'}}>
        <span>{label}</span><span style={{transform:showDropdown?'rotate(180deg)':'none',transition:'0.2s',color:'#6b7280'}}>▾</span>
      </button>
      {showDropdown&&(
        <div style={{position:'absolute',top:'110%',left:0,right:0,background:'white',border:'1px solid #e5e7eb',borderRadius:'8px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',zIndex:99,overflow:'hidden'}}>
          {PRESETS.map(p=>(
            <div key={p} onClick={()=>{onChange(p);setShowDropdown(false);}}
              style={{padding:'11px 16px',cursor:'pointer',fontSize:'14px',color:'#111827',display:'flex',justifyContent:'space-between',background:value===p?'#eff6ff':'white'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
              onMouseLeave={e=>e.currentTarget.style.background=value===p?'#eff6ff':'white'}>
              {p<60?`${p} min`:'1 hr'}{value===p&&<span style={{color:'#006bff'}}>✓</span>}
            </div>
          ))}
          <div onClick={()=>{setShowDropdown(false);setShowCustom(true);}}
            style={{padding:'11px 16px',cursor:'pointer',fontSize:'14px',color:'#111827',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid #f3f4f6'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
            onMouseLeave={e=>e.currentTarget.style.background='white'}>
            Custom<span style={{color:'#9ca3af'}}>›</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [eventTypes, setEventTypes] = useState([]);
  const [singleUseLinks, setSingleUseLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('event-types');
  const [showForm, setShowForm] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('One-on-one');
  const [showAvailEditor, setShowAvailEditor] = useState(false);
  const [inviteeLimit, setInviteeLimit] = useState(2);
  const [showInviteeLimit, setShowInviteeLimit] = useState(true);
  const [displayRemainingSpots, setDisplayRemainingSpots] = useState(false);
  const [singleUseLinkModal, setSingleUseLinkModal] = useState(null);
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', duration:30, slug:'', color:'#006bff', location:'', is_single_use:false });
  const menuRef = useRef(null);

  useEffect(()=>{ fetchEventTypes(); fetchSingleUseLinks(); },[]);

  useEffect(()=>{
    const createParam = searchParams.get('create');
    if (createParam) { const label = decodeURIComponent(createParam); setSearchParams({}); openForm(label); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[searchParams]);

  useEffect(()=>{
    const h=(e)=>{ if(menuRef.current&&!menuRef.current.contains(e.target)){setMenuOpenId(null);setShowCreateMenu(false);} };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  const fetchEventTypes = async () => { try { const r=await API.get('/api/event-types/'); setEventTypes(r.data); } catch(e){console.error(e);} };
  const fetchSingleUseLinks = async () => { try { const r=await API.get('/api/single-use-links/'); setSingleUseLinks(r.data); } catch(e){ setSingleUseLinks([]); } };
  const generateSlug = (t) => t.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');

  const openForm = (category='One-on-one') => {
    if (category === 'Meeting Poll') {
      navigate('/polls?create=true');
      setShowCreateMenu(false);
      return;
    }
    setEditingEvent(null);
    setSelectedCategory(category);
    setForm({title:'',description:'',duration:30,slug:'',color:'#006bff',location:'',is_single_use:false});
    setShowAvailEditor(false);
    setShowCreateMenu(false);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = { title:form.title, slug:form.slug||generateSlug(form.title), duration:parseInt(form.duration), description:form.description, color:form.color, location:form.location };
      if (editingEvent) await API.put(`/api/event-types/${editingEvent.id}`, payload);
      else await API.post('/api/event-types/', payload);
      setShowForm(false); setEditingEvent(null); setShowAvailEditor(false);
      fetchEventTypes();
    } catch(e){ alert('Error: '+(e.response?.data?.detail||e.message)); }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setForm({ title:event.name||event.title||'', description:event.description||'', duration:event.duration, slug:event.slug, color:event.color||'#006bff', location:event.location||'', is_single_use:false });
    setMenuOpenId(null); setShowAvailEditor(false); setShowForm(true);
  };

  const handleDelete = async (id) => { if(window.confirm('Delete this event type?')){ await API.delete(`/api/event-types/${id}`); setMenuOpenId(null); fetchEventTypes(); } };
  const handleDeleteLink = async (id) => { if(window.confirm('Delete this link?')){ await API.delete(`/api/single-use-links/${id}`); fetchSingleUseLinks(); } };
  const copyLink = (slug) => { navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`); setMenuOpenId(null); };
  const copySingleUseLink = (token, id) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/one-time/${token}`);
    setCopiedLinkId(id); setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const filtered = eventTypes.filter(e=>(e.name||e.title||'').toLowerCase().includes(search.toLowerCase()));

  const LOCATION_TYPES = [
    { icon:'📹', label:'Zoom' },
    { icon:'🟢', label:'Google Meet' },
    { icon:'📞', label:'Phone call' },
    { icon:'📍', label:'In-person' },
  ];

  const createMenuSections = [
    { section:'Event type', items:[
      {label:'One-on-one', icon:'👤', desc:'One host · One invitee'},
      {label:'Group', icon:'👥', desc:'One host · Many invitees'},
      {label:'Round robin', icon:'🔄', desc:'Rotating hosts · One invitee'},
      {label:'Collective', icon:'🤝', desc:'Many hosts · One invitee'},
    ]},
    { section:'More ways to meet', items:[
      {label:'One-off meeting', icon:'⚡', desc:'Outside your normal schedule'},
      {label:'Meeting Poll', icon:'🗳️', desc:'Let invitees vote on times'},
    ]},
  ];

  const tabs = [
    { key:'event-types', label:'Event Types' },
    { key:'single-use', label:`One-time links${singleUseLinks.length > 0 ? ` (${singleUseLinks.length})` : ''}` },
  ];

  return (
    <div style={{ padding:'40px 48px', maxWidth:'1000px', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }} ref={menuRef}>

      {/* Single-use modal */}
      {singleUseLinkModal && (
        <SingleUseLinkModal event={singleUseLinkModal} onClose={() => setSingleUseLinkModal(null)} onCreated={() => { fetchSingleUseLinks(); setActiveTab('single-use'); }}/>
      )}

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a2e', margin:0 }}>Event Types</h1>
          <p style={{ fontSize:'14px', color:'#6b7280', marginTop:'4px' }}>Create and manage your scheduling event types</p>
        </div>
        <div style={{ position:'relative' }}>
          <button onClick={()=>setShowCreateMenu(!showCreateMenu)}
            style={{ background:'#006bff', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 1px 3px rgba(0,107,255,0.3)' }}>
            <IcoPlus/> New event type <span style={{ fontSize:'12px', opacity:0.8 }}>▾</span>
          </button>
          {showCreateMenu && (
            <div style={{ position:'absolute', right:0, top:'48px', background:'white', borderRadius:'12px', boxShadow:'0 8px 32px rgba(0,0,0,0.12)', width:'320px', zIndex:1000, border:'1px solid #e5e7eb', overflow:'hidden' }}>
              {createMenuSections.map((section, si) => (
                <div key={si}>
                  <p style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', margin:'0', padding:'12px 16px 6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{section.section}</p>
                  {section.items.map(item => (
                    <div key={item.label} onClick={()=>openForm(item.label)}
                      style={{ padding:'10px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'background 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8f9ff'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{ fontSize:'18px', width:'28px', textAlign:'center' }}>{item.icon}</span>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:0 }}>{item.label}</p>
                        <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  {si < createMenuSections.length-1 && <div style={{ height:'1px', background:'#f3f4f6', margin:'4px 0' }}/>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom:'1px solid #e5e7eb', marginBottom:'24px' }}>
        <div style={{ display:'flex', gap:'4px' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              style={{ padding:'10px 16px', border:'none', background:'none', fontSize:'14px', fontWeight:'500', cursor:'pointer',
                color: activeTab===tab.key ? '#006bff' : '#6b7280',
                borderBottom: activeTab===tab.key ? '2px solid #006bff' : '2px solid transparent',
                marginBottom:'-1px', transition:'color 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Event Types Tab ── */}
      {activeTab==='event-types' && (
        <>
          {/* Search */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{ position:'relative', maxWidth:'360px' }}>
              <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af', fontSize:'14px' }}>🔍</span>
              <input placeholder="Search event types…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', background:'white' }}
                onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
          </div>

          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'visible', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Profile row */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#006bff,#3b82f6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'14px' }}>J</div>
                <div>
                  <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:0 }}>John Doe</p>
                  <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>your-link.schedulr.com</p>
                </div>
              </div>
              <button style={{ background:'none', border:'1px solid #e5e7eb', color:'#374151', fontSize:'13px', cursor:'pointer', padding:'6px 12px', borderRadius:'6px', display:'flex', alignItems:'center', gap:'6px', fontWeight:'500' }}>
                <IcoGlobe/> View public page
              </button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding:'60px 48px', textAlign:'center' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'24px' }}>📅</div>
                <p style={{ fontSize:'16px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 6px' }}>No event types yet</p>
                <p style={{ fontSize:'14px', color:'#9ca3af', margin:'0 0 20px' }}>Create your first event type to start scheduling</p>
                <button onClick={()=>openForm('One-on-one')} style={{ padding:'10px 24px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>+ New event type</button>
              </div>
            ) : (
              <>
                {filtered.map(event => (
                  <div key={event.id}
                    style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:'14px', position:'relative', background: hoveredEventId===event.id ? '#fafbff' : 'white', transition:'background 0.15s' }}
                    onMouseEnter={()=>setHoveredEventId(event.id)}
                    onMouseLeave={()=>setHoveredEventId(null)}>

                    {/* Color bar */}
                    <div style={{ width:'4px', height:'48px', borderRadius:'4px', background:event.color||'#006bff', flexShrink:0 }}/>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <h3 style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{event.name||event.title}</h3>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <span style={{ fontSize:'13px', color:'#6b7280' }}>⏱ {event.duration} min</span>
                        {event.location && <span style={{ fontSize:'13px', color:'#6b7280' }}>📍 {event.location}</span>}
                        <span style={{ fontSize:'12px', color:'#9ca3af', background:'#f3f4f6', padding:'2px 8px', borderRadius:'10px' }}>One-on-one</span>
                      </div>
                    </div>

                    {/* Actions — visible on hover */}
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', opacity: hoveredEventId===event.id ? 1 : 0, transition:'opacity 0.15s' }}>
                      <button onClick={()=>setSingleUseLinkModal(event)}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', border:'1px solid #e5e7eb', borderRadius:'6px', background:'white', fontSize:'13px', fontWeight:'500', color:'#374151', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#006bff';e.currentTarget.style.color='#006bff';e.currentTarget.style.background='#f0f7ff';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#374151';e.currentTarget.style.background='white';}}>
                        <IcoLink/> One-time link
                      </button>
                      <button onClick={()=>navigate(`/book/${event.slug}`)} title="Preview"
                        style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#6b7280';}}>
                        <IcoCal/>
                      </button>
                      <button onClick={()=>copyLink(event.slug)} title="Copy link"
                        style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#f0f7ff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#6b7280';}}>
                        <IcoShare/>
                      </button>
                    </div>

                    {/* Always-visible copy link + dots menu */}
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
                      <button onClick={()=>copyLink(event.slug)}
                        style={{ padding:'7px 14px', border:'1px solid #e5e7eb', borderRadius:'6px', background:'white', fontSize:'13px', fontWeight:'500', color:'#374151', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#006bff';e.currentTarget.style.color='#006bff';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#374151';}}>
                        <IcoCopy/> Copy link
                      </button>
                      <div style={{ position:'relative' }}>
                        <button onClick={e=>{e.stopPropagation();setMenuOpenId(menuOpenId===event.id?null:event.id);}}
                          style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
                          <IcoDots/>
                        </button>
                        {menuOpenId===event.id && (
                          <div onClick={e=>e.stopPropagation()} style={{ position:'fixed', background:'white', borderRadius:'10px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', width:'200px', zIndex:9999, padding:'6px', border:'1px solid #e5e7eb', transform:'translateX(-160px) translateY(-8px)' }}>
                            {[
                              {label:'Edit', icon:'✏️', action:()=>handleEdit(event)},
                              {label:'Copy link', icon:'🔗', action:()=>copyLink(event.slug)},
                              {label:'One-time link', icon:'🔂', action:()=>{setSingleUseLinkModal(event);setMenuOpenId(null);}},
                              {label:'Preview booking page', icon:'👁️', action:()=>{navigate(`/book/${event.slug}`);setMenuOpenId(null);}},
                              {label:'Delete', icon:'🗑️', action:()=>handleDelete(event.id), danger:true},
                            ].map(item => (
                              <div key={item.label} onClick={item.action}
                                style={{ padding:'9px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'13px', color:item.danger?'#ef4444':'#374151', display:'flex', alignItems:'center', gap:'8px' }}
                                onMouseEnter={e=>e.currentTarget.style.background=item.danger?'#fff5f5':'#f8f9ff'}
                                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                <span>{item.icon}</span> {item.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding:'14px 20px' }}>
                  <button onClick={()=>openForm('One-on-one')} style={{ background:'none', border:'none', color:'#006bff', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                    <IcoPlus/> Add event type
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Single-Use Links Tab ── */}
      {activeTab==='single-use' && (
        <div>
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'flex-start', gap:'10px' }}>
            <span style={{ fontSize:'16px' }}>🔂</span>
            <p style={{ fontSize:'13px', color:'#92400e', margin:0 }}>
              <strong>One-time links</strong> expire after a single booking. Create them by hovering any event type and clicking "One-time link".
            </p>
          </div>

          <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            {singleUseLinks.length === 0 ? (
              <div style={{ padding:'60px 48px', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'12px' }}>🔗</div>
                <p style={{ fontSize:'15px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 6px' }}>No one-time links yet</p>
                <p style={{ fontSize:'13px', color:'#9ca3af', margin:'0 0 20px' }}>Hover any event type card and click "One-time link" to create one</p>
                <button onClick={()=>setActiveTab('event-types')} style={{ padding:'9px 20px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Go to Event Types</button>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 140px 80px', padding:'10px 20px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' }}>
                  {['Name','Duration','Status','Created',''].map((h,i) => (
                    <span key={i} style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
                  ))}
                </div>
                {singleUseLinks.map(link => {
                  const title = link.title || link.event_type?.title || '—';
                  const duration = link.duration || link.event_type?.duration;
                  const color = link.event_type?.color || '#006bff';
                  const isUsed = link.is_used;
                  const createdDate = new Date(link.created_at).toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
                  return (
                    <div key={link.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 140px 80px', padding:'14px 20px', borderBottom:'1px solid #f3f4f6', alignItems:'center', background:isUsed?'#fafafa':'white' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                        <div style={{ width:'4px', height:'36px', borderRadius:'4px', background:color, flexShrink:0 }}/>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:'14px', fontWeight:'600', color:isUsed?'#9ca3af':'#1a1a2e', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
                          <p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>{isUsed ? 'Expired' : `…/${link.token.slice(0,10)}…`}</p>
                        </div>
                      </div>
                      <span style={{ fontSize:'13px', color:'#6b7280' }}>{duration} min</span>
                      <span style={{ fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'12px', background:isUsed?'#f3f4f6':'#dcfce7', color:isUsed?'#6b7280':'#16a34a', width:'fit-content' }}>
                        {isUsed ? 'Used' : 'Active'}
                      </span>
                      <span style={{ fontSize:'12px', color:'#9ca3af' }}>{createdDate}</span>
                      <div style={{ display:'flex', gap:'4px' }}>
                        {!isUsed && (
                          <button onClick={()=>copySingleUseLink(link.token, link.id)} title="Copy"
                            style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:copiedLinkId===link.id?'#dcfce7':'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:copiedLinkId===link.id?'#16a34a':'#6b7280', transition:'all 0.2s' }}>
                            {copiedLinkId===link.id ? <IcoCheck/> : <IcoCopy/>}
                          </button>
                        )}
                        <button onClick={()=>handleDeleteLink(link.id)} title="Delete"
                          style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', transition:'all 0.15s' }}
                          onMouseEnter={e=>{e.currentTarget.style.background='#fff5f5';e.currentTarget.style.color='#ef4444';}}
                          onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#9ca3af';}}>
                          <IcoX/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Create/Edit Form Panel ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'flex-end', zIndex:2000 }}>
          <div style={{ background:'white', height:'100vh', width:'500px', overflowY:'auto', display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.1)' }}>
            {/* Panel header */}
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:'12px', flexShrink:0, background:'white', position:'sticky', top:0, zIndex:10 }}>
              <button onClick={()=>{setShowForm(false);setEditingEvent(null);setShowAvailEditor(false);}}
                style={{ background:'none', border:'1px solid #e5e7eb', cursor:'pointer', color:'#374151', fontSize:'13px', padding:'6px 10px', borderRadius:'6px', fontWeight:'500', display:'flex', alignItems:'center', gap:'4px' }}>
                ← Back
              </button>
              <div style={{ flex:1 }}>
                <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#1a1a2e', margin:0 }}>{editingEvent ? 'Edit Event Type' : 'New Event Type'}</h2>
                <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>{selectedCategory}</p>
              </div>
              <button onClick={()=>{setShowForm(false);setEditingEvent(null);setShowAvailEditor(false);}}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:'4px' }}>
                <IcoX/>
              </button>
            </div>

            <div style={{ padding:'24px', flex:1 }}>
              {/* Title + Color */}
              <div style={{ marginBottom:'24px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Event name</label>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', border:'1.5px solid #006bff', borderRadius:'8px', padding:'10px 12px', background:'white' }}>
                  <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}
                    style={{ width:'28px', height:'28px', border:'none', cursor:'pointer', borderRadius:'50%', padding:0, flexShrink:0 }}/>
                  <input type="text" placeholder="e.g. 30 Minute Meeting" value={form.title}
                    onChange={e=>setForm({...form,title:e.target.value,slug:!editingEvent?generateSlug(e.target.value):form.slug})}
                    style={{ border:'none', outline:'none', fontSize:'15px', flex:1, fontWeight:'500', color:'#1a1a2e' }}/>
                </div>
              </div>

              {/* Duration */}
              <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', marginBottom:'12px' }}>⏱ Duration</p>
                <DurationPicker value={form.duration} onChange={v=>setForm({...form,duration:v})}/>
              </div>

              {/* Location */}
              <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', marginBottom:'12px' }}>📍 Location</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                  {LOCATION_TYPES.map(loc => (
                    <button key={loc.label} onClick={()=>setForm({...form,location:loc.label})}
                      style={{ padding:'12px', border:`1.5px solid ${form.location===loc.label?'#006bff':'#e5e7eb'}`, borderRadius:'8px', background:form.location===loc.label?'#eff6ff':'white', cursor:'pointer', fontSize:'13px', color:form.location===loc.label?'#006bff':'#374151', display:'flex', alignItems:'center', gap:'8px', fontWeight:form.location===loc.label?'600':'400', transition:'all 0.15s' }}>
                      <span style={{ fontSize:'18px' }}>{loc.icon}</span>{loc.label}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Or type a custom location…" value={form.location}
                  onChange={e=>setForm({...form,location:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>

              {/* Availability */}
              <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', marginBottom:'12px' }}>📅 Availability</p>
                {showAvailEditor
                  ? <AvailabilityEditor onClose={()=>setShowAvailEditor(false)}/>
                  : <AvailabilityPreview onEditClick={()=>setShowAvailEditor(true)}/>
                }
              </div>

              {/* Group invitee limit */}
              {selectedCategory==='Group' && (
                <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                  <div onClick={()=>setShowInviteeLimit(!showInviteeLimit)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom:showInviteeLimit?'12px':0 }}>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:0 }}>👥 Invitee limit</p>
                    <span style={{ color:'#9ca3af', fontSize:'13px' }}>{showInviteeLimit?'▲':'▼'}</span>
                  </div>
                  {showInviteeLimit && (
                    <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'14px' }}>
                      <input type="number" min="2" value={inviteeLimit} onChange={e=>setInviteeLimit(parseInt(e.target.value))}
                        style={{ width:'80px', padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'15px', fontWeight:'600', textAlign:'center' }}/>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'10px' }}>
                        <input type="checkbox" id="spots" checked={displayRemainingSpots} onChange={e=>setDisplayRemainingSpots(e.target.checked)} style={{ width:'16px', height:'16px', cursor:'pointer' }}/>
                        <label htmlFor="spots" style={{ fontSize:'13px', color:'#374151', cursor:'pointer' }}>Show remaining spots on booking page</label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', marginBottom:'8px' }}>📝 Description</p>
                <textarea placeholder="What is this meeting about?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', height:'80px', resize:'vertical', boxSizing:'border-box', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>

              {/* Slug */}
              <div style={{ padding:'16px 0', borderTop:'1px solid #f3f4f6' }}>
                <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', marginBottom:'8px' }}>🔗 URL Slug</p>
                <input type="text" placeholder="e.g. 30-min-meeting" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                <p style={{ fontSize:'11px', color:'#9ca3af', marginTop:'4px' }}>Booking link: /book/{form.slug || '…'}</p>
              </div>
            </div>

            {/* Panel footer */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid #e5e7eb', display:'flex', gap:'12px', flexShrink:0, background:'white', position:'sticky', bottom:0 }}>
              <button onClick={()=>{setShowForm(false);setEditingEvent(null);setShowAvailEditor(false);}}
                style={{ flex:1, padding:'11px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', background:'white', cursor:'pointer', fontWeight:'500', color:'#374151' }}>
                Cancel
              </button>
              <button onClick={handleSubmit}
                style={{ flex:1, padding:'11px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,107,255,0.3)', transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='#0057d9'}
                onMouseLeave={e=>e.currentTarget.style.background='#006bff'}>
                {editingEvent ? 'Save changes' : 'Create event type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;