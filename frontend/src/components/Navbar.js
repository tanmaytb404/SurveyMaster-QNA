import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Check if user is admin or editor
  const isAdmin = isAuthenticated && user && user.access_type === 'administrator';
  const isEditor = isAuthenticated && user && (user.access_type === 'administrator' || user.access_type === 'editor');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Question Management System</Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/questions">Questions</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/templates">Templates</Link>
                </li>
                {isAdmin && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">Admin</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/audit">Audit Logs</Link>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link" 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 