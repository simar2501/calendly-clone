import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import dayjs from 'dayjs';

const BookingPage = ({ singleUse = false }) => {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [expired, setExpired] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ invitee_name: '', invitee_email: '', notes: '' });
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchEvent(); }, [slug, token]);

  const fetchEvent = async () => {
    try {
      if (singleUse) {
        // Single-use link: resolve token → event details
        const res = await API.get(`/api/single-use-links/book/${token}`);
        setEvent(res.data);
      } else {
        const res = await API.get(`/api/booking/${slug}`);
        setEvent(res.data);
      }
    } catch (err) {
      if (err.response?.status === 410) {
        setExpired(true); // Link already used
      } else {
        navigate('/');
      }
    }
  };

  const fetchSlots = async (date) => {
    try {
      let res;
      if (singleUse) {
        res = await API.get(`/api/single-use-links/book/${token}/slots?date_str=${date}`);
      } else {
        res = await API.get(`/api/booking/${slug}/slots?date_str=${date}`);
      }
      setSlots(res.data);
    } catch {
      setSlots([]);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date);
  };

  const handleSlotClick = (slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleBooking = async () => {
    if (!form.invitee_name || !form.invitee_email) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (singleUse) {
        res = await API.post(`/api/single-use-links/book/${token}`, {
          invitee_name: form.invitee_name,
          invitee_email: form.invitee_email,
          start_time: selectedSlot.start_time,
          notes: form.notes,
        });
      } else {
        res = await API.post(`/api/booking/${slug}`, {
          invitee_name: form.invitee_name,
          invitee_email: form.invitee_email,
          start_time: selectedSlot.start_time,
          notes: form.notes,
        });
      }
      navigate('/confirmation', { state: { booking: res.data, event } });
    } catch (err) {
      if (err.response?.status === 410) {
        setExpired(true);
        setStep(1);
      } else {
        alert(err.response?.data?.detail || 'Booking failed');
      }
    }
    setLoading(false);
  };

  const daysInMonth = () => {
    const start = currentMonth.startOf('month').day();
    const days = currentMonth.daysInMonth();
    return { start: start === 0 ? 6 : start - 1, days };
  };

  const isPast = (day) => currentMonth.date(day).isBefore(dayjs(), 'day');
  const isSelected = (day) => selectedDate === currentMonth.date(day).format('YYYY-MM-DD');
  const isToday = (day) => dayjs().isSame(currentMonth.date(day), 'day');

  // ── Already used ──────────────────────────────────────────────────────────
  if (expired) return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: '60px 48px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔗</div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>This link has already been used</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
          This was a one-time booking link and it has already been used to schedule a meeting.
          Please contact the host for a new link.
        </p>
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!event) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  );

  const { start, days } = daysInMonth();
  const accentColor = event.color || '#006bff';

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        overflow: 'hidden', width: '100%', maxWidth: '1000px', display: 'flex', minHeight: '600px'
      }}>

        {/* Left Panel */}
        <div style={{ width: '280px', padding: '40px 32px', borderRight: '1px solid #e5e7eb', flexShrink: 0 }}>
          {singleUse && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '20px', padding: '4px 10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>🔂 One-time link</span>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>John Doe</p>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>{event.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🕐</span>
            <span style={{ fontSize: '14px', color: '#374151' }}>{event.duration} minutes</span>
          </div>
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>📍</span>
              <span style={{ fontSize: '14px', color: '#374151' }}>{event.location}</span>
            </div>
          )}
          {event.description && (
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', lineHeight: '1.5' }}>{event.description}</p>
          )}
          {selectedSlot && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', marginBottom: '6px' }}>SELECTED TIME</p>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                {dayjs(selectedSlot.start_time).format('dddd, MMMM D')}
              </p>
              <p style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>
                {dayjs(selectedSlot.start_time).format('h:mm A')} - {dayjs(selectedSlot.end_time).format('h:mm A')}
              </p>
            </div>
          )}
        </div>

        {/* Calendar */}
        {step === 1 && (
          <div style={{ flex: 1, padding: '40px', borderRight: selectedDate ? '1px solid #e5e7eb' : 'none' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
              Select a Date & Time
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{currentMonth.format('MMMM YYYY')}</h3>
              <button onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: accentColor, color: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#9ca3af', padding: '4px' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {Array(start).fill(null).map((_, i) => <div key={`e-${i}`} />)}
              {Array(days).fill(null).map((_, i) => {
                const day = i + 1;
                const past = isPast(day);
                const selected = isSelected(day);
                const today = isToday(day);
                return (
                  <div key={day}
                    onClick={() => !past && handleDateClick(currentMonth.date(day).format('YYYY-MM-DD'))}
                    style={{
                      textAlign: 'center', padding: '10px 4px', borderRadius: '50%',
                      fontSize: '14px', cursor: past ? 'not-allowed' : 'pointer',
                      background: selected ? accentColor : 'transparent',
                      color: selected ? 'white' : past ? '#d1d5db' : today ? accentColor : '#111827',
                      fontWeight: today || selected ? '700' : '400',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!past && !selected) e.currentTarget.style.background = '#f3f4f6'; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
                    {day}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🌐</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>India Standard Time</span>
            </div>
          </div>
        )}

        {/* Time Slots */}
        {step === 1 && selectedDate && (
          <div style={{ width: '220px', padding: '40px 20px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              {dayjs(selectedDate).format('dddd, MMMM D')}
            </h3>
            {slots.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>No slots available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slots.map((slot, i) => (
                  <button key={i} onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    style={{
                      padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                      border: '2px solid',
                      borderColor: slot.available ? accentColor : '#e5e7eb',
                      background: 'white',
                      color: slot.available ? accentColor : '#d1d5db',
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (slot.available) { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = 'white'; } }}
                    onMouseLeave={e => { if (slot.available) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = accentColor; } }}>
                    {dayjs(slot.start_time).format('h:mma')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {step === 2 && (
          <div style={{ flex: 1, padding: '40px' }}>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: accentColor, fontSize: '14px', cursor: 'pointer', marginBottom: '24px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>← Back</button>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Enter Details</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              {dayjs(selectedSlot?.start_time).format('h:mm A')} - {dayjs(selectedSlot?.end_time).format('h:mm A')}, {dayjs(selectedSlot?.start_time).format('dddd MMMM D, YYYY')}
            </p>

            {[
              { label: 'Name *', key: 'invitee_name', type: 'text', placeholder: 'Your full name' },
              { label: 'Email *', key: 'invitee_email', type: 'email', placeholder: 'your@email.com' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>Additional Notes</label>
              <textarea placeholder="Any additional information..." value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', height: '100px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleBooking} disabled={loading} style={{
              width: '100%', padding: '14px', background: accentColor, color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Booking...' : 'Book meeting'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;