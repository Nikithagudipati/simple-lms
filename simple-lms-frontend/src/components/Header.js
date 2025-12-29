import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { current, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavCatalog = () => {
    if (current) navigate('/catalog');
  };

  const handleNavDashboard = () => {
    if (current) {
      navigate('/dashboard');
    }
  };

  const handleNavCreate = () => {
    if (current && (current.role === 'instructor' || current.role === 'admin')) {
      navigate('/create');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="brand">
        <div className="logo-mark">SL</div>
        <div className="brand-text">SimpleLMS</div>
      </div>

      <nav className="nav">
        {current && <button className="nav-btn" onClick={handleNavCatalog}><i className="fa-solid fa-book"></i> Courses</button>}
        {current && <button className="nav-btn" onClick={handleNavDashboard}><i className="fa-solid fa-gauge"></i> Dashboard</button>}
        {current && (current.role === 'instructor' || current.role === 'admin') && <button className="nav-btn" onClick={handleNavCreate}><i className="fa-solid fa-plus"></i> Create</button>}
        
        <div className="role-badge">
          <i className="fa-solid fa-user"></i> 
          {current ? `${current.name} (${current.role})` : 'Guest'}
        </div>
        
        {current && <button className="nav-btn secondary" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket"></i> Logout</button>}
      </nav>
    </header>
  );
}

export default Header;
