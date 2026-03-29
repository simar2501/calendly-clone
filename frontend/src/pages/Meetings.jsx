import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import dayjs from 'dayjs';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoX = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoChevLeft = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IcoChevRight = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const MiniCalendar = ({ selectedDate, onSelect, minDate }) => {
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? dayjs(selectedDate).startOf('month') : dayjs().startOf('month')
  );

  const today = dayjs().startOf('day');
  const min = minDate ? dayjs(minDate).startOf('day') : today;

  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfWeek = viewMonth.startOf('month').day(); // 0=Sun
  const cells = [];

  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(viewMonth.date(d));

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button
          onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))}
          disabled={viewMonth.isSame(dayjs().startOf('month'), 'month')}
          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <IcoChevLeft />
        </button>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>
          {viewMonth.format('MMMM YYYY')}
        </span>
        <button
          onClick={() => setViewMonth(viewMonth.add(1, 'month'))}
          style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <IcoChevRight />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9ca3af', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isDisabled = day.isBefore(min);
          const isSelected = selectedDate && day.isSame(dayjs(selectedDate), 'day');
          const isToday = day.isSame(today, 'day');

          return (
            <button key={day.format('D')}
              onClick={() => !isDisabled && onSelect(day.format('YYYY-MM-DD'))}
              disabled={isDisabled}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                background: isSelected ? '#006bff' : 'transparent',
                color: isDisabled ? '#d1d5db' : isSelected ? 'white' : isToday ? '#006bff' : '#111827',
                fontWeight: isSelected || isToday ? '700' : '400',
                fontSize: '13px', cursor: isDisabled ? 'default' : 'pointer',
                outline: isToday && !isSelected ? '2px solid #006bff' : 'none',
                outlineOffset: '-2px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isDisabled && !isSelected) e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={e => { if (!isDisabled && !isSelected) e.currentTarget.style.background = 'transparent'; }}>
              {day.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
const RescheduleModal = ({ meeting, onClose, onRescheduled }) => {
  const [step, setStep] = useState(1); // 1=pick date+time, 2=reason, 3=confirm, 4=done
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const color = meeting.event_type?.color || '#006bff';
  const duration = meeting.event_type?.duration || 30;

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    API.get(`/api/meetings/${meeting.id}/slots?date=${selectedDate}`)
      .then(res => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, meeting.id]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      await API.patch(`/api/meetings/${meeting.id}/reschedule`, {
        new_start_time: selectedSlot.start,
        reason: reason || null,
      });
      setStep(4);
      onRescheduled();
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const canNext = step === 1 ? (selectedDate && selectedSlot) : true;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '640px', maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '40px', borderRadius: '4px', background: color }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {step === 4 ? '✅ Rescheduled!' : 'Reschedule Meeting'}
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                {meeting.event_type?.title} · {duration} min · with {meeting.invitee_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
            <IcoX />
          </button>
        </div>

        {/* Progress bar */}
        {step < 4 && (
          <div style={{ height: '3px', background: '#f3f4f6', flexShrink: 0 }}>
            <div style={{ height: '100%', background: color, width: `${(step / 3) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ── Step 1: Pick date + time ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
                Current: {dayjs(meeting.start_time).format('dddd, MMMM D [at] h:mm A')}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Calendar */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Select a date</p>
                  <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} minDate={dayjs().format('YYYY-MM-DD')} />
                </div>

                {/* Time slots */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                    {selectedDate ? dayjs(selectedDate).format('ddd, MMM D') : 'Select a date first'}
                  </p>

                  {!selectedDate && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#d1d5db' }}>
                      <IcoCalendar />
                      <p style={{ fontSize: '13px', marginTop: '8px' }}>Pick a date to see available times</p>
                    </div>
                  )}

                  {selectedDate && loadingSlots && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: '13px' }}>Loading slots…</div>
                  )}

                  {selectedDate && !loadingSlots && slots.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                      <p style={{ fontSize: '13px' }}>No availability on this day</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>Try another date</p>
                    </div>
                  )}

                  {selectedDate && !loadingSlots && slots.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                      {slots.map(slot => {
                        const isSelected = selectedSlot?.start === slot.start;
                        return (
                          <button key={slot.start}
                            onClick={() => setSelectedSlot(isSelected ? null : slot)}
                            style={{
                              padding: '10px 16px', border: `2px solid ${isSelected ? color : '#e5e7eb'}`,
                              borderRadius: '8px', background: isSelected ? color : 'white',
                              color: isSelected ? 'white' : '#374151', fontSize: '14px', fontWeight: isSelected ? '600' : '400',
                              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                            }}
                            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = '#f0f7ff'; } }}
                            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; } }}>
                            <span>{dayjs(slot.start).format('h:mm A')} – {dayjs(slot.end).format('h:mm A')}</span>
                            {isSelected && <IcoCheck />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Reason ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Why are you rescheduling? <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>This will be visible in the meeting notes.</p>

              {/* Quick reason chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {['Schedule conflict', 'Personal emergency', 'Travel plans changed', 'Work commitment', 'Technical issues'].map(r => (
                  <button key={r} onClick={() => setReason(reason === r ? '' : r)}
                    style={{ padding: '8px 14px', border: `1px solid ${reason === r ? color : '#e5e7eb'}`, borderRadius: '20px', background: reason === r ? '#eff6ff' : 'white', color: reason === r ? color : '#374151', fontSize: '13px', cursor: 'pointer', fontWeight: reason === r ? '600' : '400' }}>
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Or write a custom reason…"
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && selectedSlot && (
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>Confirm your reschedule</p>

              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Was</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', textDecoration: 'line-through' }}>
                      {dayjs(meeting.start_time).format('ddd, MMM D [at] h:mm A')}
                    </p>
                  </div>
                  <div style={{ fontSize: '20px', color: '#9ca3af', alignSelf: 'center' }}>→</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Now</p>
                    <p style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {dayjs(selectedSlot.start).format('ddd, MMM D [at] h:mm A')}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px', display: 'flex', gap: '24px', fontSize: '13px', color: '#6b7280' }}>
                  <span>👤 {meeting.invitee_name}</span>
                  <span>⏱ {duration} min</span>
                  {meeting.event_type?.title && <span>📅 {meeting.event_type.title}</span>}
                </div>
              </div>

              {reason && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e' }}>
                  <strong>Reason:</strong> {reason}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && selectedSlot && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Meeting rescheduled!</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                New time: <strong>{dayjs(selectedSlot.start).format('dddd, MMMM D [at] h:mm A')}</strong>
              </p>
              <button onClick={onClose}
                style={{ padding: '10px 28px', background: '#006bff', color: 'white', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 4 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Step {step} of 3</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '24px', background: 'white', fontSize: '14px', cursor: 'pointer', color: '#374151' }}>
                  Back
                </button>
              )}
              <button onClick={onClose}
                style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '24px', background: 'white', fontSize: '14px', cursor: 'pointer', color: '#374151' }}>
                Cancel
              </button>
              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} disabled={step === 1 && !canNext}
                  style={{ padding: '10px 24px', background: canNext ? color : '#e5e7eb', color: canNext ? 'white' : '#9ca3af', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: canNext ? 'pointer' : 'default' }}>
                  Next
                </button>
              ) : (
                <button onClick={handleReschedule} disabled={saving}
                  style={{ padding: '10px 24px', background: color, color: 'white', border: 'none', borderRadius: '24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Confirm reschedule'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Meetings Page ───────────────────────────────────────────────────────
const Meetings = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rescheduling, setRescheduling] = useState(null); // meeting object

  const fetchMeetings = useCallback(async () => {
    try {
      const [upRes, pastRes] = await Promise.all([
        API.get('/api/meetings/upcoming'),
        API.get('/api/meetings/past'),
      ]);
      setUpcoming(upRes.data);
      setPast(pastRes.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this meeting?')) {
      await API.put(`/api/meetings/${id}/cancel`);
      fetchMeetings();
    }
  };

  const MeetingCard = ({ meeting, showActions }) => (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '20px 24px',
      border: '1px solid #e5e7eb', marginBottom: '10px',
      display: 'flex', alignItems: 'center', gap: '16px',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      {/* Color bar */}
      <div style={{ width: '4px', height: '60px', borderRadius: '4px', background: meeting.event_type?.color || '#006bff', flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
          {meeting.event_type?.title}
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          with <strong style={{ color: '#374151' }}>{meeting.invitee_name}</strong> · {meeting.invitee_email}
        </p>
        <p style={{ fontSize: '13px', color: '#374151', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          📅 {dayjs(meeting.start_time).format('dddd, MMMM D, YYYY')} &nbsp;·&nbsp;
          🕐 {dayjs(meeting.start_time).format('h:mm A')} – {dayjs(meeting.end_time).format('h:mm A')}
        </p>
        {meeting.notes && meeting.notes.startsWith('[Rescheduled') && (
          <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🔄 {meeting.notes.split('\n')[0].replace('[Rescheduled: ', 'Rescheduled — ').replace(']', '')}
          </p>
        )}
      </div>

      {/* Status + Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <span style={{
          fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600',
          background: meeting.status === 'confirmed' ? '#d1fae5' : '#fee2e2',
          color: meeting.status === 'confirmed' ? '#059669' : '#ef4444'
        }}>
          {meeting.status.toUpperCase()}
        </span>

        {showActions && meeting.status === 'confirmed' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setRescheduling(meeting)}
              style={{ fontSize: '12px', padding: '6px 14px', border: '1px solid #dbeafe', borderRadius: '20px', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontWeight: '600' }}>
              🔄 Reschedule
            </button>
            <button onClick={() => handleCancel(meeting.id)}
              style={{ fontSize: '12px', padding: '6px 14px', border: '1px solid #fee2e2', borderRadius: '20px', background: 'white', color: '#ef4444', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '900px' }}>

      {/* Reschedule modal */}
      {rescheduling && (
        <RescheduleModal
          meeting={rescheduling}
          onClose={() => setRescheduling(null)}
          onRescheduled={() => { fetchMeetings(); }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>Meetings</h1>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex' }}>
          {[
            { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { key: 'past', label: 'Past', count: past.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '12px 20px', border: 'none', background: 'none',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer',
              color: activeTab === tab.key ? '#006bff' : '#6b7280',
              borderBottom: activeTab === tab.key ? '2px solid #006bff' : '2px solid transparent',
              marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {tab.label}
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '10px',
                background: activeTab === tab.key ? '#006bff' : '#e5e7eb',
                color: activeTab === tab.key ? 'white' : '#6b7280'
              }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {activeTab === 'upcoming' ? (
        upcoming.length > 0
          ? upcoming.map(m => <MeetingCard key={m.id} meeting={m} showActions={true} />)
          : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '40px' }}>📅</p>
              <p style={{ fontSize: '16px', marginTop: '12px', fontWeight: '500' }}>No upcoming meetings</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Share your booking link to get started</p>
            </div>
          )
      ) : (
        past.length > 0
          ? past.map(m => <MeetingCard key={m.id} meeting={m} showActions={false} />)
          : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '40px' }}>📋</p>
              <p style={{ fontSize: '16px', marginTop: '12px', fontWeight: '500' }}>No past meetings</p>
            </div>
          )
      )}
    </div>
  );
};

export default Meetings;