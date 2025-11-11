// App.jsx
/**
  * This is the main application component that sets up routing for the ScheduleSculptor app.
  * It uses React Router to define routes for the Welcome, Audit, and Dashboard pages.
  * Each page component is imported and rendered based on the URL path.
*/

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './Welcome';
import Audit from './Audit';
import Dashboard from './Dashboard/Dashboard';
import AIAssistant from './AIAssistant';
import SculptSemester from './Sculpt/SculptSemester';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ai-assistant" element={<AIAssistant />} />
      <Route path="/sculpt" element={<SculptSemester />} />
    </Routes>
  );
}

export default App;

