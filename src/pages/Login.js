import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const DEMO_DOCTORS = [
  { label: 'Dr. Arjun K.', email: 'arjun@phc.com', password: 'Doctor@123', userDocId: 'doc1' },
  { label: 'Dr. Priya S.', email: 'priya@phc.com', password: 'Doctor@123', userDocId: 'doc2' },
];

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
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      // Route by role: doctors -> admin dashboard, patients -> patient view
      const isDoctor = DEMO_DOCTORS.some((d) => d.email.toLowerCase() === email.toLowerCase());
      if (email === 'admin@phc.com' || isDoctor) navigate('/admin');
      else navigate('/register');
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
                setPass(d.password);
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