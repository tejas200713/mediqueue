import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ClipboardList, LogOut } from 'lucide-react';

export default function PatientView() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tempName, setTempName] = useState(""); 
  const [queueData, setQueueData] = useState(null);
  const [history, setHistory] = useState([]);
  const [complaint, setComplaint] = useState("");
  const [age, setAge] = useState("");
  const [joining, setJoining] = useState(false);
  const [lastCalled, setLastCalled] = useState(null);
  const [selectedDoctorKey, setSelectedDoctorKey] = useState('doc2');

  const user = auth.currentUser;

  const doctors = React.useMemo(
    () => [
      // Match your Firestore `users` document IDs
      { key: 'doc1', name: 'Dr. Arjun K.', room: 'Room 01' },
      { key: 'doc2', name: 'Dr. Priya S.', room: 'Room 02' },
    ],
    []
  );

  const selectedDoctor = React.useMemo(() => {
    return doctors.find((d) => d.key === selectedDoctorKey) ?? doctors[0];
  }, [doctors, selectedDoctorKey]);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch User Profile
    const checkProfile = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().displayName);
      }
      setLoading(false);
    };

    // 2. Queue: listen to all of this user's queue entries.
    // We pick the most recent ACTIVE one (waiting/serving). If none, we show
    // the most recent "called" banner (called/called-in).
    const qQueue = query(collection(db, "queue"), where("email", "==", user.email));
    const unsubQueue = onSnapshot(qQueue, (s) => {
      if (s.empty) {
        setQueueData(null);
        setLastCalled(null);
        return;
      }

      const all = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      const score = (row) => {
        const seconds = row?.joinedAt?.seconds;
        if (typeof seconds === 'number') return seconds;
        return Number(row?.token ?? 0);
      };
      all.sort((a, b) => score(b) - score(a));

      const active = all.find((r) => r.status === 'waiting' || r.status === 'serving') ?? null;
      // Keep a "last token" banner even after the appointment is completed.
      const called = all.find((r) => r.status === 'called' || r.status === 'called-in' || r.status === 'served') ?? null;

      if (active) {
        setQueueData(active);
        setLastCalled(null);
        return;
      }

      // No active token: allow generating again, but show the latest "called" banner if present.
      setQueueData(null);
      if (called) {
        setLastCalled({
          token: called.token,
          doctor: called.allocatedDoctor,
          room: called.allocatedRoom,
          status: called.status,
        });
      } else {
        setLastCalled(null);
      }
    });

    // 3. Medical History
    const qHistory = query(
      collection(db, "prescriptions"), 
      where("patientEmail", "==", user.email)
    );
    const unsubHistory = onSnapshot(qHistory, (s) => {
      setHistory(s.docs.map(d => d.data()));
    });

    checkProfile();
    return () => { unsubQueue(); unsubHistory(); };
  }, [user]);

  const handleProfileSetup = async (e) => {
    e.preventDefault();
    if (!tempName) return;
    await setDoc(doc(db, "users", user.uid), {
      displayName: tempName,
      email: user.email,
      role: 'patient'
    });
    setUserName(tempName);
  };

  const joinQueue = async (e) => {
    e.preventDefault();
    if (!user?.email) return alert("Session expired. Please login again.");

    if (!complaint.trim()) return alert("Please describe your health problem.");

    try {
      setJoining(true);

      // Sequential token generation using a Firestore counter.
      // Stored at clinic_status/current.nextToken (defaults to 1).
      const statusRef = doc(db, 'clinic_status', 'current');
      const token = await runTransaction(db, async (tx) => {
        const snap = await tx.get(statusRef);
        const next = Math.max(1, Number(snap.data()?.nextToken ?? 1));
        tx.set(statusRef, { nextToken: next + 1 }, { merge: true });
        return next;
      });

      await addDoc(collection(db, "queue"), {
        name: userName,
        age: age,
        complaint: complaint.trim(),
        email: user.email,
        status: 'waiting',
        token,
        joinedAt: serverTimestamp(),
        allocatedDoctor: selectedDoctor?.name ?? 'Dr. Priya S.',
        allocatedRoom: selectedDoctor?.room ?? 'Room 02',
        allocatedDoctorUserDocId: selectedDoctor?.key ?? 'doc2',
      });
      setAge("");
      setComplaint("");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="view-container center-content">Loading...</div>;

  if (!userName) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 style={{color: '#10b981'}}>Welcome to MediQueue</h2>
          <p style={{color: '#888', marginBottom: '20px'}}>Tell us your name to set up your portal.</p>
          <form onSubmit={handleProfileSetup} className="auth-form">
            <input placeholder="Full Name" onChange={(e) => setTempName(e.target.value)} required className="staff-input" />
            <button type="submit" className="auth-btn-primary">Complete Setup</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Navbar role="patient" />
      <main className="main-content">
        <header className="admin-header-flex">
          <h1>Hello, {userName}</h1>
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
            <LogOut size={16}/> Logout
          </button>
        </header>

        {lastCalled && (
          <section className="card" style={{ marginBottom: '18px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div className="card-title">
                <span className="token-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  Token {String(lastCalled.token ?? '').padStart(3, '0')}
                </span>
                <h3 style={{ margin: 0 }}>
                  {lastCalled.status === 'served' ? 'Last token served' : 'You’ve been called'}
                </h3>
              </div>
              <div className="card-muted">
                {lastCalled.room || 'Room'} · {lastCalled.doctor || 'Doctor'}
              </div>
            </div>
          </section>
        )}

        <div className="stats-row stats-row--2">
          <div className="stat-card" style={{ background: '#e6fcf5', color: '#0ca678' }}>
            <div style={{flex: 1}}>
              <h5>Your Active Token</h5>
              <p style={{fontSize: '3.5rem'}}>{queueData ? queueData.token.toString().padStart(3, '0') : "NONE"}</p>
            </div>
            {queueData && <span className="token-badge" style={{background: '#0ca678', color: '#fff'}}>{queueData.status.toUpperCase()}</span>}
          </div>

          <div className="stat-card stat-card--dark">
            <div style={{ flex: 1 }}>
              <h5>Doctor Allocation</h5>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e5e7eb' }}>
                {queueData ? (queueData.allocatedDoctor || '—') : (selectedDoctor?.name || '—')}
              </p>
              <div style={{ color: '#9ca3af', marginTop: '6px' }}>
                {queueData ? (queueData.allocatedRoom || '—') : (selectedDoctor?.room || '—')}
              </div>
            </div>
          </div>
        </div>

        <div className="patient-grid">
          {!queueData && (
            <section className="patient-card-full">
              <h3>Join the Queue</h3>
              <form onSubmit={joinQueue} className="prescription-form">
                <input placeholder="Age" type="number" value={age} onChange={e => setAge(e.target.value)} required />
                <select
                  value={selectedDoctorKey}
                  onChange={(e) => setSelectedDoctorKey(e.target.value)}
                  className="staff-input"
                  style={{ background: '#0a0a0a', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' }}
                >
                  {doctors.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.name} · {d.room}
                    </option>
                  ))}
                </select>
                <textarea placeholder="Describe your health problem (symptoms, duration, etc.)" value={complaint} onChange={e => setComplaint(e.target.value)} required />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                    Selected: <span style={{ color: '#b7f7df', fontWeight: 800 }}>{selectedDoctor?.name}</span> · {selectedDoctor?.room}
                  </div>
                  <button type="submit" disabled={joining} style={{ opacity: joining ? 0.7 : 1 }}>
                    {joining ? 'Generating…' : 'Generate Token'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="patient-card-full">
            <h3><ClipboardList size={18}/> Prescriptions</h3>
            {history.map((r, i) => (
              <div key={i} style={{background: '#0a0a0a', padding: '15px', borderRadius: '10px', marginTop: '10px', borderLeft: '4px solid #10b981'}}>
                <h4 style={{margin: 0}}>{r.name}</h4>
                <p style={{margin: 0, fontSize: '0.9rem'}}>Dosage: {r.dosage}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}