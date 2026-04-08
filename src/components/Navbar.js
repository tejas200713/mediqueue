import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { LogOut, User, Activity, Layout, ClipboardList } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sidebar">
      <div className="nav-logo">
        <Activity color="#10b981" size={32} />
        <span>MediQueue</span>
      </div>
      
      <ul className="nav-links">
        <li
          className={isActive(role === 'doctor' ? '/admin' : '/register') ? 'active' : ''}
          onClick={() => navigate(role === 'doctor' ? '/admin' : '/register')}
        >
          <Layout size={20} /> Dashboard
        </li>
        {role === 'patient' && (
          <li
            className={isActive('/my-records') ? 'active' : ''}
            onClick={() => navigate('/my-records')}
          >
            <ClipboardList size={20} /> My Prescriptions
          </li>
        )}
        <li
          className={isActive('/profile') ? 'active' : ''}
          onClick={() => navigate('/profile')}
        >
          <User size={20} /> Profile
        </li>
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={18} /> Logout
      </button>
    </nav>
  );
}