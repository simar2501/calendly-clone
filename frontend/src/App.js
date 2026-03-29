import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Availability from './pages/Availability';
import Meetings from './pages/Meetings';
import BookingPage from './pages/BookingPage';
import Confirmation from './pages/Confirmation';
import Contacts from './pages/Contacts';
import Analytics from './pages/Analytics';
import Sidebar from './components/Sidebar';
import Polls from './pages/Polls';
import PollVoting from './pages/PollVoting';

function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', transition: 'margin-left 0.2s' }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/polls" element={<AdminLayout><Polls /></AdminLayout>} />
<Route path="/poll/:token" element={<PollVoting />} />
        <Route path="/book/one-time/:token" element={<BookingPage singleUse={true} />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/availability" element={<AdminLayout><Availability /></AdminLayout>} />
        <Route path="/meetings" element={<AdminLayout><Meetings /></AdminLayout>} />
        <Route path="/contacts" element={<AdminLayout><Contacts /></AdminLayout>} />
        <Route path="/analytics" element={<AdminLayout><Analytics /></AdminLayout>} />
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </Router>
  );
}

export default App;