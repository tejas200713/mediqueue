import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';

function TVDisplay() {
  const [current, setCurrent] = useState({ token: 0, room: '', doctor: '' });
  const [upNext, setUpNext] = useState([]);

  useEffect(() => {
    // Use clinic_status/current.nowServing as the source of truth.
    // If no active consultation, render blank (not 000 / not "Room").
    let unsubQueueLookup = null;
    const unsubClinic = onSnapshot(doc(db, "clinic_status", "current"), (d) => {
      const token = Number(d.data()?.nowServing ?? 0) || 0;
      const clinicRef = doc(db, "clinic_status", "current");

      // No active token: blank out display and stop any queue lookup subscription.
      if (!token) {
        setCurrent({ token: 0, room: '', doctor: '' });
        if (typeof unsubQueueLookup === 'function') unsubQueueLookup();
        unsubQueueLookup = null;
        return;
      }

      // Show token immediately; then try to enrich with room/doctor from queue.
      setCurrent((prev) => ({ ...prev, token }));
      if (typeof unsubQueueLookup === 'function') unsubQueueLookup();

      // Validate that the token is actually being served right now.
      // If token has no active queue row, blank the TV and auto-clear nowServing.
      const qLookup = query(
        collection(db, "queue"),
        where("token", "==", token),
        where("status", "in", ["called-in", "serving"]),
        limit(1)
      );
      unsubQueueLookup = onSnapshot(qLookup, (s) => {
        const row = s.docs[0]?.data();
        if (!row) {
          setCurrent({ token: 0, room: '', doctor: '' });
          updateDoc(clinicRef, { nowServing: 0 }).catch(() => {});
          return;
        }
        setCurrent({
          token,
          room: row.allocatedRoom || '',
          doctor: row.allocatedDoctor || '',
        });
      });
    });

    const q = query(collection(db, "queue"), where("status", "==", "waiting"), orderBy("token"), limit(6));
    const unsubUpNext = onSnapshot(q, (s) => setUpNext(s.docs.map(d => d.data().token)));

    return () => {
      unsubClinic();
      if (typeof unsubQueueLookup === 'function') unsubQueueLookup();
      unsubUpNext();
    };
  }, []);

  return (
    <div className="tv-fullscreen">
      {/* Left Side: Now Serving */}
      <div style={{flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <p className="label" style={{fontSize: '2rem', marginBottom: '20px'}}>Now Serving</p>
        <div style={{background: '#10b981', padding: '100px', borderRadius: '50px', textAlign: 'center'}}>
          <h1 style={{fontSize: '15rem', margin: 0, lineHeight: 1, color: '#000'}}>
            {current.token ? String(current.token).padStart(3, '0') : ''}
          </h1>
          <p style={{fontSize: '3rem', fontWeight: 'bold', marginTop: '20px', color: '#000'}}>
            {current.token ? `${current.room || ''}${current.doctor ? ` · ${current.doctor}` : ''}` : ''}
          </p>
        </div>
      </div>

      {/* Right Side: Up Next */}
      <div style={{flex: 1, background: '#111', borderRadius: '50px', padding: '40px', border: '1px solid #222'}}>
        <p className="label" style={{fontSize: '1.5rem', marginBottom: '30px'}}>Up Next</p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          {upNext.map((token, index) => (
            <div key={index} style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '30px', 
              background: '#1a1a1a', 
              borderRadius: '20px',
              border: '1px solid #333'
            }}>
              <span style={{fontSize: '3rem', fontWeight: 'bold'}}>{token.toString().padStart(3, '0')}</span>
              <span style={{fontSize: '1.5rem', color: '#666', alignSelf: 'center'}}>Proceed to Cabin</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TVDisplay;