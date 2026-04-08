import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PatientView from './pages/PatientView';
import StaffAdmin from './pages/StaffAdmin';
import TVDisplay from './pages/TVDisplay';
import MyRecords from './pages/MyRecords';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<PatientView />} />
        <Route path="/admin" element={<StaffAdmin />} />
        <Route path="/display" element={<TVDisplay />} />
        <Route path="/my-records" element={<MyRecords />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;