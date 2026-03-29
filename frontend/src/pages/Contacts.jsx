import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import dayjs from 'dayjs';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const res = await API.get('/api/contacts/');
      setContacts(res.data);
    } catch (err) { console.error(err); }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '40px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>Contacts</h1>
        <button style={{
          padding: '10px 20px', background: '#006bff', color: 'white',
          border: 'none', borderRadius: '24px', fontSize: '14px',
          fontWeight: '600', cursor: 'pointer'
        }}>+ Add contact</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
          <input
            placeholder="Search by name and email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px',
              border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr',
          padding: '12px 24px', background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {['Name', 'Email', 'Last meeting', 'Next meeting'].map(h => (
            <span key={h} style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '32px' }}>👤</p>
            <p style={{ fontSize: '15px', marginTop: '12px' }}>No contacts yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Contacts appear automatically when someone books a meeting</p>
          </div>
        ) : (
          filtered.map((contact, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr',
              padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
              alignItems: 'center'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>

              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: '#006bff',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0
                }}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{contact.name}</span>
              </div>

              {/* Email */}
              <span style={{ fontSize: '14px', color: '#6b7280' }}>{contact.email}</span>

              {/* Last meeting */}
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {contact.last_meeting ? dayjs(contact.last_meeting).format('DD/MM/YYYY') : '—'}
              </span>

              {/* Next meeting */}
              <span style={{ fontSize: '14px', color: contact.next_meeting ? '#006bff' : '#6b7280', fontWeight: contact.next_meeting ? '500' : '400' }}>
                {contact.next_meeting ? dayjs(contact.next_meeting).format('DD/MM/YYYY') : '—'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Contacts;