import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg border-0 rounded-lg mt-5">
            <div className="card-body p-5">
              <div className="text-center">
                <h1 className="display-4 fw-bold">Question Management System</h1>
                <p className="lead mb-4">Manage and organize your questions with ease</p>
              </div>
              
              {isAuthenticated ? (
                <div className="text-center mt-4">
                  <h2 className="mb-3">Welcome, {user.username}!</h2>
                  <div className="row justify-content-center mt-4">
                    <div className="col-md-6">
                      <div className="d-grid gap-2">
                        <Link to="/questions" className="btn btn-primary btn-lg">
                          View Questions
                        </Link>
                        <Link to="/questions/add" className="btn btn-outline-primary btn-lg">
                          Add New Question
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center mt-4">
                  <p className="lead">Please log in to get started</p>
                  <Link to="/login" className="btn btn-primary btn-lg mt-3">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 