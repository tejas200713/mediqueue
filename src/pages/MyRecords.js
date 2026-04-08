import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ClipboardList, Search, Calendar, User as UserIcon } from 'lucide-react';

function formatDate(value) {
  // Firestore Timestamp -> { seconds } / { toDate() } depending on SDK path
  try {
    if (!value) return '';
    if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
    if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toLocaleString();
    if (value instanceof Date) return value.toLocaleString();
    return '';
  } catch {
    return '';
  }
}

export default function MyRecords() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      setRecords([]);
      return;
    }

    // Avoid composite-index requirements: query by email only, then sort client-side.
    const q = query(collection(db, 'prescriptions'), where('patientEmail', '==', user.email));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const as = a?.date?.seconds ?? 0;
          const bs = b?.date?.seconds ?? 0;
          return bs - as;
        });
        setRecords(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.email]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = String(r?.name ?? '').toLowerCase();
      const dosage = String(r?.dosage ?? '').toLowerCase();
      const doctor = String(r?.doctor ?? '').toLowerCase();
      return name.includes(q) || dosage.includes(q) || doctor.includes(q);
    });
  }, [records, search]);

  return (
    <div className="dashboard-wrapper">
      <Navbar role="patient" />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              <ClipboardList size={16} />
              <span>Patient Portal</span>
            </div>
            <h1 className="page-title">My Records</h1>
            <p className="page-subtitle">View your previous prescriptions and consultation notes.</p>
          </div>

          <div className="page-actions">
            <div className="search-pill">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine, dosage, doctor..."
                aria-label="Search records"
              />
            </div>
          </div>
        </div>

        <div className="stats-row stats-row--2">
          <div className="stat-card stat-card--dark">
            <div style={{ flex: 1 }}>
              <h5>Total Prescriptions</h5>
              <p>{records.length}</p>
            </div>
            <span className="stat-icon">
              <ClipboardList size={18} />
            </span>
          </div>
          <div className="stat-card stat-card--dark">
            <div style={{ flex: 1 }}>
              <h5>Signed in as</h5>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e5e7eb' }}>{user?.email ?? '—'}</p>
            </div>
            <span className="stat-icon">
              <UserIcon size={18} />
            </span>
          </div>
        </div>

        <section className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={18} />
              <h3>Prescription History</h3>
            </div>
            <div className="card-muted">{loading ? 'Loading…' : `${filtered.length} result(s)`}</div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-title">Fetching your records</div>
              <div className="empty-subtitle">This usually takes a second.</div>
            </div>
          ) : !user?.email ? (
            <div className="empty-state">
              <div className="empty-title">You’re not signed in</div>
              <div className="empty-subtitle">Please log in again to view your history.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No records found</div>
              <div className="empty-subtitle">Once a doctor completes a consultation, your prescriptions will appear here.</div>
            </div>
          ) : (
            <div className="records-grid">
              {filtered.map((r) => (
                <div key={r.id} className="record-item">
                  <div className="record-top">
                    <div className="record-name">{r?.name ?? 'Prescription'}</div>
                    <span className="record-badge">{String(r?.dosage ?? '—')}</span>
                  </div>
                  <div className="record-meta">
                    <span className="record-meta-line">
                      <span className="record-meta-label">Doctor</span>
                      <span className="record-meta-value">{r?.doctor ?? '—'}</span>
                    </span>
                    <span className="record-meta-line">
                      <span className="record-meta-label">Date</span>
                      <span className="record-meta-value">{formatDate(r?.date) || '—'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

