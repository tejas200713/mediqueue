import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { DEMO_DOCTORS, getDemoDoctorByEmail, getPortalRoleForEmail } from '../constants/demoUsers';

const DEMO_DOCTOR_PASSWORD = 'Doctor@123';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Patients: create profile shell so Role is deterministic everywhere.
        await setDoc(
          doc(db, 'users', cred.user.uid),
          { email: cred.user.email, role: 'patient' },
          { merge: true }
        );
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const portalRole = getPortalRoleForEmail(cred.user.email);

        // Doctors/admin: upsert role so Profile/Navbar don't misclassify them.
        if (portalRole === 'doctor') {
          const demoDoctor = getDemoDoctorByEmail(cred.user.email);
          await setDoc(
            doc(db, 'users', cred.user.uid),
            {
              email: cred.user.email,
              role: 'doctor',
              displayName: demoDoctor?.label,
              userDocId: demoDoctor?.userDocId,
            },
            { merge: true }
          );
        }
      }
      // Route by role: doctors -> admin dashboard, patients -> patient view
      const portalRole = getPortalRoleForEmail(email);
      navigate(portalRole === 'doctor' ? '/admin' : '/register');
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
  <div className="auth-card">
    <h1 className="auth-logo">MediQueue</h1>
    <p className="auth-subtitle">Healthcare Management Portal</p>
    
    <form onSubmit={handleAuth} className="auth-form">
      <div className="input-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required 
        />
      </div>
      <div className="input-group">
        <input 
          type="password" 
          placeholder="Password" 
          value={pass}
          onChange={e => setPass(e.target.value)}
          required 
        />
      </div>
      <button type="submit" className="auth-btn-primary" disabled={busy} style={{ opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Please wait…' : (isRegistering ? 'Create Account' : 'Sign In')}
      </button>
    </form>

    <button
      type="button"
      className="call-btn"
      style={{ width: '100%', marginTop: '12px' }}
      onClick={() => navigate('/display')}
      disabled={busy}
    >
      Open TV Display
    </button>

    {!isRegistering && (
      <div style={{ marginTop: '18px', borderTop: '1px solid #222', paddingTop: '18px' }}>
        <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '10px' }}>
          Doctor demo logins
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '12px', lineHeight: 1.3 }}>
          These buttons <b>autofill</b> credentials. Create the demo doctor users in Firebase Auth once, then click <b>Sign In</b>.
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {DEMO_DOCTORS.map((d) => (
            <button
              key={d.email}
              type="button"
              className="call-btn"
              style={{ width: 'auto', padding: '10px 12px' }}
              onClick={() => {
                setEmail(d.email);
                setPass(DEMO_DOCTOR_PASSWORD);
              }}
              disabled={busy}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    )}

    <button className="auth-switch-btn" onClick={() => setIsRegistering(!isRegistering)}>
      {isRegistering ? 'Already have an account? Login' : 'New Patient? Register Here'}
    </button>
  </div>
</div>
  );
}