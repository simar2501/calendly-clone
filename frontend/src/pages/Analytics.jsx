import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import dayjs from 'dayjs';

const Analytics = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [upRes, pastRes, evRes] = await Promise.all([
        API.get('/api/meetings/upcoming'),
        API.get('/api/meetings/past'),
        API.get('/api/event-types/'),
      ]);
      setUpcoming(upRes.data);
      setPast(pastRes.data);
      setEventTypes(evRes.data);
    } catch (err) { console.error(err); }
  };

  const totalMeetings = upcoming.length + past.length;
  const completedMeetings = past.length;
  const upcomingMeetings = upcoming.length;

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '24px',
      border: '1px solid #e5e7eb', flex: 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{value}</p>
        </div>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: color + '20', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '24px'
        }}>{icon}</div>
      </div>
    </div>
  );

  // Most popular event type
  const eventCounts = {};
  [...upcoming, ...past].forEach(m => {
    const title = m.event_type?.title || 'Unknown';
    eventCounts[title] = (eventCounts[title] || 0) + 1;
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>Analytics</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Overview of your scheduling activity</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Total Meetings" value={totalMeetings} icon="📅" color="#006bff" />
        <StatCard title="Upcoming" value={upcomingMeetings} icon="⏰" color="#10b981" />
        <StatCard title="Completed" value={completedMeetings} icon="✅" color="#8b5cf6" />
        <StatCard title="Event Types" value={eventTypes.length} icon="🔗" color="#f59e0b" />
      </div>

      {/* Popular Event Types */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Most Popular Event Types
        </h2>
        {Object.keys(eventCounts).length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No data yet</p>
        ) : (
          Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([title, count]) => (
              <div key={title} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{title}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{count} bookings</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px', background: '#006bff',
                    width: `${(count / totalMeetings) * 100}%`
                  }} />
                </div>
              </div>
            ))
        )}
      </div>

      {/* Recent Bookings */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Recent Bookings
        </h2>
        {past.slice(0, 5).length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No past bookings yet</p>
        ) : (
          past.slice(0, 5).map(m => (
            <div key={m.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid #f3f4f6'
            }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{m.invitee_name}</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{m.event_type?.title}</p>
              </div>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {dayjs(m.start_time).format('MMM D, YYYY')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Analytics;