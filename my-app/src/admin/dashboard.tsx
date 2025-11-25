import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    let isAdmin = false;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isAdmin = payload?.role === 'admin';
      } catch (err) {
        isAdmin = false;
      }
    }
    if (!isAdmin) {
      // redirect to admin login
      navigate('/login?admin=true');
    }
  }, [navigate]);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome — you are signed in as an admin.</p>
      <p>This is a placeholder dashboard. Add admin controls here.</p>
    </div>
  );
}

export default AdminDashboard;
