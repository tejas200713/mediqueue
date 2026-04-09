export const DEMO_DOCTORS = [
  { label: 'Dr. Arjun K.', email: 'arjun@phc.com', userDocId: 'doc1' },
  { label: 'Dr. Priya S.', email: 'priya@phc.com', userDocId: 'doc2' },
];

export function getPortalRoleForEmail(email) {
  const e = String(email ?? '').toLowerCase().trim();
  if (!e) return 'patient';
  if (e === 'admin@phc.com') return 'doctor';
  const isDoctor = DEMO_DOCTORS.some((d) => d.email.toLowerCase() === e);
  return isDoctor ? 'doctor' : 'patient';
}

export function getDemoDoctorByEmail(email) {
  const e = String(email ?? '').toLowerCase().trim();
  return DEMO_DOCTORS.find((d) => d.email.toLowerCase() === e) ?? null;
}

