import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const navItems = [
    { path: '/polls', label: 'Polls', icon: '🗳️' },
    { path: '/dashboard', label: 'Scheduling', icon: '🔗' },
    { path: '/meetings', label: 'Meetings', icon: '📅' },
    { path: '/availability', label: 'Availability', icon: '🕐' },
    { path: '/contacts', label: 'Contacts', icon: '👤' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
  ];

  const createMenuSections = [
    {
      section: 'Event type',
      items: [
        { label: 'One-on-one', desc: '1 host → 1 invitee • Good for coffee chats, 1:1 interviews, etc.' },
        { label: 'Group', desc: '1 host → Multiple invitees • Webinars, online classes, etc.' },
        { label: 'Round robin', desc: 'Rotating hosts → 1 invitee • Distribute meetings between team members' },
        { label: 'Collective', desc: 'Multiple hosts → 1 invitee • Panel interviews, group sales calls, etc.' },
      ]
    },
    {
      section: 'More ways to meet',
      items: [
        { label: 'One-off meeting', desc: 'Offer time outside your normal schedule' },
        { label: 'Meeting poll', desc: 'Let invitees vote on a time to meet' },
      ]
    }
  ];

  // FIX 1: was handleCreateClick (undefined) — now correctly calls handleCreateItem
  const handleCreateItem = (label) => {
    setShowCreateMenu(false);
    navigate(`/dashboard?create=${encodeURIComponent(label)}`);
  };

  return (
    <>
      {showCreateMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          onClick={() => setShowCreateMenu(false)} />
      )}

      <div style={{
        width: collapsed ? '64px' : '260px',
        height: '100vh', background: '#ffffff',
        borderRight: '1px solid #e5e7eb', position: 'fixed',
        left: 0, top: 0, display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', overflow: 'hidden', zIndex: 100
      }}>

        {/* Logo + Collapse button */}
        <div style={{
          padding: '20px 16px', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #e5e7eb', minHeight: '72px'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: '#006bff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '16px', fontWeight: '700', flexShrink: 0
              }}>S</div>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#006bff', whiteSpace: 'nowrap' }}>Schedulr</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '16px', color: '#9ca3af', padding: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Create Button */}
        <div style={{ padding: '16px', position: 'relative' }}>
          <button onClick={() => setShowCreateMenu(!showCreateMenu)} style={{
            width: '100%', padding: '10px', border: '1px solid #d1d5db',
            borderRadius: '24px', background: 'white', fontSize: '14px',
            fontWeight: '600', color: '#111827', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            {collapsed ? '+' : '+ Create'}
          </button>

          {showCreateMenu && (
            <div style={{
              position: 'fixed',
              left: collapsed ? '80px' : '276px',
              top: '72px',
              background: 'white', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              width: '340px', zIndex: 9999, padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              {createMenuSections.map((section, si) => (
                <div key={si}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {section.section}
                  </p>
                  {section.items.map(item => (
                    <div key={item.label}
                      onClick={() => handleCreateItem(item.label)}
                      style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#006bff' }}>{item.label}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.desc}</p>
                    </div>
                  ))}
                  {si < createMenuSections.length - 1 && (
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: collapsed ? '0' : '12px',
                padding: collapsed ? '10px' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '8px', marginBottom: '2px',
                fontSize: '14px', fontWeight: isActive ? '600' : '400',
                color: isActive ? '#006bff' : '#374151',
                background: isActive ? '#eff6ff' : 'transparent',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid #006bff' : '3px solid transparent',
                whiteSpace: 'nowrap', overflow: 'hidden'
              })}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid #e5e7eb' }}>
          {[
            { label: 'Upgrade plan', icon: '💰' },
            { label: 'Admin center', icon: '👑' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: '14px', color: '#374151' }}>{item.label}</span>}
            </div>
          ))}
          <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#006bff',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: '700', flexShrink: 0
            }}>J</div>
            {!collapsed && (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>John Doe</p>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Free Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;