import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../components/Navbar';

export default function StaffAdmin() {
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [med, setMed] = useState({ name: '', dosage: '' });

  useEffect(() => {
    const q = query(collection(db, "queue"), where("status", "==", "waiting"), orderBy("token"));
    return onSnapshot(q, (s) => setPatients(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const handleCall = async (p) => {
    await updateDoc(doc(db, "clinic_status", "current"), { nowServing: p.token });
    await updateDoc(doc(db, "queue", p.id), { status: 'called-in' });
    setActivePatient(p);
  };

  const completeAppointment = async (e) => {
    e.preventDefault();
    
    // FIXED: Guard clause to prevent undefined email errors
    if (!activePatient?.email) {
      alert("Error: Patient email not found. Cannot send prescription.");
      return;
    }

    try {
      await addDoc(collection(db, "prescriptions"), {
        ...med,
        patientEmail: activePatient.email,
        doctor: "Dr. Priya S.",
        date: serverTimestamp()
      });
      
      await updateDoc(doc(db, "queue", activePatient.id), { status: 'served' });
      setMed({ name: '', dosage: '' });
      setActivePatient(null);
      alert("Prescription sent and Consultation Closed!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Navbar role="doctor" />
      <main className="main-content">
        <section style={{ marginBottom: '40px' }}>
          <h2>Current Consultation</h2>
          {activePatient ? (
            <div className="patient-card-full" style={{ borderLeft: '10px solid #10b981' }}>
              <h3>{activePatient.name} (Token {activePatient.token})</h3>
              <form className="prescription-form" onSubmit={completeAppointment}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input placeholder="Medicine" value={med.name} onChange={e => setMed({...med, name: e.target.value})} required />
                  <input placeholder="Dosage" value={med.dosage} onChange={e => setMed({...med, dosage: e.target.value})} required />
                  <button type="submit">Finish & Send</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="patient-card-full" style={{ textAlign: 'center', opacity: 0.5 }}>No active consultation.</div>
          )}
        </section>

        <h2>Waiting Queue</h2>
        <div className="patient-grid">
          {patients.map(p => (
            <div key={p.id} className="patient-card-full">
              <span className="token-badge">{p.token}</span>
              <h4 style={{marginTop: '10px'}}>{p.name}</h4>
              <p style={{fontSize: '0.8rem', color: '#666'}}>{p.complaint}</p>
              <button className="call-btn" onClick={() => handleCall(p)}>Call to Cabin</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}