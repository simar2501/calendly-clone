import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import dayjs from 'dayjs';

const IcoX     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoCopy  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoCheck = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoPlus  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoChevron = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;

// ─── Create Poll Modal ────────────────────────────────────────────────────────
const CreatePollModal = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title:'', description:'', duration:30, location:'', color:'#006bff' });
  const [slots, setSlots] = useState([{ date:'', start_time:'09:00', end_time:'10:00' }]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const DURATIONS = [15, 30, 45, 60, 90];

  const addSlot = () => setSlots([...slots, { date:'', start_time:'09:00', end_time:'10:00' }]);
  const removeSlot = (i) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, val) => { const s=[...slots]; s[i]={...s[i],[field]:val}; setSlots(s); };

  const handleCreate = async () => {
    const validSlots = slots.filter(s => s.date && s.start_time && s.end_time);
    if (!form.title) { alert('Please enter a title'); return; }
    if (validSlots.length === 0) { alert('Add at least one time slot'); return; }
    setCreating(true);
    try {
      const time_slots = validSlots.map(s => ({
        start_time: `${s.date}T${s.start_time}:00`,
        end_time: `${s.date}T${s.end_time}:00`,
      }));
      const res = await API.post('/api/polls/', { ...form, time_slots });
      setCreated(res.data);
      setStep(3);
      onCreated && onCreated();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    } finally { setCreating(false); }
  };

  const pollUrl = created ? `${window.location.origin}/poll/${created.token}` : '';
  const handleCopy = () => { navigator.clipboard.writeText(pollUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const stepLabels = ['Details', 'Time slots', 'Share'];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000 }}>
      <div style={{ background:'white', borderRadius:'16px', width:'560px', maxWidth:'95vw', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <h3 style={{ fontSize:'17px', fontWeight:'700', color:'#1a1a2e', margin:'0 0 4px' }}>New Meeting Poll</h3>
            {/* Step indicator */}
            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              {stepLabels.map((label, i) => (
                <React.Fragment key={i}>
                  <span style={{ fontSize:'12px', fontWeight: step === i+1 ? '700' : '400', color: step > i ? '#006bff' : step === i+1 ? '#006bff' : '#9ca3af' }}>
                    {step > i+1 ? '✓ ' : ''}{label}
                  </span>
                  {i < stepLabels.length - 1 && <span style={{ color:'#e5e7eb', fontSize:'12px' }}>›</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px', borderRadius:'6px', display:'flex' }}><IcoX/></button>
        </div>

        <div style={{ overflowY:'auto', flex:1 }}>

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div style={{ padding:'24px' }}>
              <div style={{ marginBottom:'20px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Poll title *</label>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', border:'1.5px solid #006bff', borderRadius:'8px', padding:'10px 12px' }}>
                  <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}
                    style={{ width:'28px', height:'28px', border:'none', cursor:'pointer', borderRadius:'50%', padding:0, flexShrink:0 }}/>
                  <input type="text" placeholder="e.g. Team sync — pick a time" value={form.title}
                    onChange={e=>setForm({...form,title:e.target.value})}
                    style={{ border:'none', outline:'none', fontSize:'15px', flex:1, fontWeight:'500', color:'#1a1a2e' }}/>
                </div>
              </div>

              <div style={{ marginBottom:'20px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' }}>Duration</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => setForm({...form,duration:d})}
                      style={{ padding:'8px 16px', border:`1.5px solid ${form.duration===d?'#006bff':'#e5e7eb'}`, borderRadius:'20px', background:form.duration===d?'#eff6ff':'white', color:form.duration===d?'#006bff':'#374151', fontSize:'13px', cursor:'pointer', fontWeight:form.duration===d?'600':'400', transition:'all 0.15s' }}>
                      {d < 60 ? `${d} min` : `${d/60} hr`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:'20px' }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>
                  Location <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optional)</span>
                </label>
                <input type="text" placeholder="Zoom link, Google Meet, office address…" value={form.location}
                  onChange={e=>setForm({...form,location:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box', outline:'none', transition:'border 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>

              <div>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>
                  Description <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optional)</span>
                </label>
                <textarea placeholder="What is this meeting about?" value={form.description}
                  onChange={e=>setForm({...form,description:e.target.value})}
                  style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'14px', height:'72px', resize:'none', boxSizing:'border-box', outline:'none', transition:'border 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
            </div>
          )}

          {/* ── Step 2: Slots ── */}
          {step === 2 && (
            <div style={{ padding:'24px' }}>
              <div style={{ background:'#f8f9ff', border:'1px solid #e8eaf6', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'8px', height:'36px', borderRadius:'4px', background:form.color, flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 2px' }}>{form.title}</p>
                  <p style={{ fontSize:'13px', color:'#6b7280', margin:0 }}>{form.duration} min {form.location && `· ${form.location}`}</p>
                </div>
              </div>

              <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'16px' }}>Add the times you want to offer. Invitees will vote on which ones work.</p>

              {slots.map((slot, i) => (
                <div key={i} style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'10px', padding:'12px 14px', background:'white', border:'1px solid #e5e7eb', borderRadius:'8px' }}>
                  <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:'#eff6ff', color:'#006bff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>{i+1}</div>
                  <input type="date" value={slot.date} onChange={e=>updateSlot(i,'date',e.target.value)}
                    style={{ padding:'7px 10px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', flex:'1.2', outline:'none' }}
                    onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                  <input type="time" value={slot.start_time} onChange={e=>updateSlot(i,'start_time',e.target.value)}
                    style={{ padding:'7px 10px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', flex:1, outline:'none' }}
                    onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                  <span style={{ color:'#9ca3af', fontSize:'12px' }}>–</span>
                  <input type="time" value={slot.end_time} onChange={e=>updateSlot(i,'end_time',e.target.value)}
                    style={{ padding:'7px 10px', border:'1px solid #e5e7eb', borderRadius:'6px', fontSize:'13px', flex:1, outline:'none' }}
                    onFocus={e=>e.target.style.borderColor='#006bff'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                  {slots.length > 1 && (
                    <button onClick={()=>removeSlot(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:'4px', borderRadius:'4px', flexShrink:0 }}
                      onMouseEnter={e=>e.currentTarget.style.color='#ef4444'} onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}>
                      <IcoX/>
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addSlot}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', border:'1.5px dashed #d1d5db', borderRadius:'8px', background:'white', color:'#6b7280', fontSize:'13px', cursor:'pointer', marginTop:'4px', transition:'all 0.15s', width:'100%', justifyContent:'center' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#006bff';e.currentTarget.style.color='#006bff';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#d1d5db';e.currentTarget.style.color='#6b7280';}}>
                <IcoPlus/> Add another time option
              </button>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div style={{ padding:'40px 32px', textAlign:'center' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:'28px' }}>🗳️</div>
              <h3 style={{ fontSize:'18px', fontWeight:'700', color:'#1a1a2e', marginBottom:'8px' }}>Poll ready to share!</h3>
              <p style={{ fontSize:'14px', color:'#6b7280', marginBottom:'28px', lineHeight:'1.6' }}>
                Send this link to your invitees. They'll vote on which times work — then you confirm the best one.
              </p>
              <div style={{ display:'flex', gap:'8px', marginBottom:'16px', textAlign:'left' }}>
                <input readOnly value={pollUrl} style={{ flex:1, padding:'11px 12px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'13px', color:'#374151', background:'#f9fafb' }}/>
                <button onClick={handleCopy}
                  style={{ padding:'11px 20px', background:copied?'#16a34a':'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', minWidth:'100px', justifyContent:'center', transition:'background 0.2s', flexShrink:0 }}>
                  {copied ? <><IcoCheck/> Copied!</> : <><IcoCopy/> Copy link</>}
                </button>
              </div>
              <div style={{ background:'#f8f9ff', border:'1px solid #e8eaf6', borderRadius:'8px', padding:'12px 16px', marginBottom:'24px', textAlign:'left' }}>
                <p style={{ fontSize:'12px', color:'#4b5563', margin:0, lineHeight:'1.6' }}>
                  💡 Invitees will see the available time slots and mark which ones work for them. You'll be able to confirm the final time from the Polls page.
                </p>
              </div>
              <button onClick={onClose} style={{ fontSize:'14px', color:'#006bff', background:'none', border:'none', cursor:'pointer', fontWeight:'600' }}>Done</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid #f3f4f6', display:'flex', gap:'10px', justifyContent:'space-between', flexShrink:0, background:'#fafafa' }}>
            <div>
              {step === 2 && (
                <button onClick={()=>setStep(1)} style={{ padding:'9px 18px', border:'1px solid #e5e7eb', borderRadius:'8px', background:'white', fontSize:'14px', cursor:'pointer', color:'#374151', fontWeight:'500' }}>← Back</button>
              )}
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              {step === 1 && <button onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #e5e7eb', borderRadius:'8px', background:'white', fontSize:'14px', cursor:'pointer', color:'#374151' }}>Cancel</button>}
              {step === 1 && (
                <button onClick={()=>{ if(!form.title){alert('Please enter a title');return;} setStep(2); }}
                  style={{ padding:'9px 24px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 1px 3px rgba(0,107,255,0.3)' }}>
                  Next <IcoChevron/>
                </button>
              )}
              {step === 2 && (
                <button onClick={handleCreate} disabled={creating}
                  style={{ padding:'9px 24px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,107,255,0.3)' }}>
                  {creating ? 'Creating…' : '🗳️ Create poll'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Poll Detail / Results View ───────────────────────────────────────────────
const PollDetail = ({ poll, onClose, onRefresh }) => {
  const [confirming, setConfirming] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const pollUrl = `${window.location.origin}/poll/${poll.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopiedId(poll.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirm = async (slotId) => {
    if (!window.confirm('Confirm this time slot? This will send confirmations to all voters who marked it as available.')) return;
    setConfirming(true);
    try {
      await API.post(`/api/polls/${poll.id}/confirm`, { slot_id: slotId });
      onRefresh();
      onClose();
    } catch (e) {
      alert('Error confirming: ' + (e.response?.data?.detail || e.message));
    } finally { setConfirming(false); }
  };

  const maxVotes = Math.max(...poll.time_slots.map(s => s.yes_count), 1);

  // Group slots by date
  const slotsByDate = {};
  poll.time_slots.forEach(slot => {
    const date = dayjs(slot.start_time).format('YYYY-MM-DD');
    if (!slotsByDate[date]) slotsByDate[date] = [];
    slotsByDate[date].push(slot);
  });

  const allVoters = poll.voters || [];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000 }}>
      <div style={{ background:'white', borderRadius:'16px', width:'680px', maxWidth:'95vw', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.18)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'8px', height:'44px', borderRadius:'4px', background:poll.color||'#006bff', flexShrink:0 }}/>
            <div>
              <h3 style={{ fontSize:'17px', fontWeight:'700', color:'#1a1a2e', margin:'0 0 4px' }}>{poll.title}</h3>
              <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                <span style={{ fontSize:'13px', color:'#6b7280' }}>⏱ {poll.duration} min</span>
                {poll.location && <span style={{ fontSize:'13px', color:'#6b7280' }}>📍 {poll.location}</span>}
                <span style={{ fontSize:'12px', fontWeight:'600', padding:'2px 10px', borderRadius:'12px',
                  background: poll.status==='open'?'#dcfce7': poll.status==='confirmed'?'#dbeafe':'#f3f4f6',
                  color: poll.status==='open'?'#16a34a': poll.status==='confirmed'?'#1d4ed8':'#6b7280' }}>
                  {poll.status==='open'?'● Open': poll.status==='confirmed'?'✓ Confirmed':'● Closed'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', display:'flex', padding:'4px' }}><IcoX/></button>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'24px' }}>

          {/* Share link */}
          {poll.status === 'open' && (
            <div style={{ background:'#f8f9ff', border:'1px solid #e8eaf6', borderRadius:'10px', padding:'14px 16px', marginBottom:'24px', display:'flex', gap:'10px', alignItems:'center' }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'12px', fontWeight:'600', color:'#374151', margin:'0 0 2px' }}>Voting link</p>
                <p style={{ fontSize:'13px', color:'#6b7280', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pollUrl}</p>
              </div>
              <button onClick={copyLink}
                style={{ padding:'8px 16px', background:copiedId===poll.id?'#16a34a':'#006bff', color:'white', border:'none', borderRadius:'6px', fontSize:'13px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', flexShrink:0, transition:'background 0.2s' }}>
                {copiedId===poll.id ? <><IcoCheck/> Copied!</> : <><IcoCopy/> Copy</>}
              </button>
            </div>
          )}

          {/* Voter summary */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:0 }}>
              {allVoters.length} voter{allVoters.length !== 1 ? 's' : ''}
            </p>
            {allVoters.length > 0 && (
              <div style={{ display:'flex', gap:'-4px' }}>
                {allVoters.slice(0, 5).map((v, i) => (
                  <div key={i} title={v.name} style={{ width:'28px', height:'28px', borderRadius:'50%', background:`hsl(${(v.name.charCodeAt(0)*40)%360},60%,55%)`, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', border:'2px solid white', marginLeft: i > 0 ? '-8px' : 0, zIndex: 10-i }}>
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {allVoters.length > 5 && <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#e5e7eb', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700', border:'2px solid white', marginLeft:'-8px' }}>+{allVoters.length-5}</div>}
              </div>
            )}
          </div>

          {/* Slots by date */}
          {Object.entries(slotsByDate).map(([date, dateSlots]) => (
            <div key={date} style={{ marginBottom:'24px' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'10px' }}>
                {dayjs(date).format('dddd, MMMM D')}
              </p>
              {dateSlots.map(slot => {
                const pct = maxVotes > 0 ? (slot.yes_count / maxVotes) * 100 : 0;
                const isBest = slot.yes_count === maxVotes && slot.yes_count > 0;
                const isConfirmed = poll.confirmed_slot_id === slot.id;

                return (
                  <div key={slot.id} style={{ marginBottom:'10px', border:`1.5px solid ${isConfirmed?'#16a34a':isBest&&poll.status==='open'?'#006bff':'#e5e7eb'}`, borderRadius:'10px', padding:'14px 16px', background: isConfirmed?'#f0fdf4': isBest&&poll.status==='open'?'#f8fbff':'white', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                      <div>
                        <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 2px' }}>
                          {dayjs(slot.start_time).format('h:mm A')} – {dayjs(slot.end_time).format('h:mm A')}
                          {isConfirmed && <span style={{ marginLeft:'8px', fontSize:'12px', color:'#16a34a', fontWeight:'700' }}>✓ Confirmed</span>}
                          {isBest && !isConfirmed && poll.status==='open' && <span style={{ marginLeft:'8px', fontSize:'11px', color:'#006bff', fontWeight:'600', background:'#eff6ff', padding:'2px 8px', borderRadius:'10px' }}>Best</span>}
                        </p>
                        <p style={{ fontSize:'12px', color:'#9ca3af', margin:0 }}>{slot.yes_count} of {allVoters.length} available</p>
                      </div>
                      {poll.status === 'open' && !isConfirmed && (
                        <button onClick={()=>handleConfirm(slot.id)} disabled={confirming}
                          style={{ padding:'7px 14px', background: isBest?'#006bff':'white', color:isBest?'white':'#374151', border:`1px solid ${isBest?'#006bff':'#e5e7eb'}`, borderRadius:'6px', fontSize:'13px', fontWeight:'600', cursor:'pointer', transition:'all 0.15s', flexShrink:0 }}
                          onMouseEnter={e=>{if(!isBest){e.currentTarget.style.borderColor='#006bff';e.currentTarget.style.color='#006bff';}}}
                          onMouseLeave={e=>{if(!isBest){e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.color='#374151';}}}>
                          {confirming ? '…' : 'Confirm'}
                        </button>
                      )}
                    </div>

                    {/* Vote bar */}
                    <div style={{ background:'#f3f4f6', borderRadius:'4px', height:'6px', overflow:'hidden', marginBottom:'10px' }}>
                      <div style={{ width:`${pct}%`, height:'100%', background: isConfirmed?'#16a34a':isBest?'#006bff':'#93c5fd', borderRadius:'4px', transition:'width 0.3s' }}/>
                    </div>

                    {/* Voter avatars */}
                    {slot.votes.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                        {slot.votes.map((v, vi) => (
                          <div key={vi} title={`${v.voter_name} — ${v.available ? 'Available' : "Can't do"}`}
                            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'3px 8px 3px 5px', borderRadius:'20px', background: v.available ? '#dcfce7' : '#f3f4f6', border:`1px solid ${v.available?'#bbf7d0':'#e5e7eb'}` }}>
                            <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:`hsl(${(v.voter_name.charCodeAt(0)*40)%360},55%,55%)`, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'700', flexShrink:0 }}>
                              {v.voter_name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize:'11px', fontWeight:'500', color: v.available?'#16a34a':'#6b7280' }}>{v.voter_name}</span>
                            <span style={{ fontSize:'10px' }}>{v.available ? '✓' : '✗'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Polls Page ───────────────────────────────────────────────────────────────
const Polls = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [polls, setPolls] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPolls(); }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreate(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchPolls = async () => {
    try { const r = await API.get('/api/polls/'); setPolls(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this poll?')) return;
    await API.delete(`/api/polls/${id}`);
    fetchPolls();
  };

  const handleClose = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Close this poll? Invitees won\'t be able to vote anymore.')) return;
    await API.patch(`/api/polls/${id}/close`);
    fetchPolls();
  };

  const copyLink = (token, id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/poll/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusConfig = {
    open:      { bg:'#dcfce7', color:'#16a34a', label:'Open' },
    confirmed: { bg:'#dbeafe', color:'#1d4ed8', label:'Confirmed' },
    closed:    { bg:'#f3f4f6', color:'#6b7280', label:'Closed' },
  };

  return (
    <div style={{ padding:'40px 48px', maxWidth:'1000px', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {showCreate && <CreatePollModal onClose={()=>setShowCreate(false)} onCreated={fetchPolls}/>}
      {selectedPoll && <PollDetail poll={selectedPoll} onClose={()=>setSelectedPoll(null)} onRefresh={()=>{fetchPolls();setSelectedPoll(null);}}/>}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'700', color:'#1a1a2e', margin:'0 0 4px' }}>Meeting Polls</h1>
          <p style={{ fontSize:'14px', color:'#6b7280', margin:0 }}>Find the best time that works for everyone</p>
        </div>
        <button onClick={()=>setShowCreate(true)}
          style={{ background:'#006bff', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 1px 3px rgba(0,107,255,0.3)' }}>
          <IcoPlus/> New poll
        </button>
      </div>

      {/* How it works banner */}
      <div style={{ background:'#f8f9ff', border:'1px solid #e8eaf6', borderRadius:'12px', padding:'16px 20px', marginBottom:'28px' }}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'#1a1a2e', margin:'0 0 10px' }}>How meeting polls work</p>
        <div style={{ display:'flex', gap:'0', alignItems:'flex-start' }}>
          {[
            { icon:'🗳️', title:'Create a poll', desc:'Add title, duration, and time options' },
            { icon:'🔗', title:'Share the link', desc:'Send to invitees to vote on availability' },
            { icon:'✅', title:'Confirm the time', desc:'Pick the slot that works best for everyone' },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <div style={{ flex:1, textAlign:'center', padding:'0 12px' }}>
                <div style={{ fontSize:'22px', marginBottom:'6px' }}>{step.icon}</div>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 2px' }}>{step.title}</p>
                <p style={{ fontSize:'12px', color:'#6b7280', margin:0 }}>{step.desc}</p>
              </div>
              {i < 2 && <div style={{ width:'1px', background:'#e5e7eb', alignSelf:'stretch', margin:'8px 0', flexShrink:0 }}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Poll list */}
      <div style={{ background:'white', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding:'60px', textAlign:'center', color:'#9ca3af', fontSize:'14px' }}>Loading polls…</div>
        ) : polls.length === 0 ? (
          <div style={{ padding:'60px 48px', textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'24px' }}>🗳️</div>
            <p style={{ fontSize:'16px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 6px' }}>No polls yet</p>
            <p style={{ fontSize:'14px', color:'#9ca3af', margin:'0 0 20px' }}>Create your first poll to find times that work for everyone</p>
            <button onClick={()=>setShowCreate(true)} style={{ padding:'10px 24px', background:'#006bff', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>+ New poll</button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 100px 110px 120px', padding:'10px 20px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' }}>
              {['Poll name','Duration','Voters','Slots','Status',''].map((h,i) => (
                <span key={i} style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
              ))}
            </div>

            {polls.map(poll => {
              const s = statusConfig[poll.status] || statusConfig.closed;
              return (
                <div key={poll.id}
                  onClick={() => setSelectedPoll(poll)}
                  style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 100px 110px 120px', padding:'14px 20px', borderBottom:'1px solid #f3f4f6', alignItems:'center', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fafbff'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>

                  {/* Name */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                    <div style={{ width:'4px', height:'40px', borderRadius:'4px', background:poll.color||'#006bff', flexShrink:0 }}/>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:'600', color:'#1a1a2e', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{poll.title}</p>
                      <p style={{ fontSize:'11px', color:'#9ca3af', margin:0 }}>{dayjs(poll.created_at).format('MMM D, YYYY')}</p>
                    </div>
                  </div>

                  <span style={{ fontSize:'13px', color:'#6b7280' }}>{poll.duration} min</span>
                  <span style={{ fontSize:'13px', color:'#6b7280' }}>{poll.total_voters}</span>
                  <span style={{ fontSize:'13px', color:'#6b7280' }}>{poll.time_slots.length} slot{poll.time_slots.length !== 1 ? 's' : ''}</span>

                  <span style={{ fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'12px', background:s.bg, color:s.color, width:'fit-content' }}>
                    {s.label}
                  </span>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'4px' }} onClick={e=>e.stopPropagation()}>
                    {poll.status === 'open' && (
                      <button onClick={(e)=>copyLink(poll.token, poll.id, e)} title="Copy link"
                        style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:copiedId===poll.id?'#dcfce7':'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:copiedId===poll.id?'#16a34a':'#6b7280', transition:'all 0.2s' }}>
                        {copiedId===poll.id ? <IcoCheck/> : <IcoCopy/>}
                      </button>
                    )}
                    {poll.status === 'open' && (
                      <button onClick={(e)=>handleClose(poll.id, e)} title="Close poll"
                        style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', transition:'all 0.15s' }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#fffbeb';}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';}}>
                        🔒
                      </button>
                    )}
                    <button onClick={(e)=>handleDelete(poll.id, e)} title="Delete"
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
  );
};

export default Polls;