import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Manager from './pages/Manager';

function App() {
  const isAuthenticated = !!localStorage.getItem('jwt_token');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manager/:id" element={<Manager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;