import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import dayjs from 'dayjs';

const PollVoting = () => {
  const { token } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(1); // 1=vote, 2=details, 3=done
  const [votes, setVotes] = useState({}); // {slot_id: true/false}
  const [form, setForm] = useState({ name:'', email:'' });
  const [submitting, setSubmitting] = useState(false);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { fetchPoll(); }, [token]);
  const fetchPoll = async () => {
    try {
      const res = await API.get(`/api/polls/vote/${token}`);
      setPoll(res.data);
      // Init all slots as "available"
      const initVotes = {};
      res.data.time_slots.forEach(s => { initVotes[s.id] = true; });
      setVotes(initVotes);
    } catch {
      setNotFound(true);
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) { alert('Please fill in your name and email'); return; }
    setSubmitting(true);
    try {
      const voteList = Object.entries(votes).map(([slot_id, available]) => ({
        slot_id: parseInt(slot_id),
        available,
      }));
      await API.post(`/api/polls/vote/${token}`, {
        voter_name: form.name,
        voter_email: form.email,
        votes: voteList,
      });
      setStep(3);
    } catch (e) {
      alert(e.response?.data?.detail || 'Error submitting vote');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6' }}>
      <p style={{ color:'#9ca3af' }}>Loading poll…</p>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6', padding:'20px' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'60px 48px', maxWidth:'400px', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize:'40px', marginBottom:'16px' }}>🔍</p>
        <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#111827', marginBottom:'8px' }}>Poll not found</h2>
        <p style={{ fontSize:'14px', color:'#6b7280' }}>This poll link is invalid or has been removed.</p>
      </div>
    </div>
  );

  if (!poll) return null;

  const color = poll.color || '#006bff';

  // Group slots by date
  const slotsByDate = {};
  poll.time_slots.forEach(slot => {
    const date = dayjs(slot.start_time).format('YYYY-MM-DD');
    if (!slotsByDate[date]) slotsByDate[date] = [];
    slotsByDate[date].push(slot);
  });

  const selectedCount = Object.values(votes).filter(Boolean).length;

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', padding:'40px 20px' }}>
      <div style={{ maxWidth:'640px', margin:'0 auto' }}>

        {/* Header card */}
        <div style={{ background:'white', borderRadius:'16px', padding:'28px 32px', marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
            <span style={{ fontSize:'11px', fontWeight:'700', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>Meeting Poll</span>
            <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background:'#dcfce7', color:'#16a34a', fontWeight:'600' }}>
              {poll.status === 'open' ? '● Open for votes' : poll.status === 'confirmed' ? '✓ Confirmed' : '● Closed'}
            </span>
          </div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#111827', marginBottom:'10px' }}>{poll.title}</h1>
          {poll.description && <p style={{ fontSize:'14px', color:'#6b7280', marginBottom:'12px', lineHeight:'1.6' }}>{poll.description}</p>}
          <div style={{ display:'flex', gap:'16px', fontSize:'13px', color:'#6b7280' }}>
            <span>⏱ {poll.duration} min</span>
            {poll.location && <span>📍 {poll.location}</span>}
            <span>🗳️ {poll.total_voters} vote{poll.total_voters !== 1 ? 's' : ''} so far</span>
          </div>
        </div>

        {/* Confirmed banner */}
        {poll.status === 'confirmed' && poll.confirmed_slot_id && (() => {
          const slot = poll.time_slots.find(s => s.id === poll.confirmed_slot_id);
          return slot ? (
            <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', textAlign:'center' }}>
              <p style={{ fontSize:'14px', fontWeight:'700', color:'#16a34a', marginBottom:'4px' }}>✅ Time confirmed!</p>
              <p style={{ fontSize:'16px', fontWeight:'600', color:'#166534' }}>
                {dayjs(slot.start_time).format('dddd, MMMM D [at] h:mm A')} – {dayjs(slot.end_time).format('h:mm A')}
              </p>
            </div>
          ) : null;
        })()}

        {/* Step 3: Done */}
        {step === 3 && (
          <div style={{ background:'white', borderRadius:'16px', padding:'48px 32px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#111827', marginBottom:'8px' }}>Vote submitted! 🎉</h2>
            <p style={{ fontSize:'14px', color:'#6b7280', lineHeight:'1.6' }}>
              Thanks, <strong>{form.name}</strong>! Your availability has been recorded.<br/>
              The host will confirm the final time and you'll be notified.
            </p>
            <div style={{ marginTop:'24px', padding:'16px', background:'#f9fafb', borderRadius:'10px', textAlign:'left' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px' }}>Your responses:</p>
              {poll.time_slots.map(slot => (
                <div key={slot.id} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'14px' }}>{votes[slot.id] ? '✅' : '❌'}</span>
                  <span style={{ fontSize:'13px', color:'#374151' }}>
                    {dayjs(slot.start_time).format('ddd, MMM D')} · {dayjs(slot.start_time).format('h:mm A')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps 1 & 2 */}
        {step < 3 && poll.status === 'open' && (
          <>
            {/* Step 1: Vote on slots */}
            {step === 1 && (
              <div style={{ background:'white', borderRadius:'16px', padding:'24px 28px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <p style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>
                    Which times work for you?
                  </p>
                  <span style={{ fontSize:'12px', color:'#6b7280' }}>{selectedCount} of {poll.time_slots.length} selected</span>
                </div>

                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date} style={{ marginBottom:'20px' }}>
                    <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'8px' }}>
                      {dayjs(date).format('dddd, MMMM D')}
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {dateSlots.map(slot => {
                        const isAvail = votes[slot.id] !== false;
                        return (
                          <button key={slot.id}
                            onClick={() => setVotes(prev => ({...prev, [slot.id]: !isAvail}))}
                            style={{
                              padding:'12px 16px', border:`2px solid ${isAvail ? color : '#e5e7eb'}`,
                              borderRadius:'10px', background: isAvail ? '#f0f7ff' : 'white',
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between',
                              transition:'all 0.15s',
                            }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <div style={{ width:'22px', height:'22px', borderRadius:'50%', border:`2px solid ${isAvail ? color : '#d1d5db'}`, background: isAvail ? color : 'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                {isAvail && <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                              </div>
                              <span style={{ fontSize:'14px', fontWeight:'500', color: isAvail ? '#111827' : '#9ca3af' }}>
                                {dayjs(slot.start_time).format('h:mm A')} – {dayjs(slot.end_time).format('h:mm A')}
                              </span>
                            </div>
                            <span style={{ fontSize:'12px', color: isAvail ? color : '#9ca3af', fontWeight:'600' }}>
                              {isAvail ? '✓ Works' : 'Can\'t do'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button onClick={() => setStep(2)}
                  style={{ width:'100%', padding:'13px', background:color, color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'8px' }}>
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Name + email */}
            {step === 2 && (
              <div style={{ background:'white', borderRadius:'16px', padding:'28px 32px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:color, fontSize:'14px', cursor:'pointer', padding:0, marginBottom:'20px', display:'flex', alignItems:'center', gap:'4px' }}>← Back</button>
                <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#111827', marginBottom:'6px' }}>Almost done!</h2>
                <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'20px' }}>Enter your details so the host knows who's voting.</p>

                <div style={{ marginBottom:'14px' }}>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'5px' }}>Your name *</label>
                  <input type="text" placeholder="Full name" value={form.name}
                    onChange={e => setForm({...form, name:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }}/>
                </div>
                <div style={{ marginBottom:'20px' }}>
                  <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'5px' }}>Email address *</label>
                  <input type="email" placeholder="your@email.com" value={form.email}
                    onChange={e => setForm({...form, email:e.target.value})}
                    style={{ width:'100%', padding:'10px 12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'14px', boxSizing:'border-box' }}/>
                </div>

                {/* Summary */}
                <div style={{ background:'#f9fafb', borderRadius:'8px', padding:'12px 14px', marginBottom:'20px' }}>
                  <p style={{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px' }}>Your availability summary:</p>
                  {poll.time_slots.map(slot => (
                    <div key={slot.id} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <span style={{ fontSize:'13px' }}>{votes[slot.id] !== false ? '✅' : '❌'}</span>
                      <span style={{ fontSize:'12px', color:'#374151' }}>
                        {dayjs(slot.start_time).format('ddd, MMM D')} · {dayjs(slot.start_time).format('h:mm A')}
                      </span>
                    </div>
                  ))}
                </div>

                <button onClick={handleSubmit} disabled={submitting || !form.name || !form.email}
                  style={{ width:'100%', padding:'13px', background: form.name && form.email ? color : '#e5e7eb',
                    color: form.name && form.email ? 'white' : '#9ca3af', border:'none', borderRadius:'10px',
                    fontSize:'15px', fontWeight:'600', cursor: form.name && form.email ? 'pointer' : 'default' }}>
                  {submitting ? 'Submitting…' : '🗳️ Submit my availability'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Closed poll message */}
        {poll.status === 'closed' && step < 3 && (
          <div style={{ background:'white', borderRadius:'16px', padding:'48px 32px', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:'32px', marginBottom:'12px' }}>🔒</p>
            <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#111827', marginBottom:'8px' }}>This poll is closed</h2>
            <p style={{ fontSize:'14px', color:'#6b7280' }}>The host has closed this poll. No more votes are being accepted.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollVoting;