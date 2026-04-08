import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';

function TVDisplay() {
  const [current, setCurrent] = useState(0);
  const [upNext, setUpNext] = useState([]);

  useEffect(() => {
    onSnapshot(doc(db, "clinic_status", "current"), (d) => setCurrent(d.data()?.nowServing || 0));
    const q = query(collection(db, "queue"), where("status", "==", "waiting"), orderBy("token"), limit(6));
    onSnapshot(q, (s) => setUpNext(s.docs.map(d => d.data().token)));
  }, []);

  return (
    <div className="tv-fullscreen">
      {/* Left Side: Now Serving */}
      <div style={{flex: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <p className="label" style={{fontSize: '2rem', marginBottom: '20px'}}>Now Serving</p>
        <div style={{background: '#10b981', padding: '100px', borderRadius: '50px', textAlign: 'center'}}>
          <h1 style={{fontSize: '15rem', margin: 0, lineHeight: 1, color: '#000'}}>{current.toString().padStart(3, '0')}</h1>
          <p style={{fontSize: '3rem', fontWeight: 'bold', marginTop: '20px', color: '#000'}}>Room 02 · Dr. Priya S.</p>
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