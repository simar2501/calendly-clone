import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const Confirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate('/');
    return null;
  }

  const { booking, event } = state;

  return (
    <div style={{
      minHeight: '100vh', background: '#f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '48px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', maxWidth: '480px', width: '100%', textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#d1fae5', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px', fontSize: '28px'
        }}>
          ✅
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
          You're scheduled!
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
          A calendar invitation has been sent to your email.
        </p>

        {/* Booking Details */}
        <div style={{
          background: '#f9fafb', borderRadius: '12px', padding: '24px',
          textAlign: 'left', marginBottom: '32px'
        }}>
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Event</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{event?.title}</p>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Date & Time</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              {dayjs(booking.start_time).format('dddd, MMMM D, YYYY')}
            </p>
            <p style={{ fontSize: '14px', color: '#374151' }}>
              {dayjs(booking.start_time).format('h:mm A')} - {dayjs(booking.end_time).format('h:mm A')}
            </p>
          </div>

          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Invitee</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{booking.invitee_name}</p>
            <p style={{ fontSize: '14px', color: '#374151' }}>{booking.invitee_email}</p>
          </div>

          <div>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Duration</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{event?.duration} minutes</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            padding: '10px 24px', background: '#006bff', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer'
          }}>
            Go to Dashboard
          </button>
          <button onClick={() => navigate(-1)} style={{
            padding: '10px 24px', background: 'white', color: '#374151',
            border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer'
          }}>
            Book Another
          </button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;