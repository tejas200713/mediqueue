import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, Shield, Mail, LogOut } from 'lucide-react';
import { getPortalRoleForEmail } from '../constants/demoUsers';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user?.uid) {
          setProfile(null);
          return;
        }
        const snap = await getDoc(doc(db, 'users', user.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const role = profile?.role || getPortalRoleForEmail(user?.email);

  return (
    <div className="dashboard-wrapper">
      <Navbar role={role} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              <User size={16} />
              <span>Account</span>
            </div>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Your account details and portal role.</p>
          </div>

          <div className="page-actions">
            <button
              className="logout-btn"
              onClick={async () => {
                try {
                  await signOut(auth);
                } finally {
                  navigate('/');
                }
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <section className="card">
          {loading ? (
            <div className="empty-state">
              <div className="empty-title">Loading profile…</div>
              <div className="empty-subtitle">Just a moment.</div>
            </div>
          ) : !user ? (
            <div className="empty-state">
              <div className="empty-title">You’re not signed in</div>
              <div className="empty-subtitle">Please log in again to view your profile.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div className="record-item">
                <div className="record-top">
                  <div className="record-name" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Mail size={18} /> Email
                  </div>
                </div>
                <div className="record-meta-value">{user.email}</div>
              </div>

              <div className="record-item">
                <div className="record-top">
                  <div className="record-name" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Shield size={18} /> Role
                  </div>
                </div>
                <div className="record-meta-value" style={{ textTransform: 'capitalize' }}>{role}</div>
              </div>

              <div className="record-item">
                <div className="record-top">
                  <div className="record-name">Display name</div>
                </div>
                <div className="record-meta-value">{profile?.displayName || user.displayName || '—'}</div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

